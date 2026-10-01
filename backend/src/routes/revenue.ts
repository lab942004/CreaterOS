import { Router } from 'express';
import { dbStore } from '../utils/store';

const router = Router();

// SCREEN 41 — REVENUE DASHBOARD
router.get('/', (req, res) => {
  const breakdown = {
    totalRevenue: 35500,
    monthlySponsorship: 20500,
    youtubeAds: 8200,
    affiliateCommissions: 4800,
    courseAndDigitalProducts: 2000,
    monthlyGrowth: 28.4
  };

  const revenueHistory = [
    { month: 'Nov', revenue: 18200, sponsorships: 10000, ads: 5400 },
    { month: 'Dec', revenue: 24500, sponsorships: 14000, ads: 6800 },
    { month: 'Jan', revenue: 29000, sponsorships: 17500, ads: 7400 },
    { month: 'Feb', revenue: 32400, sponsorships: 19000, ads: 7900 },
    { month: 'Mar', revenue: 35500, sponsorships: 20500, ads: 8200 }
  ];

  res.json({ breakdown, history: revenueHistory });
});

// SCREEN 42 — BRAND DEALS CRM
router.get('/deals', (req, res) => {
  res.json({ deals: dbStore.brandDeals });
});

router.post('/deals', (req, res) => {
  const newDeal = {
    id: `deal_${Date.now()}`,
    workspaceId: 'ws_main_01',
    brandName: req.body.brandName || 'New Sponsor',
    contactPerson: req.body.contactPerson || '',
    contactEmail: req.body.contactEmail || '',
    dealValue: parseFloat(req.body.dealValue) || 5000,
    stage: req.body.stage || 'LEAD',
    deliverables: req.body.deliverables || ['1x Video Integration'],
    paymentStatus: req.body.paymentStatus || 'PENDING',
    dueDate: req.body.dueDate || new Date(Date.now() + 14 * 86400000).toISOString()
  };

  dbStore.brandDeals.unshift(newDeal);
  res.status(201).json({ deal: newDeal });
});

router.put('/deals/:id', (req, res) => {
  const idx = dbStore.brandDeals.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Deal not found' });
  dbStore.brandDeals[idx] = { ...dbStore.brandDeals[idx], ...req.body };
  res.json({ deal: dbStore.brandDeals[idx] });
});

// SCREEN 43 — CAMPAIGNS
router.get('/campaigns', (req, res) => {
  res.json({ campaigns: dbStore.campaigns });
});

router.post('/campaigns', (req, res) => {
  const newCamp = {
    id: `cmp_${Date.now()}`,
    workspaceId: 'ws_main_01',
    title: req.body.title,
    brandName: req.body.brandName,
    budget: parseFloat(req.body.budget) || 10000,
    status: 'ACTIVE',
    deadline: req.body.deadline || new Date(Date.now() + 30 * 86400000).toISOString(),
    deliverables: req.body.deliverables || { youtube: 1 }
  };
  dbStore.campaigns.unshift(newCamp);
  res.status(201).json({ campaign: newCamp });
});

export default router;
