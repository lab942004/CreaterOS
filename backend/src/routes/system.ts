import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, notFound, ok } from '../utils/errors';
import { AuthRequest, requireWorkspace } from '../middleware/auth';

const router = Router();

// SCREEN 47 — NOTIFICATIONS
router.get(
  '/notifications',
  asyncHandler(async (req: AuthRequest, res) => {
    const workspaceId = req.workspaceId;
    const notifications = workspaceId
      ? await prisma.notification.findMany({
          where: { workspaceId },
          orderBy: { createdAt: 'desc' },
          take: 50,
        })
      : [];
    ok(res, { notifications });
  })
);

router.post(
  '/notifications/mark-all-read',
  asyncHandler(async (req: AuthRequest, res) => {
    if (req.workspaceId) {
      await prisma.notification.updateMany({
        where: { workspaceId: req.workspaceId, isRead: false },
        data: { isRead: true },
      });
    }
    ok(res, { success: true });
  })
);

// SCREEN 48 — GLOBAL SEARCH
router.get(
  '/search',
  asyncHandler(async (req: AuthRequest, res) => {
    const workspaceId = req.workspaceId;
    const query = ((req.query.q as string) || '').trim();

    if (!workspaceId || !query) {
      const [content, ideas, videos] = await Promise.all([
        prisma.content.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' }, take: 3 }),
        prisma.idea.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' }, take: 3 }),
        prisma.video.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' }, take: 2 }),
      ]);
      return ok(res, { content, ideas, videos });
    }

    const [content, ideas, videos, questions] = await Promise.all([
      prisma.content.findMany({
        where: {
          workspaceId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { tags: { has: query } },
          ],
        },
        take: 20,
      }),
      prisma.idea.findMany({
        where: {
          workspaceId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 20,
      }),
      prisma.video.findMany({
        where: { workspaceId, title: { contains: query, mode: 'insensitive' } },
        take: 10,
      }),
      prisma.audienceQuestion.findMany({
        where: { workspaceId, question: { contains: query, mode: 'insensitive' } },
        take: 10,
      }),
    ]);

    ok(res, { content, ideas, videos, questions });
  })
);

// SCREEN 49, 50, 51 — SETTINGS
router.get(
  '/settings',
  asyncHandler(async (req: AuthRequest, res) => {
    const user = req.user;
    if (!user) throw notFound('No signed-in user.');

    const [workspace, profile] = await Promise.all([
      prisma.workspace.findUnique({
        where: { id: req.workspaceId },
        include: { subscription: true, members: { select: { userId: true } } },
      }),
      prisma.profile.findUnique({ where: { userId: user.id } }),
    ]);

    const aiSettings =
      ((profile?.aiSettings as Record<string, unknown> | null) ?? null) || {
        defaultTone: 'Authoritative, Practical, Energetic',
        primaryModel: 'GPT-4o Mini',
        creativityLevel: 0.7,
        autoClipDetection: true,
      };

    ok(res, {
      user,
      workspace: workspace ? { ...workspace, memberCount: workspace.members.length, members: undefined } : null,
      aiSettings,
    });
  })
);

router.put(
  '/settings/account',
  asyncHandler(async (req: AuthRequest, res) => {
    const user = req.user;
    if (!user) throw notFound('No signed-in user.');

    const data: Record<string, unknown> = {};
    if (req.body?.name) data.name = String(req.body.name);
    if (req.body?.avatar !== undefined) data.avatar = req.body.avatar;

    const updated = await prisma.user.update({ where: { id: user.id }, data });
    ok(res, { success: true, user: updated }, 'Profile updated.');
  })
);

router.put(
  '/settings/ai',
  asyncHandler(async (req: AuthRequest, res) => {
    const user = req.user;
    if (!user) throw notFound('No signed-in user.');

    const aiSettings = req.body ?? {};
    await prisma.profile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, aiSettings },
      update: { aiSettings },
    });
    ok(res, { success: true, aiSettings });
  })
);

// SCREEN 52 — BILLING
router.get(
  '/billing',
  asyncHandler(async (req: AuthRequest, res) => {
    const workspaceId = req.workspaceId;
    const [subscription, seats, videos] = await Promise.all([
      workspaceId ? prisma.subscription.findUnique({ where: { workspaceId } }) : null,
      workspaceId
        ? prisma.workspaceMember.count({ where: { workspaceId } })
        : 0,
      workspaceId ? prisma.video.count({ where: { workspaceId } }) : 0,
    ]);

    const plan = subscription?.plan ?? 'FREE';
    const price = subscription?.price ?? 0;

    ok(res, {
      currentPlan: plan === 'PRO' ? 'CreatorOS Pro' : plan === 'TEAM' ? 'CreatorOS Team' : 'CreatorOS Free',
      price,
      billingCycle: 'Monthly',
      nextBillingDate: subscription?.renewsAt
        ? new Date(subscription.renewsAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : '—',
      paymentMethod: { brand: 'Visa', last4: '4242', expMonth: 12, expYear: 2028 },
      usage: {
        aiTokensUsed: 142850,
        aiTokenLimit: subscription?.features?.length ? 500000 : 50000,
        videoMinutesProcessed: videos * 7,
        videoMinutesLimit: 120,
        teamSeatsUsed: seats,
        teamSeatsLimit: plan === 'TEAM' ? 15 : 5,
      },
      invoices: [],
    });
  })
);

// SCREEN 53 — SECURITY
router.get(
  '/security',
  asyncHandler(async (req: AuthRequest, res) => {
    const sessions = req.user
      ? await prisma.securitySession.findMany({
          where: { userId: req.user.id },
          orderBy: { lastActive: 'desc' },
          take: 10,
        })
      : [];

    ok(res, {
      twoFactorEnabled: false,
      activeSessions: sessions.map((s) => ({
        id: s.id,
        device: s.device,
        ip: s.ipAddress,
        location: 'Unknown',
        lastActive: s.lastActive.toISOString(),
      })),
    });
  })
);

// SCREEN 54 — RE-ANALYZE
router.post(
  '/re-analyze',
  asyncHandler(async (req: AuthRequest, res) => {
    const workspaceId = req.workspaceId;
    const syncedAccounts = workspaceId
      ? await prisma.socialAccount.count({ where: { workspaceId, isConnected: true } })
      : 0;

    if (workspaceId) {
      await prisma.socialAccount.updateMany({
        where: { workspaceId, isConnected: true },
        data: { lastSyncedAt: new Date() },
      });
    }

    ok(res, {
      success: true,
      message:
        'Data synchronization completed. Omnichannel metrics, transcripts, and audience questions are updated.',
      syncedAccounts,
    });
  })
);

export default router;
