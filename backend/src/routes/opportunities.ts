import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, badRequest, notFound, ok } from '../utils/errors';
import { AuthRequest, requireWorkspace } from '../middleware/auth';

const router = Router();
router.use(requireWorkspace);

// SCREEN 13 — OPPORTUNITY CENTER
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const opportunities = await prisma.opportunity.findMany({
      where: { workspaceId: req.workspaceId! },
      orderBy: { impactScore: 'desc' },
    });
    ok(res, { opportunities });
  })
);

router.post(
  '/action',
  asyncHandler(async (req: AuthRequest, res) => {
    const { opportunityId, actionType } = req.body ?? {};
    const workspaceId = req.workspaceId!;

    const opp = await prisma.opportunity.findFirst({
      where: { id: opportunityId, workspaceId },
    });
    if (!opp) throw notFound('Opportunity not found.');

    if (actionType === 'create_content') {
      const content = await prisma.content.create({
        data: {
          workspaceId,
          title: opp.title,
          description: opp.description,
          caption: `Taking immediate advantage of content opportunity: ${opp.title}`,
          type: 'VIDEO',
          platform: opp.platform,
          status: 'DRAFT',
          tags: ['Opportunity', opp.type],
        },
      });
      return ok(res, {
        success: true,
        redirect: `/content/${content.id}`,
        content,
      });
    }

    if (actionType === 'turn_into_idea') {
      const idea = await prisma.idea.create({
        data: {
          workspaceId,
          title: opp.title,
          hook: `Why everyone is missing out on ${opp.title}`,
          format: 'VIDEO',
          platform: opp.platform,
          category: 'Opportunity',
          reason: opp.description,
          potentialScore: opp.impactScore,
          cta: 'Subscribe for part 2',
          isFavorite: true,
        },
      });
      return ok(res, { success: true, redirect: '/ideas', idea });
    }

    if (!actionType) throw badRequest('An action type is required.');
    ok(res, { success: true, message: 'Action executed successfully' });
  })
);

export default router;
