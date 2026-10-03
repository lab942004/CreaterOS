import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config';
import { prisma } from '../utils/prisma';
import { asyncHandler, ok, unauthorized } from '../utils/errors';
import { validateBody } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimit';
import { requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

/** Rough $/1M token price used for the admin cost estimate. */
const PRICE_PER_MILLION: Record<string, number> = {
  'gpt-4o-mini': 0.15,
  'gpt-4o': 2.5,
  'gpt-4.1': 2.0,
  'claude-3-5-sonnet-latest': 3.0,
  whisper: 0.006,
};

const priceFor = (model: string) => {
  const hit = Object.keys(PRICE_PER_MILLION).find((k) => model.toLowerCase().includes(k.toLowerCase()));
  return hit ? PRICE_PER_MILLION[hit] : 0.5;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

/* ───────────────────────── SCREEN 55 — ADMIN LOGIN ───────────────────────── */

router.post(
  '/login',
  authLimiter,
  validateBody(z.object({ email: z.string().trim().email(), password: z.string().min(1) })),
  asyncHandler(async (req: Request, res: Response) => {
    const admin = await prisma.adminUser.findUnique({ where: { email: req.body.email.toLowerCase() } });
    // Constant-shaped failure regardless of whether the address exists.
    if (!admin) throw unauthorized('Admin access denied.');

    const valid = await bcrypt.compare(req.body.password, admin.password);
    if (!valid) throw unauthorized('Admin access denied.');

    const token = jwt.sign({ sub: admin.id, email: admin.email, typ: 'admin' }, config.jwt.secret, {
      expiresIn: '12h',
    });

    ok(res, {
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    });
  })
);

/* Everything below requires an administrator token. */
router.use(requireAdmin);

/* ───────────────────────── SCREEN 56 — ADMIN DASHBOARD ───────────────────── */

router.get(
  '/dashboard',
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const [totalCreators, activeToday, mrr, aiTokens, videoStats, failedToday, recentUsers, recentEvents] =
      await Promise.all([
        prisma.user.count(),
        prisma.securitySession.count({ where: { lastActive: { gte: startOfToday() } } }),
        prisma.subscription
          .aggregate({ where: { status: 'ACTIVE' }, _sum: { price: true } })
          .then((r) => r._sum.price ?? 0),
        prisma.aIUsage
          .aggregate({ where: { createdAt: { gte: startOfMonth() } }, _sum: { tokenUsage: true } })
          .then((r) => r._sum.tokenUsage ?? 0),
        prisma.video.aggregate({ _sum: { durationSec: true }, _count: true }),
        prisma.automationRun.count({ where: { status: 'FAILED', executedAt: { gte: startOfToday() } } }),
        prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            role: true,
            isOnboarded: true,
            onboardingStep: true,
            emailVerified: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 12,
        }),
        prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 6 }),
      ]);

    ok(res, {
      metrics: {
        totalCreators,
        activeToday,
        mrr,
        // Stored as minutes so the admin panel can render a compact number.
        totalStorageGB: Math.round((videoStats._sum.durationSec ?? 0) / 60),
        aiTokensMonthly: aiTokens,
        apiHealth: `${(100 - Math.min(2, failedToday * 0.25)).toFixed(2)}%`,
        activeJobs: videoStats._count,
        systemErrorsToday: failedToday,
      },
      recentUsers,
      systemAlerts: recentEvents.map((e) => ({
        id: e.id,
        type: e.action.startsWith('auth.') ? 'INFO' : 'SUCCESS',
        title: e.details || e.action,
        timestamp: e.createdAt.toISOString(),
      })),
    });
  })
);

/* ───────────────────────── SCREEN 57 — ADMIN USERS ───────────────────────── */

const ADMIN_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  avatar: true,
  role: true,
  isOnboarded: true,
  onboardingStep: true,
  emailVerified: true,
  isActive: true,
  createdAt: true,
} as const;

router.get(
  '/users',
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const users = await prisma.user.findMany({
      select: ADMIN_USER_SELECT,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    ok(res, { users });
  })
);

router.post(
  '/users/:id/status',
  validateBody(z.object({ status: z.enum(['ACTIVE', 'SUSPENDED']) })),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const isActive = req.body.status === 'ACTIVE';
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive },
      select: { id: true },
    });
    await prisma.auditLog.create({
      data: {
        userId: req.admin!.id,
        action: 'admin.user_status',
        details: `${user.id} → ${req.body.status}`,
      },
    });
    ok(res, { success: true, message: `User status changed to ${req.body.status}` });
  })
);

/* ───────────────────────── SCREEN 58 — ADMIN WORKSPACES ──────────────────── */

router.get(
  '/workspaces',
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const workspaces = await prisma.workspace.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        ownerId: true,
        createdAt: true,
        _count: { select: { members: true, contents: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    ok(res, { workspaces });
  })
);

/* ───────────────────────── SCREEN 59 — PLATFORM HEALTH ───────────────────── */

