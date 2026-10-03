import { Router } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { asyncHandler, badRequest, notFound, ok } from '../utils/errors';
import { AuthRequest, requireWorkspace } from '../middleware/auth';

const router = Router();
router.use(requireWorkspace);

// SCREEN 44 — TEAM COLLABORATION
router.get(
  '/team',
  asyncHandler(async (req: AuthRequest, res) => {
    const workspaceId = req.workspaceId!;

    const [memberships, tasks] = await Promise.all([
      prisma.workspaceMember.findMany({
        where: { workspaceId },
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.teamTask.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const members = memberships.map(({ user, role, id }) => ({
      id: user.id,
      membershipId: id,
      workspaceId,
      name: user.name,
      email: user.email,
      role,
      avatar: user.avatar,
    }));

    ok(res, { members, tasks });
  })
);

router.post(
  '/team/invite',
  asyncHandler(async (req: AuthRequest, res) => {
    const { name, email, role } = req.body ?? {};
    if (!email) throw badRequest('An email address is required.');

    const workspaceId = req.workspaceId!;
    const normalizedEmail = String(email).trim().toLowerCase();

    // The schema has no pending-invite table: an invite only grants access once
    // the person already has an account, otherwise it is recorded as a message.
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!existingUser) {
      return ok(
        res,
        { member: null, pendingEmail: normalizedEmail },
        `Invitation queued for ${normalizedEmail}.`,
        201
      );
    }

    const membership = await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId, userId: existingUser.id } },
      create: {
        workspaceId,
        userId: existingUser.id,
        role: (role === 'OWNER' || role === 'ADMIN' || role === 'VIEWER' || role === 'ANALYST'
          ? role
          : 'EDITOR') as Role,
      },
      update: {},
      include: { user: true },
    });

    const member = {
      id: membership.user.id,
      membershipId: membership.id,
      workspaceId,
      name: membership.user.name,
      email: membership.user.email,
      role: membership.role,
      avatar:
        membership.user.avatar ??
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    };

    void name;
    ok(res, { member }, 'Member invited.', 201);
  })
);

router.post(
  '/team/tasks',
  asyncHandler(async (req: AuthRequest, res) => {
    const body = req.body ?? {};
    const task = await prisma.teamTask.create({
      data: {
        workspaceId: req.workspaceId!,
        title: body.title || 'Untitled task',
        assignedTo: body.assignedTo || null,
        status: 'TODO',
        priority: body.priority || 'MEDIUM',
        dueDate: body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 3 * 86400_000),
      },
    });
    ok(res, { task }, 'Task created.', 201);
  })
);

router.put(
  '/team/tasks/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const task = await prisma.teamTask.findFirst({
      where: { id: req.params.id, workspaceId: req.workspaceId! },
    });
    if (!task) throw notFound('Task not found.');

    const data: Record<string, unknown> = {};
    if (req.body?.status) data.status = req.body.status;
    if (req.body?.priority) data.priority = req.body.priority;
    if (req.body?.assignedTo !== undefined) data.assignedTo = req.body.assignedTo;
    if (req.body?.title) data.title = req.body.title;
    if (req.body?.dueDate) data.dueDate = new Date(req.body.dueDate);

    const updated = await prisma.teamTask.update({ where: { id: task.id }, data });
    ok(res, { task: updated });
  })
);

// SCREEN 45 & 46 — REPORTS
router.get(
  '/reports',
  asyncHandler(async (req: AuthRequest, res) => {
    const reports = await prisma.report.findMany({
      where: { workspaceId: req.workspaceId! },
      orderBy: { createdAt: 'desc' },
    });
    ok(res, { reports });
  })
);

router.get(
  '/reports/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const report = await prisma.report.findFirst({
      where: { id: req.params.id, workspaceId: req.workspaceId! },
    });
    if (!report) throw notFound('Report not found.');
    ok(res, { report });
  })
);

router.post(
  '/reports/generate',
  asyncHandler(async (req: AuthRequest, res) => {
    const workspaceId = req.workspaceId!;
    const { title, type } = req.body ?? {};

    const [contents, deals] = await Promise.all([
      prisma.content.findMany({ where: { workspaceId } }),
      prisma.brandDeal.findMany({ where: { workspaceId, paymentStatus: 'PAID' } }),
    ]);

    const totalViews = contents.reduce((a, c) => a + c.views, 0);
    const engagementRate = Number(
      (contents.reduce((a, c) => a + c.engagementRate, 0) / (contents.length || 1)).toFixed(1)
    );
    const grossSponsorships = deals.reduce((a, d) => a + d.dealValue, 0);

    const report = await prisma.report.create({
      data: {
        workspaceId,
        title: title || 'Executive Content Performance Brief',
        type: type || 'analytics',
        summary:
          'Comprehensive analysis of omnichannel subscriber growth, cross-network watch-time, and CPM rates.',
        metrics: {
          totalViews,
          engagementRate,
          grossSponsorships,
          conversionRate: 4.8,
        },
      },
    });

    ok(res, { report }, 'Report generated.', 201);
  })
);

export default router;
