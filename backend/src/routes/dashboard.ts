import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, ok } from '../utils/errors';
import { AuthRequest, requireWorkspace } from '../middleware/auth';

const router = Router();
router.use(requireWorkspace);

// SCREEN 06 — DASHBOARD
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const workspaceId = req.workspaceId!;

    const [contents, socials, opportunities, deals, audience] = await Promise.all([
      prisma.content.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' } }),
      prisma.socialAccount.findMany({ where: { workspaceId } }),
      prisma.opportunity.findMany({ where: { workspaceId }, orderBy: { impactScore: 'desc' } }),
      prisma.brandDeal.findMany({ where: { workspaceId } }),
      prisma.audienceMetric.findFirst({ where: { workspaceId }, orderBy: { createdAt: 'desc' } }),
    ]);

    const totalViews = contents.reduce((acc, c) => acc + c.views, 0);
    const totalFollowers = socials.reduce((acc, s) => acc + s.followers, 0);
    const totalPublished = contents.filter((c) => c.status === 'PUBLISHED').length;
    const scored = contents.filter((c) => c.engagementRate > 0);
    const totalEngagement = scored.length
      ? Number((scored.reduce((acc, c) => acc + c.engagementRate, 0) / scored.length).toFixed(1))
      : 0;
    const totalRevenue = deals
      .filter((d) => d.paymentStatus === 'PAID')
      .reduce((acc, d) => acc + d.dealValue, 0);

    const topPerforming = [...contents].sort((a, b) => b.views - a.views).slice(0, 3);
    const recentContent = contents.slice(0, 4);
    const upcomingContent = contents.filter((c) => c.status === 'SCHEDULED');

    const bestPlatform =
      [...socials].sort((a, b) => b.followers - a.followers)[0]?.platform ?? 'YOUTUBE';

    const aiRecommendations = [
      {
        id: 'rec_01',
        title: 'Optimal Post Window Detected',
        description: upcomingContent[0]
          ? `Publish "${upcomingContent[0].title}" at Thursday 3:00 PM EST for higher initial reach on ${bestPlatform}.`
          : 'Queue your next upload for Thursday 3:00 PM EST — your audience peaks mid-afternoon.',
      },
      {
        id: 'rec_02',
        title: 'Repurpose Spike Alert',
        description: topPerforming[0]
          ? `Extract 2 vertical snippets from "${topPerforming[0].title}" while it is still climbing.`
          : 'Your top-performing format is under-used — repurpose it into two shorts this week.',
      },
    ];

    ok(res, {
      metrics: {
        totalViews,
        totalFollowers,
        engagementRate: totalEngagement,
        contentPublished: totalPublished,
        monthlyRevenue: totalRevenue,
        growthRate: audience?.growthRate ?? 0,
      },
      topPerforming,
      recentContent,
      upcomingContent,
      socialAccounts: socials,
      opportunities: opportunities.slice(0, 2),
      aiRecommendations,
    });
  })
);

export default router;
