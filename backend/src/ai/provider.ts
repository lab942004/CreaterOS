import { config } from '../config';
import { recallMemories, formatMemories, type RecalledMemory } from '../services/memory.service';

/**
 * The contract every AI backend implements.
 *
 * Routes depend only on this interface, so swapping OpenAI / Hugging Face /
 * Anthropic / a local model is a config change rather than a code change.
 * Implementations must not throw when the model is simply unavailable —
 * callers surface a graceful fallback instead of a 500.
 */
export interface IAIProvider {
  /** Identifies the backend in logs and in the `AIUsage` table. */
  readonly name: string;

  generateText(prompt: string, context?: unknown, usage?: UsageContext): Promise<string>;
  generateIdeas(topic: string, niche: string, platform: string): Promise<any[]>;
  generateIdeas(topic: string, niche: string, platform: string, usage?: UsageContext): Promise<any[]>;
  generateScript(params: { topic: string; platform: string; tone: string; length: string }, usage?: UsageContext): Promise<any>;
  analyzeContent(content: any, usage?: UsageContext): Promise<any>;
  generateCaption(params: { topic: string; platform: string; tone: string }, usage?: UsageContext): Promise<string>;
  generateHashtags(topic: string, platform: string, usage?: UsageContext): Promise<string[]>;
  generateCTA(goal: string, platform: string, usage?: UsageContext): Promise<string>;
  chatWithStrategist(messages: any[], creatorBrain: any, usage?: UsageContext): Promise<string>;
  chatWithMyContent(question: string, userContent: any[], usage?: UsageContext): Promise<string>;

  /**
   * Embeds text for semantic recall in the memory layer.
   * Optional: implementations may return `null` when no embedding model is
   * configured, and callers fall back to keyword matching.
   */
  embed?(text: string): Promise<EmbeddingResult | null>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Per-call usage, recorded against the workspace so the admin console stays accurate. */
export interface UsageContext {
  userId?: string | null;
  workspaceId?: string | null;
  requestType: string;
}

export interface CompletionResult {
  text: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
}

export interface EmbeddingResult {
  vector: number[];
  model: string;
  promptTokens: number;
}

export class AIError extends Error {
  readonly provider: string;
  readonly status?: number;

  constructor(provider: string, message: string, status?: number) {
    super(message);
    this.name = 'AIError';
    this.provider = provider;
    this.status = status;
  }
}

/* ------------------------------------------------------------------ */
/* Shared prompt engineering                                           */
/* ------------------------------------------------------------------ */

/** Asks for strict JSON and tells the model what to do when it cannot comply. */
const jsonSystem = (task: string, shape: string) =>
  `You are the AI engine inside CreatorOS, a content operating system for creators.
Your task: ${task}

Respond with ONLY valid JSON matching this shape — no prose, no markdown fences:
${shape}

If you cannot satisfy the request, still return the shape with empty values.`;

const platformRule = (platform: string) =>
  `Target platform: ${platform}. Match its native conventions (length, tone, formatting, hashtag culture).`;

/** Extracts JSON from a model response that may be wrapped in prose or ``` fences. */
export const parseJsonLoose = <T>(text: string, fallback: T): T => {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) return fallback;
  const open = candidate[start];
  const close = open === '{' ? '}' : ']';
  const end = candidate.lastIndexOf(close);
  if (end <= start) return fallback;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  } catch {
    return fallback;
  }
};

/* ------------------------------------------------------------------ */
/* OpenAI-compatible chat client                                       */
/* ------------------------------------------------------------------ */

interface ChatClientOptions {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  model?: string;
  error?: { message?: string };
}

/**
 * Minimal `/chat/completions` client.
 *
 * Deliberately dependency-free (`fetch` only) so the same code drives OpenAI,
 * Hugging Face Inference Providers, Groq, Together, or a local Ollama server —
 * every one of them speaks the same wire format.
 */
