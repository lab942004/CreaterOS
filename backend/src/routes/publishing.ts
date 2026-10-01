import { Router } from 'express';
import { dbStore } from '../utils/store';
import { SocialPlatformFactory } from '../integrations/socialAdapter';

const router = Router();

// SCREEN 17 — CALENDAR
router.get('/calendar', (req, res) => {
  const events = dbStore.contents.map(c => ({
    id: c.id,
    title: c.title,
    start: c.scheduledAt || c.publishedAt || c.createdAt,
    platform: c.platform,
    status: c.status,
    type: c.type
  }));
  res.json({ events });
});

// Reschedule drag & drop
router.post('/calendar/reschedule', (req, res) => {
  const { contentId, newDate } = req.body;
  const content = dbStore.contents.find(c => c.id === contentId);
  if (!content) return res.status(404).json({ error: 'Content not found' });
  content.scheduledAt = newDate;
  content.status = 'SCHEDULED';
  res.json({ success: true, content });
});

// SCREEN 18 — COMPOSER & PUBLISH
router.post('/compose', async (req, res) => {
  const { title, caption, platform, type, scheduleTime, mediaUrl, tags } = req.body;

  const isImmediate = !scheduleTime || new Date(scheduleTime).getTime() <= Date.now();
  const status = isImmediate ? 'PUBLISHED' : 'SCHEDULED';

  let postUrl = '';
  if (isImmediate) {
    const adapter = SocialPlatformFactory.getAdapter(platform || 'YOUTUBE');
    const pubResult = await adapter.publishContent({ title, caption, mediaUrl });
    postUrl = pubResult.url;
  }

  const newPost = {
    id: `cnt_${Date.now()}`,
    workspaceId: 'ws_main_01',
    title: title || 'Composed Post',
    description: caption || '',
    caption: caption || '',
    type: type || 'POST',
    platform: platform || 'YOUTUBE',
    status,
    thumbnailUrl: mediaUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    mediaUrl: mediaUrl || '',
    scheduledAt: scheduleTime || null,
    publishedAt: isImmediate ? new Date().toISOString() : null,
    tags: tags || ['CreatorOS'],
    views: isImmediate ? 142 : 0,
    likes: isImmediate ? 18 : 0,
    commentsCount: 0,
    shares: 0,
    engagementRate: 0,
    watchTimeMinutes: 0,
    createdAt: new Date().toISOString()
  };

  dbStore.contents.unshift(newPost);

  // Trigger Action Notification
  dbStore.notifications.unshift({
    id: `notif_${Date.now()}`,
    workspaceId: 'ws_main_01',
    title: isImmediate ? 'Content Published' : 'Post Scheduled',
    message: isImmediate ? `"${newPost.title}" was published to ${platform}.` : `Scheduled for ${scheduleTime}.`,
    type: 'PUBLISHING',
    isRead: false,
    link: `/content/${newPost.id}`,
    createdAt: new Date().toISOString()
  });

  res.status(201).json({ success: true, content: newPost, postUrl });
});

// SCREEN 31 — SMART SCHEDULER
router.get('/smart-scheduler', (req, res) => {
  res.json({
    recommendations: [
      { platform: 'YOUTUBE', bestTime: 'Thursday 3:00 PM EST', confidenceScore: 94, reason: 'Peak subscriber activity on tech channels.' },
      { platform: 'TIKTOK', bestTime: 'Friday 7:30 PM EST', confidenceScore: 91, reason: 'High weekend viral scroll momentum.' },
      { platform: 'LINKEDIN', bestTime: 'Tuesday 8:15 AM EST', confidenceScore: 89, reason: 'Commute and morning executive feed scans.' },
      { platform: 'INSTAGRAM', bestTime: 'Wednesday 12:00 PM EST', confidenceScore: 86, reason: 'Lunchtime mobile browsing surge.' }
    ]
  });
});

// SCREEN 32 — PUBLISHING QUEUE
router.get('/queue', (req, res) => {
  const queue = dbStore.contents.filter(c => c.status === 'SCHEDULED' || c.status === 'PUBLISHING');
  res.json({ queue });
});

export default router;
