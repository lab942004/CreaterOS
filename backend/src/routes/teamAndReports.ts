import { Router } from 'express';
import { dbStore } from '../utils/store';

const router = Router();

// SCREEN 44 — TEAM COLLABORATION
router.get('/team', (req, res) => {
  res.json({ members: dbStore.teamMembers, tasks: dbStore.teamTasks });
});

router.post('/team/invite', (req, res) => {
  const { name, email, role } = req.body;
  const newMember = {
    id: `tm_${Date.now()}`,
    workspaceId: 'ws_main_01',
    name,
    email,
    role: role || 'EDITOR',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
  };
  dbStore.teamMembers.push(newMember);
  res.status(201).json({ member: newMember });
});

router.post('/team/tasks', (req, res) => {
  const newTask = {
    id: `tsk_${Date.now()}`,
    workspaceId: 'ws_main_01',
    title: req.body.title,
    assignedTo: req.body.assignedTo || 'Chloe Nguyen',
    status: 'TODO',
    priority: req.body.priority || 'MEDIUM',
    dueDate: req.body.dueDate || new Date(Date.now() + 3 * 86400000).toISOString()
  };
  dbStore.teamTasks.push(newTask);
  res.status(201).json({ task: newTask });
});

router.put('/team/tasks/:id', (req, res) => {
  const task = dbStore.teamTasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (req.body.status) task.status = req.body.status;
  res.json({ task });
});

// SCREEN 45 & 46 — REPORTS
router.get('/reports', (req, res) => {
  res.json({ reports: dbStore.reports });
});

router.get('/reports/:id', (req, res) => {
  const rep = dbStore.reports.find(r => r.id === req.params.id);
  if (!rep) return res.status(404).json({ error: 'Report not found' });
  res.json({ report: rep });
});

router.post('/reports/generate', (req, res) => {
  const { title, type } = req.body;
  const newReport = {
    id: `rep_${Date.now()}`,
    workspaceId: 'ws_main_01',
    title: title || 'Executive Content Performance Brief',
    type: type || 'analytics',
    summary: 'Comprehensive analysis of omnichannel subscriber growth, cross-network watch-time, and CPM rates.',
    createdAt: new Date().toISOString(),
    metrics: {
      totalViews: 1320000,
      engagementRate: 11.4,
      grossSponsorships: 35500,
      conversionRate: 4.8
    }
  };
  dbStore.reports.unshift(newReport);
  res.status(201).json({ report: newReport });
});

export default router;
