import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, notFound, ok } from '../utils/errors';
import { AuthRequest, requireWorkspace } from '../middleware/auth';

const router = Router();
router.use(requireWorkspace);

// SCREEN 34 — AI AUTOPILOT
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const workspaceId = req.workspaceId!;

    const [automations, runs] = await Promise.all([
      prisma.automation.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        include: { runs: { orderBy: { executedAt: 'desc' }, take: 5 } },
      }),
      prisma.automationRun.findMany({
        where: { automation: { workspaceId } },
        orderBy: { executedAt: 'desc' },
        take: 50,
      }),
    ]);

    const activeCount = automations.filter((a) => a.isActive).length;
    const totalRuns = automations.reduce((sum, a) => sum + (a.runsCount || 0), 0);
    const totalTimeSaved = automations.reduce((sum, a) => sum + (a.timeSavedMinutes || 0), 0);
    const runsToday = runs.filter(
      (r) => Date.now() - new Date(r.executedAt).getTime() < 86400_000
    ).length;

    ok(res, {
      metrics: {
        activeAutomations: activeCount,
        totalRunsToday: runsToday,
        allTimeRuns: totalRuns,
        timeSavedHours: Math.round(totalTimeSaved / 60),
      },
      automations: automations.map(({ runs: _runs, ...automation }) => automation),
      recentRuns: runs.slice(0, 5),
    });
  })
);

// Toggle Autopilot Status
router.post(
  '/:id/toggle',
  asyncHandler(async (req: AuthRequest, res) => {
    const automation = await prisma.automation.findFirst({
      where: { id: req.params.id, workspaceId: req.workspaceId! },
    });
    if (!automation) throw notFound('Automation not found.');

    const updated = await prisma.automation.update({
      where: { id: automation.id },
      data: { isActive: !automation.isActive },
    });
    ok(res, { automation: updated });
  })
);

// SCREEN 35 — RULE BUILDER (Create new automation)
router.post(
  '/rules',
  asyncHandler(async (req: AuthRequest, res) => {
    const { name, description, trigger, conditions, actions } = req.body ?? {};
    const automation = await prisma.automation.create({
      data: {
        workspaceId: req.workspaceId!,
        name: name || 'Custom Multi-Step Trigger',
        description: description || 'Autonomous workflow',
        trigger: trigger || 'NEW_VIDEO_PUBLISHED',
        conditions: conditions ?? [],
        actions: actions ?? [{ type: 'AI_ANALYZE' }],
      },
    });
    ok(res, { automation }, 'Automation created.', 201);
  })
);

// SCREEN 36 — ACTION LOG
router.get(
  '/logs',
  asyncHandler(async (req: AuthRequest, res) => {
    const logs = await prisma.automationRun.findMany({
      where: { automation: { workspaceId: req.workspaceId! } },
      orderBy: { executedAt: 'desc' },
      include: { automation: { select: { id: true, name: true, trigger: true } } },
    });
    ok(res, { logs });
  })
);

export default router;
