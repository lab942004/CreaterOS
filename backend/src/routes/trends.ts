import { Router } from 'express';
import { dbStore } from '../utils/store';

const router = Router();

// SCREEN 29 — TREND DISCOVERY
router.get('/trends', (req, res) => {
  res.json({ trends: dbStore.trends });
});

// SCREEN 30 — BENCHMARK STUDIO
router.get('/benchmark', (req, res) => {
  const benchmarks = [
    { category: 'Views / Longform Video', user: 184500, top10Percent: 120000, industryAvg: 34000, platform: 'YOUTUBE' },
    { category: 'Audience Engagement Rate', user: 8.8, top10Percent: 6.2, industryAvg: 3.1, platform: 'YOUTUBE' },
    { category: 'Short-Form Viral Velocity', user: 420000, top10Percent: 350000, industryAvg: 65000, platform: 'TIKTOK' },
    { category: 'Monthly Publishing Cadence', user: 8, top10Percent: 12, industryAvg: 4, platform: 'ALL' }
  ];
  res.json({ benchmarks });
});

export default router;
