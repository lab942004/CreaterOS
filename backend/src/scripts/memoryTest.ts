/**
 * Per-user memory / RAG layer test.
 *
 * Verifies the loop that makes CreatorOS "learn" per user:
 *   remember → recall (relevant first) → reinforcement → learn from outcomes
 *
 * Runs against the real database, so run it after `npm run seed`.
 * Uses a throwaway workspace and cleans up after itself.
 *
 * Run with: npm run test:memory
 */
import { prisma } from '../utils/prisma';
import {
  cosine,
  formatMemories,
  recallMemories,
  remember,
  learnFromContent,
  pruneMemories,
} from '../services/memory.service';

const results: { name: string; ok: boolean }[] = [];
const check = (name: string, cond: unknown, extra?: unknown) => {
  results.push({ name, ok: !!cond });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra !== undefined ? `  :: ${extra}` : ''}`);
};

const run = async () => {
  /* --- pure helpers -------------------------------------------- */
  check('cosine of identical vectors is 1', Math.abs(cosine([1, 2, 3], [1, 2, 3]) - 1) < 1e-9);
  check('cosine of orthogonal vectors is 0', Math.abs(cosine([1, 0], [0, 1])) < 1e-9);
  check('cosine rejects mismatched lengths', cosine([1, 2], [1, 2, 3]) === 0);
  check('cosine rejects empty input', cosine([], []) === 0);
  check('formatMemories is empty for no memories', formatMemories([]) === '');

  /* --- isolated workspace --------------------------------------- */
  const slug = `memory-test-${Date.now()}`;
  const user = await prisma.user.create({
    data: {
      email: `${slug}@test.local`,
      name: 'Memory Tester',
      password: 'x',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  const workspace = await prisma.workspace.create({
    data: { name: 'Memory Test', slug, ownerId: user.id, members: { create: { userId: user.id } } },
  });
  const ws = workspace.id;

  try {
    check('empty workspace recalls nothing', (await recallMemories(ws, 'anything')).length === 0);

    /* --- remember + dedupe -------------------------------------- */
    const a = await remember(ws, 'upload_cadence', 'Long-form on Tuesdays, shorts Mon/Wed/Fri', 'SCHEDULE');
    check('remember creates', a.created === true);
    const b = await remember(ws, 'upload_cadence', 'Long-form on Wednesdays now', 'SCHEDULE');
    check('re-remembering same key updates instead of duplicating', b.created === false && b.id === a.id);

    const rows = await prisma.creatorMemory.findMany({ where: { workspaceId: ws } });
    check('no duplicate rows after re-save', rows.length === 1, `${rows.length} row(s)`);
    check('value was updated', rows[0].value === 'Long-form on Wednesdays now', rows[0].value);

    await remember(ws, 'best_hook_style', 'Open with a contrarian claim, never a question', 'HOOKS');
    await remember(ws, 'audience_note', 'Core audience is agency freelancers aged 28-40', 'AUDIENCE');

    /* --- relevance ranking -------------------------------------- */
    const hooks = await recallMemories(ws, 'what hook style works best?', 3);
    check('recall returns memories', hooks.length > 0, `${hooks.length}`);
    check(
      'most relevant memory ranks first',
      hooks[0].key === 'best_hook_style',
      hooks.map((h) => h.key).join(' > ')
    );

    const sched = await recallMemories(ws, 'upload_cadence question', 2);
    check(
      'different query surfaces a different memory',
      sched.some((m) => m.key === 'upload_cadence'),
      sched.map((m) => m.key).join(' > ')
    );

    check('recall is capped by limit', (await recallMemories(ws, 'hook style', 1)).length <= 1);

    /* --- reinforcement ------------------------------------------ */
    const before = await prisma.creatorMemory.findUnique({ where: { id: a.id } });
    await recallMemories(ws, 'what hook style works best?', 3);
    const after2 = await prisma.creatorMemory.findUnique({ where: { id: a.id } });
    check(
      'recalled memory increments useCount',
      (after2?.useCount ?? 0) > (before?.useCount ?? 0),
      `${before?.useCount} -> ${after2?.useCount}`
    );
    check('recalled memory stamps lastUsedAt', !!after2?.lastUsedAt);
    check('formatMemories renders a prompt block', formatMemories(hooks).includes('best_hook_style'));

    /* --- learning from outcomes --------------------------------- */
    for (let i = 0; i < 4; i++) {
      await prisma.content.create({
        data: {
          workspaceId: ws,
          title: `Baseline post ${i}`,
          status: 'PUBLISHED',
          engagementRate: 5,
          views: 1000,
          type: 'VIDEO',
          platform: 'YOUTUBE',
        },
      });
    }

    const winner = await prisma.content.create({
      data: {
        workspaceId: ws,
        title: 'Breakout short with a contrarian hook',
        status: 'PUBLISHED',
        engagementRate: 20, // 4x the baseline -> clearly a winner
        views: 50000,
        watchTimeMinutes: 30,
        type: 'SHORT',
        platform: 'TIKTOK',
      },
    });

    const learned = await learnFromContent(ws, winner.id);
    check('learnFromContent extracts a lesson', learned.learned.length > 0, `${learned.learned.length} lesson(s)`);
    check(
      'lesson cites the winning format',
      learned.learned.some((l) => l.includes('TIKTOK') && l.includes('SHORT')),
      learned.learned[0]?.slice(0, 70)
    );
    check(
      'lesson is persisted as a memory',
      (await prisma.creatorMemory.count({ where: { workspaceId: ws } })) > 3
    );

    const recallLesson = await recallMemories(ws, 'what worked on TikTok?', 5);
    check(
      'learned lesson is recallable afterwards',
      recallLesson.some((m) => m.category === 'PERFORMANCE'),
      recallLesson.map((m) => `${m.key}[${m.category}]`).join(', ')
    );

    const loser = await prisma.content.create({
      data: {
        workspaceId: ws,
        title: 'Flopped carousel',
        status: 'PUBLISHED',
        engagementRate: 1, // far below baseline
        views: 200,
        type: 'CAROUSEL',
        platform: 'INSTAGRAM',
      },
    });
    const learnedLoss = await learnFromContent(ws, loser.id);
    check(
      'underperformer also produces a lesson',
      learnedLoss.learned.some((l) => l.includes('underperformed')),
      learnedLoss.learned[0]?.slice(0, 70)
    );

    /* --- guards + pruning --------------------------------------- */
    const missing = await learnFromContent(ws, 'does-not-exist');
    check('unknown contentId returns no lessons', missing.learned.length === 0);

    check('prune is a no-op below the cap', (await pruneMemories(ws, 500)) === 0);
  } finally {
    await prisma.workspace.delete({ where: { id: ws } }).catch(() => undefined);
    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('failing:');
    for (const f of failed) console.log(`  - ${f.name}`);
  }
  await prisma.$disconnect();
  process.exit(failed.length ? 1 : 0);
};

run().catch(async (e) => {
  console.error('memory test crashed:', e);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
