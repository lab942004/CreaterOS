import { Router } from 'express';
import { dbStore, AutomationData } from '../utils/store';

const router = Router();

// SCREEN 34 — AI AUTOPILOT
router.get('/', (req, res) => {
  const activeCount = dbStore.automations.filter(a => a.isActive).length;
  const totalRuns = dbStore.automations.reduce((sum, a) => sum + (a.runsCount || 0), 0);
  const totalTimeSaved = dbStore.automations.reduce((sum, a) => sum + (a.timeSavedMinutes || 0), 0);

  res.json({
    metrics: {
      activeAutomations: activeCount,
      totalRunsToday: 18,
      allTimeRuns: totalRuns,
      timeSavedHours: Math.round(totalTimeSaved / 60)
    },
    automations: dbStore.automations,
    recentRuns: dbStore.automationRuns.slice(0, 5)
  });
});

// Toggle Autopilot Status
router.post('/:id/toggle', (req, res) => {
  const auto = dbStore.automations.find(a => a.id === req.params.id);
  if (!auto) return res.status(404).json({ error: 'Automation not found' });
  auto.isActive = !auto.isActive;
  res.json({ automation: auto });
});

// SCREEN 35 — RULE BUILDER (Create new automation)
router.post('/rules', (req, res) => {
  const { name, description, trigger, conditions, actions } = req.body;
  const newAuto: AutomationData = {
    id: `auto_${Date.now()}`,
    workspaceId: 'ws_main_01',
    name: name || 'Custom Multi-Step Trigger',
    description: description || 'Autonomous workflow',
    trigger: trigger || 'NEW_VIDEO_PUBLISHED',
    conditions: conditions || [],
    actions: actions || [{ type: 'AI_ANALYZE' }],
    isActive: true,
    runsCount: 0,
    timeSavedMinutes: 0,
    createdAt: new Date().toISOString()
  };

  dbStore.automations.unshift(newAuto);
  res.status(201).json({ automation: newAuto });
});

// SCREEN 36 — ACTION LOG
router.get('/logs', (req, res) => {
  res.json({ logs: dbStore.automationRuns });
});

export default router;
