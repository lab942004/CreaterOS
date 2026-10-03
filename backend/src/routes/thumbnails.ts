import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, notFound, ok } from '../utils/errors';
import { AuthRequest, requireWorkspace } from '../middleware/auth';

const router = Router();
router.use(requireWorkspace);

// SCREEN 25 — THUMBNAIL LAB
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const thumbnails = await prisma.thumbnail.findMany({
      where: { workspaceId: req.workspaceId! },
      orderBy: { createdAt: 'desc' },
    });
    ok(res, { thumbnails });
  })
);

router.post(
  '/generate',
  asyncHandler(async (req: AuthRequest, res) => {
    const { title, platform } = req.body ?? {};
    const thumbnail = await prisma.thumbnail.create({
      data: {
        workspaceId: req.workspaceId!,
        title: title || 'AI Generated Thumbnail',
        imageUrl:
          'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop&q=80',
        platform: platform === 'TIKTOK' || platform === 'INSTAGRAM' ? platform : 'YOUTUBE',
        template: 'AI Variant',
        colors: ['#7C3AED', '#3B82F6'],
        variantGroup: 'AI Variant',
        clickEstimate: 15.4,
      },
    });
    ok(res, { success: true, thumbnail }, 'Thumbnail generated.', 201);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const thumbnail = await prisma.thumbnail.findFirst({
      where: { id: req.params.id, workspaceId: req.workspaceId! },
    });
    if (!thumbnail) throw notFound('Thumbnail not found.');
    await prisma.thumbnail.delete({ where: { id: thumbnail.id } });
    ok(res, { success: true }, 'Thumbnail deleted.');
  })
);

export default router;