export const chat = async (
  { provider, baseUrl, apiKey, model }: ChatClientOptions,
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
): Promise<CompletionResult> => {
  const startedAt = Date.now();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 1200,
        // Hugging Face and OpenAI both accept this; unknown models ignore it.
        ...(opts.jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: controller.signal,
    });

    const body = (await res.json().catch(() => null)) as ChatCompletionResponse | null;

    if (!res.ok) {
      const detail = body?.error?.message || `HTTP ${res.status}`;
      throw new AIError(provider, `${provider} request failed: ${detail}`, res.status);
    }

    const text = body?.choices?.[0]?.message?.content ?? '';
    if (!text.trim()) throw new AIError(provider, `${provider} returned an empty completion.`);

    return {
      text,
      model: body?.model || model,
      promptTokens: body?.usage?.prompt_tokens ?? 0,
      completionTokens: body?.usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - startedAt,
    };
  } catch (err) {
    if (err instanceof AIError) throw err;
    if ((err as Error)?.name === 'AbortError') {
      throw new AIError(provider, `${provider} request timed out.`);
    }
    throw new AIError(provider, `${provider} is unreachable: ${(err as Error).message}`);
  } finally {
    clearTimeout(timeout);
  }
};


/**
 * Deterministic offline provider.
 *
 * Used when no API key is configured so a fresh clone still renders every
 * screen with believable content instead of empty states or errors.
 */
export class MockAIProvider implements IAIProvider {
  readonly name = 'mock';
  async generateText(prompt: string, context?: any): Promise<string> {
    return 'AI Analysis & Strategy Response: Prioritizing 3s video hooks yields a 42% retention improvement.';
  }

  async generateIdeas(topic: string, niche: string, platform: string): Promise<any[]> {
    return [
      {
        title: `The 10-Minute ${topic || 'AI'} Breakthrough`,
        hook: 'Stop doing this manual workflow. Here is what 2026 creators are using instead.',
        format: platform === 'TIKTOK' || platform === 'INSTAGRAM' ? 'SHORT' : 'VIDEO',
        platform: platform || 'YOUTUBE',
        category: 'Tutorial & Breakdown',
        reason: 'Surging demand in viewer search for automated tools.',
        potentialScore: 94,
        cta: 'Comment GUIDE to get my free checklist.'
      },
      {
        title: 'Why I Replaced My Editing Suite With An AI Pipeline',
        hook: 'Here is what happens when you automate transcript clipping.',
        format: 'SHORT',
        platform: platform || 'TIKTOK',
        category: 'Hot Take',
        reason: 'Tool comparisons drive high comment density.',
        potentialScore: 91,
        cta: 'Do you agree? Let me know below.'
      },
      {
        title: 'From Zero to 100k Followers: The Exact Blueprint',
        hook: 'You do not need luck, you need these 4 calibrated content pillars.',
        format: 'CAROUSEL',
        platform: platform || 'LINKEDIN',
        category: 'Growth Case Study',
        reason: 'Saves and reposts drive 70% of distribution on this topic.',
        potentialScore: 88,
        cta: 'Save this swipe file for later.'
      }
    ];
  }

  async generateScript(params: { topic: string; platform: string; tone: string; length: string }): Promise<any> {
    return {
      title: `Script: Master ${params.topic}`,
      hook: `If you have been struggling with ${params.topic}, stop and watch this until the end.`,
      targetDuration: params.length || '60 seconds',
      scenes: [
        { sceneNumber: 1, visual: 'Speaker looking directly at lens, holding phone.', voiceover: 'Most creators spend 80% of time on dead tasks.', durationSec: 5 },
        { sceneNumber: 2, visual: 'CreatorOS dashboard clips view.', voiceover: 'CreatorOS pulls out 3 clips in 30 seconds.', durationSec: 15 },
        { sceneNumber: 3, visual: '12 hours vs 15 minutes diagram.', voiceover: 'The secret is building an automated loop.', durationSec: 20 },
        { sceneNumber: 4, visual: 'CTA screen.', voiceover: 'Check out the link in bio to test free.', durationSec: 10 }
      ],
      callToAction: 'Check link in bio or comment below!'
    };
  }

  async analyzeContent(content: any): Promise<any> {
    return {
      hookScore: 91,
      retentionScore: 88,
      clarityScore: 94,
      strengths: ['Hook grabs attention within 2.8s', 'Zero filler speech', 'Contextual graphics match speech'],
      weaknesses: ['End CTA could use audio contrast', 'Pattern interrupt needed at 3:30'],
      recommendations: ['Turn section 2 into a 45s vertical clip', 'Post follow-up poll in community tab']
    };
  }

  async generateCaption(params: { topic: string; platform: string; tone: string }): Promise<string> {
    return `Building with AI shouldn't feel like wrestling a spaceship. ðŸš€\n\nHow we streamlined our content workflow for ${params.topic}. Drop a comment with your biggest bottleneck! ðŸ‘‡`;
  }

  async generateHashtags(topic: string, platform: string): Promise<string[]> {
    return ['#CreatorOS', '#ContentCreation', '#AITools', '#ProductivityHacks', '#TechCreator'];
  }

