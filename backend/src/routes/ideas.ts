import { Router } from 'express';
import { ContentType, PlatformType } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { asyncHandler, asEnum, notFound, ok } from '../utils/errors';
import { AuthRequest, requireWorkspace } from '../middleware/auth';
import { aiProvider } from '../ai/provider';

const router = Router();
router.use(requireWorkspace);

// SCREEN 12 — IDEAS
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const { category, platform } = req.query;
    const where: Record<string, unknown> = {
      workspaceId: req.workspaceId!,
      isArchived: false,
    };
    if (category && category !== 'ALL') where.category = String(category);
    const platformFilter = asEnum(platform, Object.values(PlatformType));
    if (platformFilter && platform !== 'ALL') where.platform = platformFilter;

    const ideas = await prisma.idea.findMany({ where, orderBy: { createdAt: 'desc' } });
    ok(res, { ideas });
  })
);

router.post(
  '/generate',
  asyncHandler(async (req: AuthRequest, res) => {
    const { topic, niche, platform } = req.body ?? {};
    const workspaceId = req.workspaceId!;

    const generated = await aiProvider.generateIdeas(
      String(topic ?? ''),
      String(niche ?? ''),
      String(platform ?? 'YOUTUBE'),
      { requestType: 'generateIdeas', userId: req.user?.id ?? null, workspaceId }
    );

    const created = await prisma.$transaction(
      generated.map((g) =>
        prisma.idea.create({
          data: {
            workspaceId,
            title: g.title,
            hook: g.hook,
            format: (asEnum(g.format, Object.values(ContentType)) ?? 'VIDEO') as ContentType,
            platform: (asEnum(g.platform, Object.values(PlatformType)) ?? 'YOUTUBE') as PlatformType,
            category: g.category ?? 'General',
            reason: g.reason,
            potentialScore: g.potentialScore ?? 80,
            cta: g.cta,
          },
        })
      )
    );

    ok(res, { ideas: created }, 'Ideas generated.', 201);
  })
);

router.post(
  '/:id/favorite',
  asyncHandler(async (req: AuthRequest, res) => {
    const idea = await prisma.idea.findFirst({
      where: { id: req.params.id, workspaceId: req.workspaceId! },
    });
    if (!idea) throw notFound('Idea not found.');

    const updated = await prisma.idea.update({
      where: { id: idea.id },
      data: { isFavorite: !idea.isFavorite },
    });
    ok(res, { idea: updated });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const idea = await prisma.idea.findFirst({
      where: { id: req.params.id, workspaceId: req.workspaceId! },
    });
    if (!idea) throw notFound('Idea not found.');
    await prisma.idea.delete({ where: { id: idea.id } });
    ok(res, { success: true }, 'Idea deleted.');
  })
);

// Convert Idea to Content
router.post(
  '/:id/convert-content',
  asyncHandler(async (req: AuthRequest, res) => {
    const workspaceId = req.workspaceId!;
    const idea = await prisma.idea.findFirst({ where: { id: req.params.id, workspaceId } });
    if (!idea) throw notFound('Idea not found.');

    const content = await prisma.content.create({
      data: {
        workspaceId,
        title: idea.title,
        description: `Generated from idea: ${idea.reason ?? idea.hook ?? ''}`.trim(),
        caption: [idea.hook, idea.cta].filter(Boolean).join('\n\n'),
        type: idea.format,
        platform: idea.platform,
        status: 'DRAFT',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
        tags: [idea.category, 'AI_Idea'],
      },
    });

    ok(res, { success: true, content }, 'Idea converted to a draft.', 201);
  })
);

// Convert Idea to Script
router.post(
  '/:id/convert-script',
  asyncHandler(async (req: AuthRequest, res) => {
    const idea = await prisma.idea.findFirst({
      where: { id: req.params.id, workspaceId: req.workspaceId! },
    });
    if (!idea) throw notFound('Idea not found.');

    const script = await aiProvider.generateScript({
      topic: idea.title,
      platform: idea.platform,
      tone: 'Engaging, Technical, Inspiring',
      length: '60 seconds',
    });

    ok(res, { success: true, script });
  })
);

export default router;
