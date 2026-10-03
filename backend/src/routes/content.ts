import { Router } from 'express';
import { ContentType, PlatformType, ContentStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { asyncHandler, asEnum, notFound, ok } from '../utils/errors';
import { AuthRequest, requireWorkspace } from '../middleware/auth';
import { aiProvider } from '../ai/provider';
import { learnFromContent } from '../services/memory.service';

const router = Router();
router.use(requireWorkspace);

const DEFAULT_THUMBNAIL =
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';

// SCREEN 09 — CONTENT LIBRARY
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const { platform, type, status, search } = req.query;

    const where: Record<string, unknown> = { workspaceId: req.workspaceId! };

    const platformFilter = asEnum(platform, Object.values(PlatformType));
    if (platformFilter && platform !== 'ALL') where.platform = platformFilter;

    const typeFilter = asEnum(type, Object.values(ContentType));
    if (typeFilter && type !== 'ALL') where.type = typeFilter;

    const statusFilter = asEnum(status, Object.values(ContentStatus));
    if (statusFilter && status !== 'ALL') where.status = statusFilter;

    if (search) {
      const q = String(search);
      where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { tags: { has: q } }];
    }

    const contents = await prisma.content.findMany({
      where,
      include: { dna: true },
      orderBy: { createdAt: 'desc' },
    });

    ok(res, { contents });
  })
);

// SCREEN 10 — CONTENT DETAIL
router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const content = await prisma.content.findFirst({
      where: { id: req.params.id, workspaceId: req.workspaceId! },
      include: { dna: true },
    });
    if (!content) throw notFound('Content not found.');

    const { dna, ...rest } = content;
    ok(res, { content: rest, dna });
  })
);

// Create
router.post(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const body = req.body ?? {};
    const content = await prisma.content.create({
      data: {
        workspaceId: req.workspaceId!,
        title: body.title || 'Untitled Creation',
        description: body.description || '',
        caption: body.caption || '',
        type: (asEnum(body.type, Object.values(ContentType)) ?? 'POST') as ContentType,
        platform: (asEnum(body.platform, Object.values(PlatformType)) ?? 'YOUTUBE') as PlatformType,
        status: (asEnum(body.status, Object.values(ContentStatus)) ?? 'DRAFT') as ContentStatus,
        thumbnailUrl: body.thumbnailUrl || DEFAULT_THUMBNAIL,
        mediaUrl: body.mediaUrl || '',
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        tags: Array.isArray(body.tags) && body.tags.length ? body.tags.map(String) : ['CreatorOS'],
      },
    });
    ok(res, { content }, 'Content created.', 201);
  })
);

// Update
router.put(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const existing = await prisma.content.findFirst({
      where: { id: req.params.id, workspaceId: req.workspaceId! },
    });
    if (!existing) throw notFound('Content not found.');

    const body = req.body ?? {};
    const data: Record<string, unknown> = {};
    const scalarKeys = [
      'title',
      'description',
      'caption',
      'thumbnailUrl',
      'mediaUrl',
      'views',
      'likes',
      'commentsCount',
      'shares',
      'engagementRate',
      'watchTimeMinutes',
    ] as const;
    for (const key of scalarKeys) if (body[key] !== undefined) data[key] = body[key];
    if (body.type !== undefined) {
      const value = asEnum(body.type, Object.values(ContentType));
      if (value) data.type = value;
    }
    if (body.platform !== undefined) {
      const value = asEnum(body.platform, Object.values(PlatformType));
      if (value) data.platform = value;
    }
    if (body.status !== undefined) {
      const value = asEnum(body.status, Object.values(ContentStatus));
      if (value) data.status = value;
    }
    if (Array.isArray(body.tags)) data.tags = body.tags.map(String);
    if (body.scheduledAt !== undefined) {
      data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    }
    if (body.publishedAt !== undefined) {
      data.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;
    }

    const content = await prisma.content.update({ where: { id: existing.id }, data });

    // Once a post actually publishes, turn its measured result into a lesson the
    // AI can recall next time. Fire-and-forget: learning must not block the edit.
    if (content.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      void learnFromContent(req.workspaceId!, content.id).catch((e) =>
        console.error('[memory] failed to learn from content', e)
      );
    }

    ok(res, { content }, 'Content updated.');
  })
);

// Delete
router.delete(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const existing = await prisma.content.findFirst({
      where: { id: req.params.id, workspaceId: req.workspaceId! },
    });
    if (!existing) throw notFound('Content not found.');
    await prisma.content.delete({ where: { id: existing.id } });
    ok(res, { success: true }, 'Content deleted.');
  })
);

// SCREEN 11 — CONTENT DNA
router.get(
  '/:id/dna',
  asyncHandler(async (req: AuthRequest, res) => {
    const content = await prisma.content.findFirst({
      where: { id: req.params.id, workspaceId: req.workspaceId! },
      include: { dna: true },
    });
    if (!content) throw notFound('Content not found.');

    if (content.dna) {
      const { dna, ...rest } = content;
      return ok(res, { dna, content: rest });
    }

    const analysis = await aiProvider.analyzeContent(content, {
      requestType: 'analyzeContent',
      userId: req.user?.id ?? null,
      workspaceId: req.workspaceId ?? null,
    });
    const dna = await prisma.contentDNA.create({
      data: {
        contentId: content.id,
        hook: 'Dynamic curiosity gap identified in title and intro seconds.',
        topic: content.title,
        format: content.type,
        tone: 'Engaging, High-Retention',
        lengthSeconds: Math.max(30, Math.round(content.watchTimeMinutes * 60)) || 180,
        keywords: content.tags,
        cta: 'Subscribe / Comment for full blueprint',
        targetAudience: 'Content Creators & Modern Builders',
        strengths: analysis.strengths ?? [],
        weaknesses: analysis.weaknesses ?? [],
        recommendations: analysis.recommendations ?? [],
        visualStyle: 'Modern Studio Lighting with Kinetic Captions',
        score: analysis.retentionScore ?? 89,
      },
    });

    ok(res, { dna, content });
  })
);

export default router;