  async generateCTA(goal: string, platform: string): Promise<string> {
    return 'Save this post for your next project and comment SYSTEM for our checklist!';
  }

  async chatWithStrategist(messages: any[], creatorBrain: any): Promise<string> {
    return `Strategic recommendation for ${creatorBrain?.pillars?.join(', ') || 'Tech, AI'}:\n1. High-Intent Topics: Focus on agent architecture.\n2. Repurposing: Convert longform tutorials into vertical shorts.\n3. Brand Monetization: Increase CPM rate based on 14.3% engagement spike.`;
  }

  async chatWithMyContent(question: string, userContent: any[]): Promise<string> {
    return `Querying your content database (${userContent.length} items):\n- Top performing: "Building an AI Agent in 10 Minutes" (184.5k views, 8.8% engagement).\n- Hands-on tutorials retain 64% more viewers.\n- Suggested next post: "Connecting Your AI Agent to APIs in 10 Minutes".`;
  }
}

/* ------------------------------------------------------------------ */
/* Embeddings (used by the per-user memory / RAG layer)                */
/* ------------------------------------------------------------------ */

interface EmbeddingResponse {
  data?: { embedding?: number[]; index?: number }[];
  model?: string;
  usage?: { prompt_tokens?: number; total_tokens?: number };
  error?: { message?: string };
}

/**
 * Calls `/embeddings` on the configured provider.
 *
 * Not every OpenAI-compatible endpoint serves embeddings — the Hugging Face
 * router notably does not — so this throws `AIError` and callers are expected
 * to degrade to keyword search rather than fail.
 */
export const embed = async (
  { provider, baseUrl, apiKey, model }: ChatClientOptions,
  input: string
): Promise<EmbeddingResult> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, input }),
      signal: controller.signal,
    });

    const body = (await res.json().catch(() => null)) as EmbeddingResponse | null;

    if (!res.ok) {
      const detail = body?.error?.message || `HTTP ${res.status}`;
      throw new AIError(provider, `${provider} embeddings failed: ${detail}`, res.status);
    }

    const vector = body?.data?.[0]?.embedding;
    if (!Array.isArray(vector) || vector.length === 0) {
      throw new AIError(provider, `${provider} returned an empty embedding.`);
    }

    return {
      vector,
      model: body?.model || model,
      promptTokens: body?.usage?.prompt_tokens ?? body?.usage?.total_tokens ?? 0,
    };
  } catch (err) {
    if (err instanceof AIError) throw err;
    if ((err as Error)?.name === 'AbortError') {
      throw new AIError(provider, `${provider} embedding request timed out.`);
    }
    throw new AIError(provider, `${provider} embeddings are unavailable: ${(err as Error).message}`);
  } finally {
    clearTimeout(timeout);
  }
};



/* ------------------------------------------------------------------ */
/* Real provider (OpenAI / Hugging Face / any OpenAI-compatible API)    */
/* ------------------------------------------------------------------ */

interface IdeaShape {
  title?: string;
  hook?: string;
  format?: string;
  platform?: string;
  category?: string;
  reason?: string;
  potentialScore?: number;
  cta?: string;
}

/**
 * Drives any `/chat/completions` endpoint.
 *
 * Every method routes through `run()`, so a provider outage degrades to the
 * deterministic mock output rather than failing the user's request — a caption
 * is never worth a 500. Usage is recorded per call so the admin console token
 * dashboard reflects real spend.
 */
export class LLMProvider implements IAIProvider {
  readonly name: string;

  private readonly client: ChatClientOptions;
  private readonly fallback = new MockAIProvider();
  private readonly onUsage?: (u: UsageContext, r: CompletionResult) => Promise<void> | void;

  constructor(
    client: ChatClientOptions,
    onUsage?: (u: UsageContext, r: CompletionResult) => Promise<void> | void
  ) {
    this.client = client;
    this.name = client.provider;
    this.onUsage = onUsage;
  }

