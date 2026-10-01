import { Router } from 'express';
import { dbStore } from '../utils/store';
import { aiProvider } from '../ai/provider';

const router = Router();

// SCREEN 06 — DASHBOARD
router.get('/', (req, res) => {
  const contents = dbStore.contents;
  const totalViews = contents.reduce((acc, c) => acc + (c.views || 0), 0) + 1240000;
  const totalFollowers = dbStore.socials.reduce((acc, s) => acc + (s.followers || 0), 0);
  const totalEngagement = 11.4;
  const totalPublished = contents.filter(c => c.status === 'PUBLISHED').length;
  const totalRevenue = 35500;

  const topPerforming = [...contents].sort((a, b) => b.views - a.views).slice(0, 3);
  const recentContent = [...contents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);
  const upcomingContent = contents.filter(c => c.status === 'SCHEDULED');

  res.json({
    metrics: {
      totalViews,
      totalFollowers,
      engagementRate: totalEngagement,
      contentPublished: totalPublished,
      monthlyRevenue: totalRevenue,
      growthRate: 24.6
    },
    topPerforming,
    recentContent,
    upcomingContent,
    socialAccounts: dbStore.socials,
    opportunities: dbStore.opportunities.slice(0, 2),
    aiRecommendations: [
      {
        id: 'rec_01',
        title: 'Optimal Post Window Detected',
        description: 'Publish your upcoming video "The Solopreneur AI Stack" at Thursday 3:00 PM EST for +35% higher initial reach.'
      },
      {
        id: 'rec_02',
        title: 'Repurpose Spike Alert',
        description: 'Your TikTok audience is surging on AI clips. Extract 2 more snippets from your latest tutorial.'
      }
    ]
  });
});

export default router;
