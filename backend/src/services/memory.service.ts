import { prisma } from '../utils/prisma';
import { aiProvider } from '../ai/provider';

/**
 * Per-user memory layer ("RAG that gets sharper over time").
 *
 * The goal is *not* to retrain the model. Retraining per user is unaffordable
 * and cannot be served at request time. Instead this layer:
 *
 *   1. stores durable facts about a creator (`CreatorMemory`),
 *   2. recalls the most relevant ones per request (vector cosine when an
 *      embedding model is available, keyword overlap otherwise),
 *   3. reinforces the facts that get used, so useful ones surface first, and
 *   4. distils outcomes (a post that flopped, a hook that worked) back into new
 *      memories.
 *
 * Net effect: the *system* improves per user, on top of one shared base model.
 */

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'about', 'into', 'from',
  'that', 'this', 'these', 'those', 'your', 'you', 'our', 'was', 'were', 'are',
  'what', 'how', 'why', 'when', 'which', 'best', 'good', 'make', 'more', 'less',
]);

const tokens = (text: string): string[] =>
  String(text)
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));

/** Cosine similarity between two equal-length vectors. */
export const cosine = (a: number[], b: number[]): number => {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
};

/** Embeds text, returning `null` when no embedding model is configured. */
const embedText = async (text: string): Promise<number[] | null> => {
  if (!aiProvider.embed) return null;
  try {
    const result = await aiProvider.embed(text);
    return result?.vector ?? null;
  } catch {
    return null;
  }
};

export interface RecalledMemory {
  id: string;
  key: string;
  value: string;
  category: string;
  score: number;
  source: 'vector' | 'keyword';
}

const asVector = (raw: unknown): number[] | null =>
  Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'number' ? (raw as number[]) : null;

/**
 * Selects the memories most relevant to `query` for one workspace.
 *
 * Blends three signals so a weak embedding setup still behaves sensibly:
 * vector similarity, keyword overlap, and reinforcement from past usage.
 */
export const recallMemories = async (
  workspaceId: string,
  query: string,
  limit = 6
): Promise<RecalledMemory[]> => {
  const memories = await prisma.creatorMemory.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    take: 300,
  });

  if (memories.length === 0) return [];

  const queryTokens = new Set(tokens(query));
  const queryVector = query ? await embedText(query) : null;

  const scored = memories.map((m) => {
    const haystack = tokens(`${m.key} ${m.value}`);
    const overlap = queryTokens.size
      ? haystack.filter((t) => queryTokens.has(t)).length / queryTokens.size
      : 0;

    let vectorScore = 0;
    const stored = asVector(m.embedding);
    if (queryVector && stored) vectorScore = cosine(queryVector, stored);

    // Reinforcement: facts that proved useful rank higher over time.
    const usageBoost = Math.min(0.15, (m.useCount ?? 0) * 0.03);
    const recencyBoost = m.lastUsedAt ? 0.05 : 0;

    return {
      id: m.id,
      key: m.key,
      value: m.value,
      category: m.category,
      score: Math.max(vectorScore, overlap) + usageBoost + recencyBoost,
      source: (vectorScore > overlap ? 'vector' : 'keyword') as RecalledMemory['source'],
    };
  });

  const relevant = scored.filter((s) => s.score > 0.02).sort((a, b) => b.score - a.score);

  // With no query signal at all, keep the most reinforced / recent.
  const chosen = relevant.length
    ? relevant.slice(0, limit)
    : scored.sort((a, b) => b.score - a.score).slice(0, Math.min(limit, 3));

  if (chosen.length) {
    await prisma.creatorMemory.updateMany({
      where: { id: { in: chosen.map((c) => c.id) } },
      data: { useCount: { increment: 1 }, lastUsedAt: new Date() },
    });
  }

  return chosen;
};

/** Renders recalled memories as a prompt fragment. Empty string when none. */
export const formatMemories = (memories: RecalledMemory[]): string => {
  if (!memories.length) return '';
  const lines = memories.map((m) => `- [${m.category}] ${m.key}: ${m.value}`);
  return `What you already know about this creator (apply it, do not restate it):\n${lines.join('\n')}`;
};

/**
 * Saves a fact, replacing an existing memory with the same key so the store does
 * not accumulate contradictory duplicates.
 */
export const remember = async (
  workspaceId: string,
  key: string,
  value: string,
  category = 'GENERAL'
): Promise<{ id: string; created: boolean }> => {
  const existing = await prisma.creatorMemory.findFirst({ where: { workspaceId, key } });
  const embedding = await embedText(`${key}: ${value}`);

  if (existing) {
    await prisma.creatorMemory.update({
      where: { id: existing.id },
      data: { value, category, ...(embedding ? { embedding } : {}) },
    });
    return { id: existing.id, created: false };
  }

  const created = await prisma.creatorMemory.create({
    data: { workspaceId, key, value, category, ...(embedding ? { embedding } : {}) },
  });
  return { id: created.id, created: true };
};

/** Drops the least-used memories once the store grows past `maxUnused`. */
export const pruneMemories = async (workspaceId: string, maxUnused = 200): Promise<number> => {
  const total = await prisma.creatorMemory.count({ where: { workspaceId } });
  if (total <= maxUnused) return 0;

  const stale = await prisma.creatorMemory.findMany({
    where: { workspaceId },
    orderBy: [{ useCount: 'asc' }, { createdAt: 'asc' }],
    take: total - maxUnused,
    select: { id: true },
  });

  if (stale.length) {
    await prisma.creatorMemory.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
  }
  return stale.length;
};

/**
 * Turns a published result into a durable lesson.
 *
 * This is the "gets smarter over time" mechanism: after enough posts, advice
 * is grounded in the creator's own measured evidence instead of generic
 * platitudes. Thresholds are deliberately conservative so one lucky post does
 * not become gospel.
 */
export const learnFromContent = async (
  workspaceId: string,
  contentId: string
): Promise<{ learned: string[] }> => {
  const content = await prisma.content.findFirst({ where: { id: contentId, workspaceId } });
  if (!content) return { learned: [] };

  const peers = await prisma.content.findMany({
    where: { workspaceId, id: { not: contentId } },
    select: { engagementRate: true },
  });
  if (peers.length < 3) return { learned: [] };

  const avg = peers.reduce((sum, p) => sum + (p.engagementRate ?? 0), 0) / (peers.length || 1);
  const mine = content.engagementRate ?? 0;
  const ratio = avg > 0 ? mine / avg : 1;

  const learned: string[] = [];

  if (ratio >= 1.3) {
    const lesson = `On ${content.platform}, "${content.title}" (${content.type}) beat this creator's average engagement by ${Math.round((ratio - 1) * 100)}%. Reuse this format and topic angle.`;
    await remember(workspaceId, `winner_${content.platform}_${content.type}`, lesson, 'PERFORMANCE');
    learned.push(lesson);
  } else if (ratio <= 0.7) {
    const lesson = `"${content.title}" (${content.platform}/${content.type}) underperformed at ${mine}% vs ${avg.toFixed(1)}% average. Avoid this topic/format pairing for now.`;
    await remember(workspaceId, `underperformer_${content.id}`, lesson, 'PERFORMANCE');
    learned.push(lesson);
  }

  if ((content.watchTimeMinutes ?? 0) > 20 && mine >= avg) {
    const lesson = `Long-form retention works for this creator: "${content.title}" held ${content.watchTimeMinutes} minutes of watch time.`;
    await remember(workspaceId, 'retention_strength', lesson, 'AUDIENCE');
    learned.push(lesson);
  }

  return { learned };
};
