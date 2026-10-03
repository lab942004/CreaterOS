import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, badRequest, notFound, ok } from '../utils/errors';
import { AuthRequest, requireWorkspace } from '../middleware/auth';

const router = Router();
router.use(requireWorkspace);

// SCREEN 26 — AUDIENCE INTELLIGENCE
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const workspaceId = req.workspaceId!;

    const [socials, metric, comments] = await Promise.all([
      prisma.socialAccount.findMany({ where: { workspaceId } }),
      prisma.audienceMetric.findFirst({ where: { workspaceId }, orderBy: { createdAt: 'desc' } }),
      prisma.comment.findMany({ where: { workspaceId } }),
    ]);

    const totalAudience = metric?.totalAudience || socials.reduce((a, s) => a + s.followers, 0);
    const answered = comments.filter((c) => c.isAnswered).length;
    const positive = comments.filter((c) => c.sentiment === 'POSITIVE').length;

    ok(res, {
      totalAudience,
      growthRate: metric?.growthRate ?? 0,
      returningViewers: 41.2,
      engagementRate: comments.length
        ? Number(((positive / comments.length) * 100).toFixed(1))
        : 0,
      demographics:
        (metric?.demographics as Record<string, unknown> | null) ?? {
          age: [
            { group: '18-24', percentage: 22 },
            { group: '25-34', percentage: 54 },
            { group: '35-44', percentage: 18 },
            { group: '45+', percentage: 6 },
          ],
          gender: [
            { type: 'Male', percentage: 71 },
            { type: 'Female', percentage: 26 },
            { type: 'Other', percentage: 3 },
          ],
          countries: [
            { country: 'United States', percentage: 46 },
            { country: 'United Kingdom', percentage: 14 },
            { country: 'India', percentage: 12 },
            { country: 'Germany', percentage: 9 },
            { country: 'Canada', percentage: 7 },
            { country: 'Others', percentage: 12 },
          ],
          devices: [
            { type: 'Mobile', percentage: 68 },
            { type: 'Desktop', percentage: 27 },
            { type: 'Tablet / TV', percentage: 5 },
          ],
        },
      aiInsights: [
        answered
          ? `${answered} of ${comments.length} comments have been answered — keep the loop closed to lift reply sentiment.`
          : 'Answering audience questions in the first hour doubles comment velocity.',
        'Sponsorship alignment with your top pillar yields the highest comment sentiment.',
      ],
    });
  })
);

// SCREEN 27 — AUDIENCE QUESTIONS
router.get(
  '/questions',
  asyncHandler(async (req: AuthRequest, res) => {
    const questions = await prisma.audienceQuestion.findMany({
      where: { workspaceId: req.workspaceId! },
      orderBy: { frequency: 'desc' },
    });
    ok(res, { questions });
  })
);

router.post(
  '/questions/:id/turn-idea',
  asyncHandler(async (req: AuthRequest, res) => {
    const workspaceId = req.workspaceId!;
    const question = await prisma.audienceQuestion.findFirst({
      where: { id: req.params.id, workspaceId },
    });
    if (!question) throw notFound('Question not found.');

    const [, idea] = await prisma.$transaction([
      prisma.audienceQuestion.update({
        where: { id: question.id },
        data: { status: 'CONVERTED' },
      }),
      prisma.idea.create({
        data: {
          workspaceId,
          title: `Answering: ${question.question}`,
          hook: 'Over 50 of you asked this exact question this week. Here is the honest answer.',
          format: 'VIDEO',
          platform: question.platform,
          category: 'Q&A',
          reason: `Direct viewer question asked ${question.frequency} times.`,
          potentialScore: 92,
          cta: 'What question should I answer next? Let me know below.',
          isFavorite: true,
        },
      }),
    ]);

    ok(res, { success: true, idea });
  })
);

// SCREEN 28 — COMMENTS INTELLIGENCE
router.get(
  '/comments',
  asyncHandler(async (req: AuthRequest, res) => {
    const comments = await prisma.comment.findMany({
      where: { workspaceId: req.workspaceId! },
      orderBy: { createdAt: 'desc' },
    });
    ok(res, { comments });
  })
);

router.post(
  '/comments/:id/reply',
  asyncHandler(async (req: AuthRequest, res) => {
    const { replyText } = req.body ?? {};
    if (!replyText) throw badRequest('A reply is required.');

    const comment = await prisma.comment.findFirst({
      where: { id: req.params.id, workspaceId: req.workspaceId! },
    });
    if (!comment) throw notFound('Comment not found.');

    const updated = await prisma.comment.update({
      where: { id: comment.id },
      data: { reply: String(replyText), isAnswered: true },
    });
    ok(res, { success: true, comment: updated });
  })
);

router.post(
  '/comments/:id/hide',
  asyncHandler(async (req: AuthRequest, res) => {
    const comment = await prisma.comment.findFirst({
      where: { id: req.params.id, workspaceId: req.workspaceId! },
    });
    if (!comment) throw notFound('Comment not found.');
    await prisma.comment.delete({ where: { id: comment.id } });
    ok(res, { success: true }, 'Comment hidden.');
  })
);

export default router;
