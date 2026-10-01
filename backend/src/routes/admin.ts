import { Router } from 'express';
import { dbStore } from '../utils/store';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const router = Router();

// SCREEN 55 — ADMIN LOGIN
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const admin = dbStore.adminUsers.find(a => a.email === email);
  if (!admin) {
    return res.status(401).json({ error: 'Admin access denied' });
  }

  const token = jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, config.jwtSecret, { expiresIn: '1d' });
  res.json({ token, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } });
});

// SCREEN 56 — ADMIN DASHBOARD
router.get('/dashboard', (req, res) => {
  res.json({
    metrics: {
      totalCreators: dbStore.users.length + 1420,
      activeToday: 388,
      mrr: 68400,
      totalStorageGB: 1840,
      aiTokensMonthly: 48200000,
      apiHealth: '99.98%',
      activeJobs: 14,
      systemErrorsToday: 0
    },
    recentUsers: dbStore.users,
    systemAlerts: [
      { id: 'al_01', type: 'INFO', title: 'OpenAI Whisper Model Latency Optimal', timestamp: '10m ago' },
      { id: 'al_02', type: 'SUCCESS', title: 'Daily DB Backup Succeeded', timestamp: '3h ago' }
    ]
  });
});

// SCREEN 57 — ADMIN USERS
router.get('/users', (req, res) => {
  res.json({ users: dbStore.users });
});

router.post('/users/:id/status', (req, res) => {
  const { status } = req.body;
  res.json({ success: true, message: `User status changed to ${status}` });
});

// SCREEN 58 — ADMIN WORKSPACES
router.get('/workspaces', (req, res) => {
  res.json({ workspaces: dbStore.workspaces });
});

// SCREEN 59 — PLATFORM HEALTH
router.get('/health', (req, res) => {
  res.json({
    status: 'OPERATIONAL',
    database: { status: 'HEALTHY', latencyMs: 4 },
    storage: { provider: 'Cloudinary / S3', status: 'HEALTHY' },
    aiGateway: { status: 'HEALTHY', avgResponseMs: 380 },
    queues: { activeJobs: 6, completedToday: 842, failedToday: 1 }
  });
});

// SCREEN 60 — JOB MONITOR
router.get('/jobs', (req, res) => {
  res.json({
    jobs: [
      { id: 'job_4091', type: 'VIDEO_TRANSCRIPTION', creator: 'Alex Rivera', progress: 100, status: 'COMPLETED', duration: '18s' },
      { id: 'job_4092', type: 'AI_CLIPPING_GENERATION', creator: 'Alex Rivera', progress: 100, status: 'COMPLETED', duration: '24s' },
      { id: 'job_4093', type: 'METRICS_SYNC', creator: 'Demo User', progress: 85, status: 'RUNNING', duration: '5s' }
    ]
  });
});

// SCREEN 61 — AI USAGE
router.get('/ai-usage', (req, res) => {
  res.json({
    totalCostMonthly: 1240.50,
    totalTokens: 48200000,
    breakdownByModel: [
      { model: 'GPT-4o Mini', tokens: 32000000, cost: 480.0 },
      { model: 'Claude 3.5 Sonnet', tokens: 12000000, cost: 620.0 },
      { model: 'Whisper Large v3', minutes: 8400, cost: 140.50 }
    ]
  });
});

// SCREEN 62 — STORAGE
router.get('/storage', (req, res) => {
  res.json({
    totalStorageUsedGB: 1840,
    totalStorageLimitGB: 5000,
    breakdown: { videos: 1420, thumbnails: 280, documents: 140 }
  });
});

// SCREEN 63 — FEATURE FLAGS
router.get('/feature-flags', (req, res) => {
  res.json({ flags: dbStore.featureFlags });
});

router.post('/feature-flags/:id/toggle', (req, res) => {
  const flag = dbStore.featureFlags.find(f => f.id === req.params.id);
  if (!flag) return res.status(404).json({ error: 'Flag not found' });
  flag.isEnabled = !flag.isEnabled;
  res.json({ flag });
});

// SCREEN 64 — AUDIT LOG
router.get('/audit-logs', (req, res) => {
  res.json({ logs: dbStore.auditLogs });
});

export default router;