  /** Single funnel: runs the prompt, records usage, falls back on failure. */
  private async run(
    messages: ChatMessage[],
    requestType: string,
    fallbackRun: () => Promise<any>,
    usage?: UsageContext,
    opts: { jsonMode?: boolean; maxTokens?: number } = {}
  ): Promise<any> {
    try {
      const result = await chat(this.client, messages, {
        temperature: config.ai.temperature,
        maxTokens: opts.maxTokens ?? config.ai.maxOutputTokens,
        jsonMode: opts.jsonMode ?? config.ai.jsonMode,
      });

      if (this.onUsage) {
        // `onUsage` may be sync or async; normalise so a logging failure can
        // never break the user's request.
        await Promise.resolve(this.onUsage({ requestType, ...(usage || {}) }, result)).catch((e) =>
          console.error('[ai] usage logging failed', e)
        );
      }
      return result;
    } catch (err) {
      const e = err as AIError;
      // 401/403 means the key itself is wrong — a config bug worth surfacing
      // loudly rather than hiding behind mock content indefinitely.
      if (e.status === 401 || e.status === 403) {
        console.error(`[ai] ${this.name} rejected the API key — check your credentials.`);
      } else {
        console.warn(`[ai] ${this.name} unavailable (${e.message}); serving fallback output.`);
      }
      return fallbackRun();
    }
  }

  async generateText(prompt: string, usage?: UsageContext): Promise<string> {
    const r = await this.run(
      [
        { role: 'system', content: 'You are a concise content strategist. Answer directly.' },
        { role: 'user', content: prompt },
      ],
      'generateText',
      () => this.fallback.generateText(prompt),
      usage,
      { jsonMode: false }
    );
    return (r?.text || '').trim() || this.fallback.generateText(prompt);
  }

  async generateIdeas(topic: string, niche: string, platform: string, usage?: UsageContext): Promise<any[]> {
    const shape = `{"ideas":[{"title":"","hook":"","format":"VIDEO|SHORT|REEL|CAROUSEL|ARTICLE|POST","platform":"${platform}","category":"","reason":"","potentialScore":0,"cta":""}]}`;
    const r = await this.run(
      [
        {
          role: 'system',
          content: jsonSystem(
            `Generate exactly 3 high-potential content ideas about "${topic || 'AI and creator tools'}" for the "${niche || 'tech'}" niche. ${platformRule(platform)} Score potentialScore 0-100.`,
            shape
          )
        },
        { role: 'user', content: `Topic: ${topic}. Niche: ${niche}. Platform: ${platform}.` },
      ],
      'generateIdeas',
      () => this.fallback.generateIdeas(topic, niche, platform)
    );

    const parsed = parseJsonLoose<{ ideas?: IdeaShape[] }>(r?.text || '', { ideas: [] });
    const ideas = (parsed.ideas || []).filter((i) => i?.title);
    return ideas.length ? ideas : this.fallback.generateIdeas(topic, niche, platform);
  }

  async generateScript(params: { topic: string; platform: string; tone: string; length: string }, usage?: UsageContext): Promise<any> {
    const shape = `{"title":"","hook":"","targetDuration":"${params.length}","scenes":[{"sceneNumber":1,"visual":"","voiceover":"","durationSec":5}],"callToAction":""}`;
    const r = await this.run(
      [
        {
          role: 'system',
          content: jsonSystem(
            `Write a ${params.length} video script for "${params.topic}". Tone: ${params.tone}. ${platformRule(params.platform)} Break it into scenes that sum to the target duration.`,
            shape
          )
        },
        { role: 'user', content: JSON.stringify(params) },
      ],
      'generateScript',
      () => this.fallback.generateScript(params),
      usage,
      { maxTokens: 1600 }
    );

    const parsed = parseJsonLoose<any>(r?.text || '', null);
    return parsed?.scenes?.length ? parsed : this.fallback.generateScript(params);
  }

  async analyzeContent(content: any, usage?: UsageContext): Promise<any> {
    const shape = `{"hookScore":0,"retentionScore":0,"clarityScore":0,"strengths":[""],"weaknesses":[""],"recommendations":[""]}`;
    const r = await this.run(
      [
        {
          role: 'system',
          content: jsonSystem(
            'Score this piece of content 0-100 on hook, retention and clarity. Be specific and critical, not flattering.',
            shape
          )
        },
        {
          role: 'user',
          content: `Title: ${content?.title}\nFormat: ${content?.type}\nViews: ${content?.views}\nWatch time (min): ${content?.watchTimeMinutes}\nEngagement %: ${content?.engagementRate}`,
        },
      ],
      'analyzeContent',
      () => this.fallback.analyzeContent(content),
      usage
    );

    const parsed = parseJsonLoose<any>(r?.text || '', null);
    return parsed?.hookScore !== undefined ? parsed : this.fallback.analyzeContent(content);
  }

