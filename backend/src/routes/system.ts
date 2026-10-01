import { Router } from 'express';
import { dbStore } from '../utils/store';

const router = Router();

// SCREEN 47 — NOTIFICATIONS
router.get('/notifications', (req, res) => {
  res.json({ notifications: dbStore.notifications });
});

router.post('/notifications/mark-all-read', (req, res) => {
  dbStore.notifications.forEach(n => { n.isRead = true; });
  res.json({ success: true });
});

// SCREEN 48 — GLOBAL SEARCH
router.get('/search', (req, res) => {
  const query = ((req.query.q as string) || '').toLowerCase().trim();
  if (!query) {
    return res.json({
      content: dbStore.contents.slice(0, 3),
      ideas: dbStore.ideas.slice(0, 3),
      videos: dbStore.videos.slice(0, 2)
    });
  }

  const content = dbStore.contents.filter(c => c.title.toLowerCase().includes(query) || c.tags.some(t => t.toLowerCase().includes(query)));
  const ideas = dbStore.ideas.filter(i => i.title.toLowerCase().includes(query) || i.category.toLowerCase().includes(query));
  const videos = dbStore.videos.filter(v => v.title.toLowerCase().includes(query));
  const questions = dbStore.questions.filter(q => q.question.toLowerCase().includes(query));

  res.json({ content, ideas, videos, questions });
});

// SCREEN 49, 50, 51 — SETTINGS
router.get('/settings', (req, res) => {
  res.json({
    user: dbStore.users[0],
    workspace: dbStore.workspaces[0],
    aiSettings: {
      defaultTone: 'Authoritative, Practical, Energetic',
      primaryModel: 'GPT-4o Mini',
      creativityLevel: 0.7,
      autoClipDetection: true
    }
  });
});

router.put('/settings/account', (req, res) => {
  const user = dbStore.users[0];
  if (req.body.name) user.name = req.body.name;
  if (req.body.avatar) user.avatar = req.body.avatar;
  res.json({ success: true, user });
});

router.put('/settings/ai', (req, res) => {
  res.json({ success: true, aiSettings: req.body });
});

// SCREEN 52 — BILLING
router.get('/billing', (req, res) => {
  res.json({
    currentPlan: 'CreatorOS Pro',
    price: 49.0,
    billingCycle: 'Monthly',
    nextBillingDate: 'October 15, 2026',
    paymentMethod: { brand: 'Visa', last4: '4242', expMonth: 12, expYear: 2028 },
    usage: {
      aiTokensUsed: 142850,
      aiTokenLimit: 500000,
      videoMinutesProcessed: 42,
      videoMinutesLimit: 120,
      teamSeatsUsed: 3,
      teamSeatsLimit: 5
    },
    invoices: [
      { id: 'inv_102', date: 'Sep 15, 2026', amount: 49.0, status: 'PAID' },
      { id: 'inv_101', date: 'Aug 15, 2026', amount: 49.0, status: 'PAID' }
    ]
  });
});

// SCREEN 53 — SECURITY
router.get('/security', (req, res) => {
  res.json({
    twoFactorEnabled: false,
    activeSessions: [
      { id: 'sess_01', device: 'Chrome on Windows 11 (Current)', ip: '192.168.1.10', location: 'Austin, TX', lastActive: 'Just now' },
      { id: 'sess_02', device: 'CreatorOS iOS App (iPhone 16)', ip: '72.14.201.88', location: 'Austin, TX', lastActive: '2 hours ago' }
    ]
  });
});

// SCREEN 54 — RE-ANALYZE
router.post('/re-analyze', (req, res) => {
  // Simulates syncing and refreshing latest social engagement metrics
  res.json({
    success: true,
    message: 'Data synchronization completed. Omnichannel metrics, transcripts, and audience questions are updated.',
    syncedAccounts: dbStore.socials.length
  });
});

export default router;