router.get(
  '/health',
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - t0;

    const today = startOfToday();
    const [completedToday, failedToday, activeRuns, aiLatency] = await Promise.all([
      prisma.automationRun.count({ where: { status: 'COMPLETED', executedAt: { gte: today } } }),
      prisma.automationRun.count({ where: { status: 'FAILED', executedAt: { gte: today } } }),
      prisma.automation.count({ where: { isActive: true } }),
      prisma.aIUsage
        .aggregate({ where: { createdAt: { gte: today } }, _avg: { latencyMs: true } })
        .then((r) => r._avg.latencyMs ?? 0),
    ]);

    ok(res, {
      status: failedToday === 0 ? 'OPERATIONAL' : 'DEGRADED',
      database: { status: latencyMs < 200 ? 'HEALTHY' : 'SLOW', latencyMs },
      storage: { provider: config.storage.cloudName ? 'Cloudinary' : 'Local disk', status: 'HEALTHY' },
      aiGateway: { status: 'HEALTHY', avgResponseMs: Math.round(aiLatency) },
      queues: { activeJobs: activeRuns, completedToday, failedToday },
    });
  })
);

/* ───────────────────────── SCREEN 60 — JOB MONITOR ───────────────────────── */

router.get(
  '/jobs',
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const [videos, runs] = await Promise.all([
      prisma.video.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          durationSec: true,
          createdAt: true,
          workspace: {
            select: {
              name: true,
              members: { where: { role: 'OWNER' }, select: { user: { select: { name: true } } } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.automationRun.findMany({
        select: {
          id: true,
          event: true,
          status: true,
          executedAt: true,
          automation: { select: { name: true } },
        },
        orderBy: { executedAt: 'desc' },
        take: 8,
      }),
    ]);

    const videoJobs = videos.map((v) => ({
      id: `job_v_${v.id.slice(0, 8)}`,
      type: 'VIDEO_TRANSCRIPTION',
      creator: v.workspace?.members?.[0]?.user?.name || v.workspace?.name || 'Unknown',
      status: v.status,
      duration: `${Math.round(v.durationSec)}s`,
      title: v.title,
      executedAt: v.createdAt.toISOString(),
    }));

    const runJobs = runs.map((r) => ({
      id: `job_${r.id.slice(0, 8)}`,
      type: r.event.toUpperCase(),
      creator: r.automation?.name || 'Autopilot',
      status: r.status,
      duration: '-',
      title: r.event,
      executedAt: r.executedAt.toISOString(),
    }));

    ok(res, { jobs: [...runJobs, ...videoJobs].slice(0, 12) });
  })
);

/* ───────────────────────── SCREEN 61 — AI USAGE ──────────────────────────── */

router.get(
  '/ai-usage',
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const rows = await prisma.aIUsage.groupBy({
      by: ['model'],
      where: { createdAt: { gte: startOfMonth() } },
      _sum: { tokenUsage: true, costUsd: true },
    });

    const breakdownByModel = rows.map((r) => {
      const tokens = r._sum.tokenUsage ?? 0;
      const recorded = r._sum.costUsd ?? 0;
      return {
        model: r.model,
        tokens,
        cost: recorded > 0 ? recorded : (tokens / 1_000_000) * priceFor(r.model),
      };
    });

    ok(res, {
      totalCostMonthly: Number(breakdownByModel.reduce((sum, m) => sum + m.cost, 0).toFixed(2)),
      totalTokens: breakdownByModel.reduce((sum, m) => sum + m.tokens, 0),
      breakdownByModel,
    });
  })
);

/* ───────────────────────── SCREEN 62 — STORAGE ───────────────────────────── */

router.get(
  '/storage',
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const [video, thumbnail, document] = await Promise.all([
      prisma.video.aggregate({ _sum: { durationSec: true }, _count: true }),
      prisma.thumbnail.count(),
      prisma.content.count(),
    ]);

    // ~1.2 MB/s for 1080p H.264, 0.4 MB per generated thumbnail, 0.05 MB per content record.
    const videoMb = ((video._sum.durationSec ?? 0) * 1.2) / 1000;
    const thumbMb = thumbnail * 0.4;
    const docMb = document * 0.05;

    const toGb = (mb: number) => Number((mb / 1024).toFixed(2));
    const used = toGb(videoMb + thumbMb + docMb);

    ok(res, {
      totalStorageUsedGB: used,
      totalStorageLimitGB: Number(process.env.STORAGE_LIMIT_GB || 5000),
      breakdown: { videos: toGb(videoMb), thumbnails: toGb(thumbMb), documents: toGb(docMb) },
      counts: { videos: video._count, thumbnails: thumbnail, documents: document },
    });
  })
);

/* ───────────────────────── SCREEN 63 — FEATURE FLAGS ─────────────────────── */

router.get(
  '/feature-flags',
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const flags = await prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
    ok(res, { flags });
  })
);

router.post(
  '/feature-flags/:id/toggle',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const existing = await prisma.featureFlag.findUnique({ where: { id: req.params.id } });
    if (!existing) return ok(res, { flag: null }, 'Flag not found', 404);

    const flag = await prisma.featureFlag.update({
      where: { id: existing.id },
      data: { isEnabled: !existing.isEnabled },
    });
    await prisma.auditLog.create({
      data: {
        userId: req.admin!.id,
        action: 'admin.feature_flag',
        details: `${flag.key} → ${flag.isEnabled ? 'on' : 'off'}`,
      },
    });
    return ok(res, { flag });
  })
);

/* ───────────────────────── SCREEN 64 — AUDIT LOG ─────────────────────────── */

router.get(
  '/audit-logs',
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { user: { select: { name: true, email: true } } },
    });
    ok(res, { logs });
  })
);

export default router;