  /** Recalls workspace memories as a prompt fragment; never throws. */
  private async recall(usage: UsageContext | undefined, query: string, limit: number): Promise<string> {
    const workspaceId = usage?.workspaceId;
    if (!workspaceId) return '';
    try {
      return formatMemories(await recallMemories(workspaceId, query, limit));
    } catch {
      return '';
    }
  }

  async generateCaption(params: { topic: string; platform: string; tone: string }, usage?: UsageContext): Promise<string> {
    // Recall on topic+platform so the caption leans on proven past winners.
    const memories = await this.recall(usage, `${params.topic} ${params.platform}`, 4);
    const r = await this.run(
      [
        {
          role: 'system',
          content: `Write one engaging social caption about "${params.topic}". Tone: ${params.tone}. ${platformRule(params.platform)} Return only the caption text, no hashtags, no preamble, no quotes.${memories ? `\n\n${memories}` : ''}`,
        },
      ],
      'generateCaption',
      () => this.fallback.generateCaption(params),
      usage,
      { jsonMode: false }
    );
    return (r?.text || '').trim() || this.fallback.generateCaption(params);
  }

  async generateHashtags(topic: string, platform: string, usage?: UsageContext): Promise<string[]> {
    const r = await this.run(
      [
        {
          role: 'system',
          content: `Return ONLY a JSON array of 5 hashtags (each starting with #) for "${topic}" on ${platform}. Mix one broad, two mid-tail and two niche tags.`,
        },
      ],
      'generateHashtags',
      () => this.fallback.generateHashtags(topic, platform),
      usage
    );

    const parsed = parseJsonLoose<string[]>(r?.text || '', []);
    const tags = parsed
      .map((t) => String(t).trim())
      .filter((t) => t.startsWith('#'))
      .slice(0, 8);
    return tags.length ? tags : this.fallback.generateHashtags(topic, platform);
  }

  async generateCTA(goal: string, platform: string, usage?: UsageContext): Promise<string> {
    const r = await this.run(
      [
        {
          role: 'system',
          content: `Write ONE short call-to-action for the goal "${goal}" on ${platform}. Return only the CTA text. No quotes, no preamble.`,
        },
      ],
      'generateCTA',
      () => this.fallback.generateCTA(goal, platform),
      usage,
      { jsonMode: false, maxTokens: 120 }
    );
    return (r?.text || '').trim() || this.fallback.generateCTA(goal, platform);
  }

  async chatWithStrategist(messages: any[], creatorBrain: any, usage?: UsageContext): Promise<string> {
    const brain = creatorBrain
      ? [
          creatorBrain.missionStatement && `Mission: ${creatorBrain.missionStatement}`,
          creatorBrain.pillars?.length && `Pillars: ${creatorBrain.pillars.join(', ')}`,
          creatorBrain.targetAudience && `Audience: ${creatorBrain.targetAudience}`,
          creatorBrain.rules?.length && `Rules: ${creatorBrain.rules.join('; ')}`,
        ]
          .filter(Boolean)
          .join('\n')
      : '';

    // Past turns give the recall query real signal about what they care about.
    const lastUserTurn = [...(messages ?? [])]
      .reverse()
      .find((m: any) => m?.role === 'user' && m?.content)?.content;

    const memories = await recallMemories(
      usage?.workspaceId || '',
      String(lastUserTurn ?? ''),
      6
    ).catch(() => [] as RecalledMemory[]);

    const memoryBlock = formatMemories(memories);

    const history = messages
      .filter((m: any) => m?.role && m?.content)
      .slice(-12)
      .map((m: any) => ({ role: m.role as ChatMessage['role'], content: String(m.content) }));

    const r = await this.run(
      [
        {
          role: 'system',
          content: `You are the AI Strategist inside CreatorOS. Give specific, actionable growth advice grounded in the creator's brand and hard-won lessons below. Prefer concrete numbers and clear next actions over platitudes.${brain ? `\n\nCreator brand:\n${brain}` : ''}${memoryBlock ? `\n\n${memoryBlock}` : ''}`,
        },
        ...history,
      ],
      'chatWithStrategist',
      () => this.fallback.chatWithStrategist(messages, creatorBrain),
      usage,
      { jsonMode: false, maxTokens: 900 }
    );
    return (r?.text || '').trim() || this.fallback.chatWithStrategist(messages, creatorBrain);
  }

