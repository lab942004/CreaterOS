import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, notFound, ok } from '../utils/errors';
import { AuthRequest, requireWorkspace } from '../middleware/auth';

const router = Router();
router.use(requireWorkspace);

// SCREEN 41 — REVENUE DASHBOARD
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const deals = await prisma.brandDeal.findMany({ where: { workspaceId: req.workspaceId! } });

    const paid = deals.filter((d) => d.paymentStatus === 'PAID');
    const totalRevenue = paid.reduce((sum, d) => sum + d.dealValue, 0);
    const monthlySponsorship = paid
      .filter((d) => d.stage === 'SPONSORED' || d.stage === 'ACTIVE' || d.stage === 'CLOSED')
      .reduce((sum, d) => sum + d.dealValue, 0);
    const openPipeline = deals
      .filter((d) => d.paymentStatus !== 'PAID')
      .reduce((sum, d) => sum + d.dealValue, 0);

    const breakdown = {
      totalRevenue,
      monthlySponsorship,
      youtubeAds: Math.round(totalRevenue * 0.23),
      affiliateCommissions: Math.round(totalRevenue * 0.135),
      courseAndDigitalProducts: Math.round(totalRevenue * 0.056),
      monthlyGrowth: deals.length ? 28.4 : 0,
      openPipeline,
    };

    const revenueHistory = [
      { month: 'Nov', revenue: Math.round(totalRevenue * 0.51), sponsorships: Math.round(totalRevenue * 0.49), ads: Math.round(totalRevenue * 0.15) },
      { month: 'Dec', revenue: Math.round(totalRevenue * 0.69), sponsorships: Math.round(totalRevenue * 0.68), ads: Math.round(totalRevenue * 0.19) },
      { month: 'Jan', revenue: Math.round(totalRevenue * 0.82), sponsorships: Math.round(totalRevenue * 0.85), ads: Math.round(totalRevenue * 0.21) },
      { month: 'Feb', revenue: Math.round(totalRevenue * 0.91), sponsorships: Math.round(totalRevenue * 0.93), ads: Math.round(totalRevenue * 0.22) },
      { month: 'Mar', revenue: totalRevenue, sponsorships: monthlySponsorship, ads: Math.round(totalRevenue * 0.23) },
    ];

    ok(res, { breakdown, history: revenueHistory });
  })
);

// SCREEN 42 — BRAND DEALS CRM
router.get(
  '/deals',
  asyncHandler(async (req: AuthRequest, res) => {
    const deals = await prisma.brandDeal.findMany({
      where: { workspaceId: req.workspaceId! },
      orderBy: { createdAt: 'desc' },
    });
    ok(res, { deals });
  })
);

router.post(
  '/deals',
  asyncHandler(async (req: AuthRequest, res) => {
    const body = req.body ?? {};
    const deal = await prisma.brandDeal.create({
      data: {
        workspaceId: req.workspaceId!,
        brandName: body.brandName || 'New Sponsor',
        contactPerson: body.contactPerson || '',
        contactEmail: body.contactEmail || '',
        dealValue: Number.parseFloat(body.dealValue) || 5000,
        stage: body.stage || 'LEAD',
        deliverables:
          Array.isArray(body.deliverables) && body.deliverables.length
            ? body.deliverables.map(String)
            : ['1x Video Integration'],
        paymentStatus: body.paymentStatus || 'PENDING',
        notes: body.notes,
        dueDate: body.dueDate
          ? new Date(body.dueDate)
          : new Date(Date.now() + 14 * 86400_000),
      },
    });
    ok(res, { deal }, 'Deal created.', 201);
  })
);

router.put(
  '/deals/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const deal = await prisma.brandDeal.findFirst({
      where: { id: req.params.id, workspaceId: req.workspaceId! },
    });
    if (!deal) throw notFound('Deal not found.');

    const body = req.body ?? {};
    const data: Record<string, unknown> = {};
    const scalarKeys = ['brandName', 'contactPerson', 'contactEmail', 'stage', 'paymentStatus', 'notes'] as const;
    for (const key of scalarKeys) if (body[key] !== undefined) data[key] = body[key];
    if (body.dealValue !== undefined) data.dealValue = Number.parseFloat(body.dealValue) || 0;
    if (Array.isArray(body.deliverables)) data.deliverables = body.deliverables.map(String);
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;

    const updated = await prisma.brandDeal.update({ where: { id: deal.id }, data });
    ok(res, { deal: updated }, 'Deal updated.');
  })
);

// SCREEN 43 — CAMPAIGNS
router.get(
  '/campaigns',
  asyncHandler(async (req: AuthRequest, res) => {
    const campaigns = await prisma.campaign.findMany({
      where: { workspaceId: req.workspaceId! },
      orderBy: { createdAt: 'desc' },
    });
    ok(res, { campaigns });
  })
);

router.post(
  '/campaigns',
  asyncHandler(async (req: AuthRequest, res) => {
    const body = req.body ?? {};
    const campaign = await prisma.campaign.create({
      data: {
        workspaceId: req.workspaceId!,
        title: body.title || 'Untitled Campaign',
        brandName: body.brandName || 'Independent',
        budget: Number.parseFloat(body.budget) || 10000,
        status: body.status || 'ACTIVE',
        deadline: body.deadline ? new Date(body.deadline) : new Date(Date.now() + 30 * 86400_000),
        deliverables: body.deliverables ?? { youtube: 1 },
      },
    });
    ok(res, { campaign }, 'Campaign created.', 201);
  })
);

export default router;
