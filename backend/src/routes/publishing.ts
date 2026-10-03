import { Router } from 'express';
import { ContentType, PlatformType } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { asyncHandler, asEnum, notFound, ok } from '../utils/errors';
import { AuthRequest, requireWorkspace } from '../middleware/auth';
import { SocialPlatformFactory } from '../integrations/socialAdapter';

const router = Router();
router.use(requireWorkspace);

// SCREEN 17 — CALENDAR
router.get(
  '/calendar',
  asyncHandler(async (req: AuthRequest, res) => {
    const workspaceId = req.workspaceId!;

    const [contents, planned] = await Promise.all([
      prisma.content.findMany({ where: { workspaceId } }),
      prisma.calendarEvent.findMany({ where: { workspaceId }, orderBy: { start: 'asc' } }),
    ]);

    const fromContents = contents.map((c) => ({
      id: c.id,
      title: c.title,
      start: c.scheduledAt || c.publishedAt || c.createdAt,
      platform: c.platform,
      status: c.status,
      type: c.type,
    }));

    const fromPlan = planned.map((e) => ({
      id: e.id,
      title: e.title,
      start: e.start,
      platform: e.platform,
      status: e.status,
      type: 'POST' as const,
    }));

    const events = [...fromContents, ...fromPlan].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    ok(res, { events });
  })
);

// Reschedule drag & drop
router.post(
  '/calendar/reschedule',
  asyncHandler(async (req: AuthRequest, res) => {
    const { contentId, newDate } = req.body ?? {};
    const workspaceId = req.workspaceId!;

    const content = await prisma.content.findFirst({
      where: { id: contentId, workspaceId },
    });
    if (content) {
      const updated = await prisma.content.update({
        where: { id: content.id },
        data: { scheduledAt: new Date(newDate), status: 'SCHEDULED' },
      });
      return ok(res, { success: true, content: updated });
    }

    const event = await prisma.calendarEvent.findFirst({
      where: { id: contentId, workspaceId },
    });
    if (!event) throw notFound('Content not found.');

    const updated = await prisma.calendarEvent.update({
      where: { id: event.id },
      data: { start: new Date(newDate), status: 'SCHEDULED' },
    });
    ok(res, { success: true, content: updated });
  })
);

// SCREEN 18 — COMPOSER & PUBLISH
router.post(
  '/compose',
  asyncHandler(async (req: AuthRequest, res) => {
    const { title, caption, platform, type, scheduleTime, mediaUrl, tags } = req.body ?? {};
    const workspaceId = req.workspaceId!;

    const platformValue =
      (asEnum(platform, Object.values(PlatformType)) ?? 'YOUTUBE') as PlatformType;
    const typeValue = (asEnum(type, Object.values(ContentType)) ?? 'POST') as ContentType;

    const isImmediate = !scheduleTime || new Date(scheduleTime).getTime() <= Date.now();

    let postUrl = '';
    if (isImmediate) {
      const adapter = SocialPlatformFactory.getAdapter(platformValue);
      const pubResult = await adapter.publishContent({
        title: String(title ?? ''),
        caption: String(caption ?? ''),
        mediaUrl,
      });
      postUrl = pubResult.url;
    }

    const content = await prisma.content.create({
      data: {
        workspaceId,
        title: title || 'Composed Post',
        description: caption || '',
        caption: caption || '',
        type: typeValue,
        platform: platformValue,
        status: isImmediate ? 'PUBLISHED' : 'SCHEDULED',
        thumbnailUrl:
          mediaUrl ||
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
        mediaUrl: mediaUrl || '',
        scheduledAt: scheduleTime ? new Date(scheduleTime) : null,
        publishedAt: isImmediate ? new Date() : null,
        tags: Array.isArray(tags) && tags.length ? tags.map(String) : ['CreatorOS'],
        views: isImmediate ? 142 : 0,
        likes: isImmediate ? 18 : 0,
      },
    });

    await prisma.notification.create({
      data: {
        workspaceId,
        title: isImmediate ? 'Content Published' : 'Post Scheduled',
        message: isImmediate
          ? `"${content.title}" was published to ${platformValue}.`
          : `Scheduled for ${scheduleTime}.`,
        type: 'PUBLISHING',
        link: `/content/${content.id}`,
      },
    });

    ok(res, { success: true, content, postUrl }, undefined, 201);
  })
);

// SCREEN 31 — SMART SCHEDULER
router.get(
  '/smart-scheduler',
  asyncHandler(async (_req: AuthRequest, res) => {
    ok(res, {
      recommendations: [
        { platform: 'YOUTUBE', bestTime: 'Thursday 3:00 PM EST', confidenceScore: 94, reason: 'Peak subscriber activity on tech channels.' },
        { platform: 'TIKTOK', bestTime: 'Friday 7:30 PM EST', confidenceScore: 91, reason: 'High weekend viral scroll momentum.' },
        { platform: 'LINKEDIN', bestTime: 'Tuesday 8:15 AM EST', confidenceScore: 89, reason: 'Commute and morning executive feed scans.' },
        { platform: 'INSTAGRAM', bestTime: 'Wednesday 12:00 PM EST', confidenceScore: 86, reason: 'Lunchtime mobile browsing surge.' },
      ],
    });
  })
);

// SCREEN 32 — PUBLISHING QUEUE
router.get(
  '/queue',
  asyncHandler(async (req: AuthRequest, res) => {
    const queue = await prisma.content.findMany({
      where: {
        workspaceId: req.workspaceId!,
        status: { in: ['SCHEDULED', 'PUBLISHING'] },
      },
      orderBy: { scheduledAt: 'asc' },
    });
    ok(res, { queue });
  })
);

export default router;