  async chatWithMyContent(question: string, userContent: any[], usage?: UsageContext): Promise<string> {
    const table = userContent
      .slice(0, 25)
      .map(
        (c: any, i: number) =>
          `${i + 1}. "${c.title}" (${c.platform}/${c.type}) ${c.views} views, ${c.engagementRate}% engagement, ${c.watchTimeMinutes} min watch`
      )
      .join('\n');

    const r = await this.run(
      [
        {
          role: 'system',
          content:
            "You analyse a creator's published content. Answer using ONLY the library below and cite the numbers you used. If the data cannot answer the question, say so plainly.",
        },
        { role: 'user', content: `Question: ${question}\n\nContent library:\n${table || '(empty)'}` },
      ],
      'chatWithMyContent',
      () => this.fallback.chatWithMyContent(question, userContent),
      usage,
      { jsonMode: false, maxTokens: 700 }
    );
    return (r?.text || '').trim() || this.fallback.chatWithMyContent(question, userContent);
  }

  /**
   * Returns `null` when the configured provider exposes no embedding endpoint,
   * so the memory layer can fall back to keyword recall instead of failing.
   */
  async embed(text: string): Promise<EmbeddingResult | null> {
    try {
      return await embed(this.client, text);
    } catch (err) {
      const e = err as AIError;
      // 404 means the route simply does not exist on this endpoint.
      const unsupported = e.status === 404 || e.status === 405 || /embed/i.test(e.message);
      if (unsupported) {
        console.warn(
          `[ai] ${this.name} exposes no embeddings endpoint — memory recall falls back to keyword search.`
        );
        return null;
      }
      console.warn(`[ai] embedding failed (${e.message}); falling back to keyword search.`);
      return null;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Factory                                                            */
/* ------------------------------------------------------------------ */

/**
 * Persists a row in `AIUsage` so the admin console token dashboard and the
 * per-user budget widget show real numbers instead of staying at zero.
 * Imported lazily to keep this module usable in isolation (e.g. scripts).
 */
const recordUsage = (provider: string) => async (u: UsageContext, r: CompletionResult) => {
  if (!u.userId && !u.workspaceId) return;
  const { prisma } = await import('../utils/prisma');

  await prisma.aIUsage.create({
    data: {
      userId: u.userId ?? undefined,
      workspaceId: u.workspaceId ?? undefined,
      provider,
      model: r.model || 'unknown',
      requestType: u.requestType,
      tokenUsage: r.promptTokens + r.completionTokens,
      latencyMs: r.latencyMs,
      status: 'SUCCESS',
    },
  });
};

/**
 * Resolves the provider named by `AI_PROVIDER`.
 *
 * `auto` prefers OpenAI, then Hugging Face, then Anthropic, and finally falls
 * back to the deterministic mock so the app always boots and every screen has
 * something to render.
 */
const buildProvider = (): IAIProvider => {
  const { ai } = config;
  const requested = ai.provider;

  const make = (provider: string, baseUrl: string, apiKey: string, model: string): IAIProvider =>
    new LLMProvider({ provider, baseUrl, apiKey, model }, recordUsage(provider));

  if (requested === 'mock') return new MockAIProvider();

  if (requested === 'openai') {
    if (!ai.openaiApiKey) console.warn('[ai] AI_PROVIDER=openai but OPENAI_API_KEY is empty — using mock.');
    else return make('openai', ai.baseUrl || ai.openaiBaseUrl, ai.openaiApiKey, ai.model);
  }

  if (requested === 'huggingface') {
    if (!ai.huggingfaceApiKey) {
      console.warn('[ai] AI_PROVIDER=huggingface but HUGGINGFACE_API_KEY is empty — using mock.');
    } else {
      return make('huggingface', ai.baseUrl || ai.huggingfaceBaseUrl, ai.huggingfaceApiKey, ai.model);
    }
  }

  if (requested === 'anthropic' && ai.anthropicApiKey) {
    // Anthropic's Messages API is not OpenAI-compatible; route it through a
    // gateway instead of pretending it works.
    console.warn(
      '[ai] Anthropic needs a wire-format adapter or an OpenAI-compatible gateway. ' +
        'Falling back to the mock provider.'
    );
    return new MockAIProvider();
  }

  if (ai.openaiApiKey) return make('openai', ai.baseUrl || ai.openaiBaseUrl, ai.openaiApiKey, ai.model);
  if (ai.huggingfaceApiKey) {
    return make('huggingface', ai.baseUrl || ai.huggingfaceBaseUrl, ai.huggingfaceApiKey, ai.model);
  }

  console.warn('[ai] No API key configured — using the offline mock provider.');
  return new MockAIProvider();
};

export const aiProvider: IAIProvider = buildProvider();
