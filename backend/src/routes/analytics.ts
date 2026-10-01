import { Router } from 'express';
import { dbStore } from '../utils/store';

const router = Router();

// Overview
router.get('/overview', (req, res) => {
  const timeframe = (req.query.timeframe as string) || '30d';
  
  const growthSeries = [
    { date: 'Day 1', views: 42000, followers: 810000, engagement: 8.2 },
    { date: 'Day 5', views: 68000, followers: 824000, engagement: 9.1 },
    { date: 'Day 10', views: 95000, followers: 835000, engagement: 10.4 },
    { date: 'Day 15', views: 145000, followers: 852000, engagement: 11.2 },
    { date: 'Day 20', views: 210000, followers: 871000, engagement: 12.8 },
    { date: 'Day 25', views: 340000, followers: 890000, engagement: 13.5 },
    { date: 'Day 30', views: 420000, followers: 906900, engagement: 14.1 }
  ];

  res.json({
    timeframe,
    totals: {
      views: 1320000,
      watchTimeHours: 19800,
      followers: 906900,
      engagement: 11.4,
      likes: 84300,
      comments: 6720,
      shares: 19800
    },
    growthSeries,
    contentPerformance: dbStore.contents
  });
});

// Platform Breakdown
router.get('/platforms', (req, res) => {
  const platforms = dbStore.socials.map(soc => ({
    ...soc,
    views: soc.followers * 3.8,
    engagementRate: 8.5 + (soc.platform === 'TIKTOK' ? 4.2 : soc.platform === 'INSTAGRAM' ? 3.1 : 1.0),
    watchTimeHours: Math.round(soc.followers * 0.12),
    postingFrequency: '3x / week',
    bestContent: dbStore.contents.find(c => c.platform === soc.platform) || dbStore.contents[0],
    growth: '+18.4%'
  }));

  res.json({ platforms });
});

export default router;
