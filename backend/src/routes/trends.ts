import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, ok } from '../utils/errors';
import { AuthRequest, requireWorkspace } from '../middleware/auth';

const router = Router();
router.use(requireWorkspace);

// SCREEN 29 — TREND DISCOVERY
router.get(
  '/trends',
  asyncHandler(async (req: AuthRequest, res) => {
    const trends = await prisma.trend.findMany({
      where: { workspaceId: req.workspaceId! },
      orderBy: { velocity: 'desc' },
    });
    ok(res, { trends });
  })
);

// SCREEN 30 — BENCHMARK STUDIO
router.get(
  '/benchmark',
  asyncHandler(async (req: AuthRequest, res) => {
    const workspaceId = req.workspaceId!;

    const contents = await prisma.content.findMany({ where: { workspaceId } });

    const published = contents.filter((c) => c.status === 'PUBLISHED');
    const longForm = contents.filter((c) => c.type === 'VIDEO' || c.type === 'ARTICLE');
    const avgLongFormViews = longForm.length
      ? Math.round(longForm.reduce((a, c) => a + c.views, 0) / longForm.length)
      : 0;
    const avgEngagement = published.length
      ? Number((published.reduce((a, c) => a + c.engagementRate, 0) / published.length).toFixed(1))
      : 0;
    const shorts = contents.filter((c) => c.type === 'SHORT' || c.type === 'REEL');
    const topShortViews = shorts.reduce((max, c) => Math.max(max, c.views), 0);
    const cadence = published.filter(
      (c) => c.publishedAt && Date.now() - new Date(c.publishedAt).getTime() < 30 * 86400_000
    ).length;

    const benchmarks = [
      {
        category: 'Views / Longform Video',
        user: avgLongFormViews,
        top10Percent: 120000,
        industryAvg: 34000,
        platform: 'YOUTUBE',
      },
      {
        category: 'Audience Engagement Rate',
        user: avgEngagement,
        top10Percent: 6.2,
        industryAvg: 3.1,
        platform: 'YOUTUBE',
      },
      {
        category: 'Short-Form Viral Velocity',
        user: topShortViews,
        top10Percent: 350000,
        industryAvg: 65000,
        platform: 'TIKTOK',
      },
      {
        category: 'Monthly Publishing Cadence',
        user: cadence,
        top10Percent: 12,
        industryAvg: 4,
        platform: 'ALL',
      },
    ];

    ok(res, { benchmarks });
  })
);

export default router;
