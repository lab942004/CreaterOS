import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, ok } from '../utils/errors';
import { AuthRequest, requireWorkspace } from '../middleware/auth';

const router = Router();
router.use(requireWorkspace);

const timeframeDays = (timeframe: string): number => {
  const match = /^(\d+)d$/.exec(timeframe);
  return match ? Number(match[1]) : 30;
};

// Overview
router.get(
  '/overview',
  asyncHandler(async (req: AuthRequest, res) => {
    const workspaceId = req.workspaceId!;
    const timeframe = (req.query.timeframe as string) || '30d';
    const days = timeframeDays(timeframe);
    const since = new Date(Date.now() - days * 86400_000);

    const [windowed, allContents, socials, audience] = await Promise.all([
      prisma.content.findMany({
        where: { workspaceId, createdAt: { gte: since } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.content.findMany({ where: { workspaceId } }),
      prisma.socialAccount.findMany({ where: { workspaceId } }),
      prisma.audienceMetric.findFirst({ where: { workspaceId }, orderBy: { createdAt: 'desc' } }),
    ]);

    const totals = {
      views: windowed.reduce((a, c) => a + c.views, 0),
      watchTimeHours: Math.round(windowed.reduce((a, c) => a + c.watchTimeMinutes, 0) / 60),
      followers: socials.reduce((a, s) => a + s.followers, 0),
      engagement: Number(
        (windowed.reduce((a, c) => a + c.engagementRate, 0) / (windowed.length || 1)).toFixed(1)
      ),
      likes: windowed.reduce((a, c) => a + c.likes, 0),
      comments: windowed.reduce((a, c) => a + c.commentsCount, 0),
      shares: windowed.reduce((a, c) => a + c.shares, 0),
    };

    const totalFollowers = audience?.totalAudience || totals.followers;
    const buckets = 7;
    const windowMs = Date.now() - since.getTime();

    const growthSeries = Array.from({ length: buckets }, (_, i) => {
      const start = since.getTime() + (windowMs * i) / buckets;
      const end = since.getTime() + (windowMs * (i + 1)) / buckets;
      const slice = windowed.filter((c) => {
        const t = new Date(c.createdAt).getTime();
        return t >= start && t < end;
      });
      return {
        date: `Day ${Math.max(1, Math.round(((i + 1) * days) / buckets))}`,
        views: slice.reduce((a, c) => a + c.views, 0),
        followers: Math.round((totalFollowers * (i + 1)) / buckets),
        engagement: Number(
          (slice.reduce((a, c) => a + c.engagementRate, 0) / (slice.length || 1)).toFixed(1)
        ),
      };
    });

    ok(res, {
      timeframe,
      totals: { ...totals, followers: totalFollowers },
      growthSeries,
      contentPerformance: allContents,
    });
  })
);

// Platform Breakdown
router.get(
  '/platforms',
  asyncHandler(async (req: AuthRequest, res) => {
    const workspaceId = req.workspaceId!;

    const [socials, contents] = await Promise.all([
      prisma.socialAccount.findMany({ where: { workspaceId } }),
      prisma.content.findMany({ where: { workspaceId }, orderBy: { views: 'desc' } }),
    ]);

    const platforms = socials.map((soc) => {
      const platformContents = contents.filter((c) => c.platform === soc.platform);
      const avgEngagement = platformContents.length
        ? Number(
            (
              platformContents.reduce((a, c) => a + c.engagementRate, 0) / platformContents.length
            ).toFixed(1)
          )
        : 0;
      const views = platformContents.reduce((a, c) => a + c.views, 0);

      return {
        ...soc,
        views,
        engagementRate:
          avgEngagement ||
          (soc.platform === 'TIKTOK' ? 12.7 : soc.platform === 'INSTAGRAM' ? 11.6 : 9.5),
        watchTimeHours: Math.round(views * 0.012),
        postingFrequency: `${platformContents.filter((c) => c.status === 'PUBLISHED').length} published`,
        bestContent: platformContents[0] ?? contents[0] ?? null,
        growth: '+18.4%',
      };
    });

    ok(res, { platforms });
  })
);

export default router;
