import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { asyncHandler, badRequest, notFound, ok } from '../utils/errors';
import { AuthRequest, requireWorkspace } from '../middleware/auth';
import { recallMemories, remember, learnFromContent } from '../services/memory.service';

const router = Router();
router.use(requireWorkspace);

const brainSchema = z.object({
  pillars: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  missionStatement: z.string().optional(),
  nicheContext: z.string().optional(),
  rules: z.array(z.string()).optional(),
});

const upsertBrain = (workspaceId: string) =>
  prisma.creatorBrain.upsert({
    where: { workspaceId },
    create: { workspaceId },
    update: {},
  });

const upsertKit = (workspaceId: string) =>
  prisma.brandKit.upsert({
    where: { workspaceId },
    create: { workspaceId },
    update: {},
  });

// SCREEN 37 — CREATOR BRAIN
router.get(
  '/brain',
  asyncHandler(async (req: AuthRequest, res) => {
    ok(res, { brain: await upsertBrain(req.workspaceId!) });
  })
);

router.put(
  '/brain',
  asyncHandler(async (req: AuthRequest, res) => {
    const workspaceId = req.workspaceId!;
    const patch = brainSchema.parse(req.body ?? {});
    await prisma.creatorBrain.upsert({
      where: { workspaceId },
      create: { workspaceId, ...patch },
      update: patch,
    });
    ok(res, { brain: await prisma.creatorBrain.findUnique({ where: { workspaceId } }) }, 'Creator Brain updated.');
  })
);

// SCREEN 38 — CREATOR MEMORY
router.get(
  '/memory',
  asyncHandler(async (req: AuthRequest, res) => {
    const memories = await prisma.creatorMemory.findMany({
      where: { workspaceId: req.workspaceId! },
      orderBy: { createdAt: 'desc' },
    });
    ok(res, { memories });
  })
);

router.post(
  '/memory',
  asyncHandler(async (req: AuthRequest, res) => {
    const { key, value, category } = req.body ?? {};
    if (!key || !value) throw badRequest('Memory key and value are required.');

    // `remember` upserts on key and embeds the value for semantic recall, so
    // re-saving the same key updates rather than duplicating.
    const { id, created } = await remember(
      req.workspaceId!,
      String(key),
      String(value),
      category ? String(category) : 'GENERAL'
    );
    const memory = await prisma.creatorMemory.findUnique({ where: { id } });
    ok(res, { memory }, created ? 'Memory saved.' : 'Memory updated.', created ? 201 : 200);
  })
);

/**
 * Probes which stored memories the AI would actually use for a given prompt.
 * Makes the learning loop visible instead of a black box.
 */
router.post(
  '/memory/recall',
  asyncHandler(async (req: AuthRequest, res) => {
    const { query, limit } = req.body ?? {};
    const memories = await recallMemories(req.workspaceId!, String(query ?? ''), Number(limit) || 6);
    ok(res, { memories });
  })
);

/** Distils a published post's performance into a durable lesson. */
router.post(
  '/memory/learn',
  asyncHandler(async (req: AuthRequest, res) => {
    const { contentId } = req.body ?? {};
    if (!contentId) throw badRequest('A contentId is required.');
    const result = await learnFromContent(req.workspaceId!, String(contentId));
    ok(res, result, result.learned.length ? 'Learned from that result.' : 'Not enough data to learn from yet.');
  })
);

router.delete(
  '/memory/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const found = await prisma.creatorMemory.findFirst({
      where: { id: req.params.id, workspaceId: req.workspaceId! },
    });
    if (!found) throw notFound('Memory not found.');
    await prisma.creatorMemory.delete({ where: { id: found.id } });
    ok(res, { success: true });
  })
);

// SCREEN 39 — BRAND KIT
router.get(
  '/kit',
  asyncHandler(async (req: AuthRequest, res) => {
    ok(res, { brandKit: await upsertKit(req.workspaceId!) });
  })
);

router.put(
  '/kit',
  asyncHandler(async (req: AuthRequest, res) => {
    const workspaceId = req.workspaceId!;
    const body = req.body ?? {};
    const patch: Record<string, unknown> = {};
    if (body.logoUrl !== undefined) patch.logoUrl = body.logoUrl;
    if (Array.isArray(body.colors)) patch.colors = body.colors;
    if (Array.isArray(body.fonts)) patch.fonts = body.fonts;
    if (body.brandVoice !== undefined) patch.brandVoice = body.brandVoice;
    if (body.handles !== undefined) patch.handles = body.handles;

    await prisma.brandKit.upsert({
      where: { workspaceId },
      create: { workspaceId, ...patch },
      update: patch,
    });
    ok(res, { brandKit: await prisma.brandKit.findUnique({ where: { workspaceId } }) }, 'Brand kit updated.');
  })
);

// SCREEN 40 — BRAND PREVIEW
router.get(
  '/preview',
  asyncHandler(async (req: AuthRequest, res) => {
    const workspaceId = req.workspaceId!;
    const [brandKit, owner] = await Promise.all([
      upsertKit(workspaceId),
      prisma.user.findFirst({
        where: { workspaces: { some: { workspaceId } } },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    ok(res, {
      brandKit,
      mockPostPreview: {
        creatorName: owner?.name ?? 'CreatorOS Creator',
        handle: '@creatoros',
        avatar:
          owner?.avatar ??
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        samplePost:
          'Why solo builders in 2026 are outpacing 50-person legacy agencies with automated workflow intelligence.',
        colors: brandKit.colors,
      },
    });
  })
);

export default router;
