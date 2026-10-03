import { Router } from 'express';
import { ContentType, PlatformType } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { asyncHandler, asEnum, notFound, ok } from '../utils/errors';
import { AuthRequest, requireWorkspace } from '../middleware/auth';

const router = Router();
router.use(requireWorkspace);

const includeVideo = {
  transcript: true,
  clips: { orderBy: { score: 'desc' as const } },
};

const findVideo = (id: string, workspaceId: string) =>
  prisma.video.findFirst({ where: { id, workspaceId }, include: includeVideo });

// SCREEN 21 — VIDEO LAB: Get all videos & detail
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const videos = await prisma.video.findMany({
      where: { workspaceId: req.workspaceId! },
      include: includeVideo,
      orderBy: { createdAt: 'desc' },
    });
    ok(res, { videos });
  })
);

// SCREEN 21 — VIDEO LAB: Get all videos & detail
router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const video = await findVideo(req.params.id, req.workspaceId!);
    if (!video) throw notFound('Video not found.');
    ok(res, { video });
  })
);

// Upload Video (Simulated Async Processing Job)
router.post(
  '/upload',
  asyncHandler(async (req: AuthRequest, res) => {
    const { title, filename, durationSec, fileUrl } = req.body ?? {};

    const video = await prisma.video.create({
      data: {
        workspaceId: req.workspaceId!,
        title: title || 'New Studio Recording',
        filename: filename || 'recording.mp4',
        fileUrl:
          fileUrl ||
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        durationSec: Number(durationSec) || 420,
        status: 'READY',
        transcript: {
          create: {
            text: 'Here is the full speech transcription processed by Whisper AI. We detected high clarity across all audio channels.',
            segments: [
              { start: 0.0, end: 5.2, speaker: 'Speaker 1', text: 'Welcome back. In this video we test the latest models.' },
              { start: 5.3, end: 15.0, speaker: 'Speaker 1', text: 'Notice how the inference latency dropped by 4x.' },
              { start: 15.1, end: 32.4, speaker: 'Speaker 1', text: 'This enables real-time reasoning loops on consumer hardware.' },
            ],
          },
        },
        clips: {
          create: {
            title: 'Why Inference Latency Just Changed Forever',
            hook: 'Watch this benchmark before you buy new GPUs.',
            startSec: 5.3,
            endSec: 32.4,
            durationSec: 27.1,
            score: 93,
            platform: 'TIKTOK',
            clipUrl:
              'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          },
        },
      },
      include: includeVideo,
    });

    ok(res, { success: true, video }, 'Video uploaded and processed.', 201);
  })
);

// SCREEN 22 — VIDEO TRANSCRIPT
router.get(
  '/:id/transcript',
  asyncHandler(async (req: AuthRequest, res) => {
    const video = await findVideo(req.params.id, req.workspaceId!);
    if (!video) throw notFound('Video not found.');
    ok(res, { transcript: video.transcript, videoTitle: video.title });
  })
);

router.put(
  '/:id/transcript',
  asyncHandler(async (req: AuthRequest, res) => {
    const video = await findVideo(req.params.id, req.workspaceId!);
    if (!video) throw notFound('Video not found.');

    if (video.transcript && req.body?.text) {
      await prisma.videoTranscript.update({
        where: { id: video.transcript.id },
        data: { text: String(req.body.text) },
      });
    }

    const transcript = await prisma.videoTranscript.findUnique({
      where: { videoId: video.id },
    });
    ok(res, { success: true, transcript });
  })
);

// SCREEN 23 — CLIP GENERATOR
router.get(
  '/:id/clips',
  asyncHandler(async (req: AuthRequest, res) => {
    const video = await findVideo(req.params.id, req.workspaceId!);
    if (!video) throw notFound('Video not found.');
    ok(res, { clips: video.clips ?? [] });
  })
);

router.post(
  '/:id/clips/generate',
  asyncHandler(async (req: AuthRequest, res) => {
    const video = await findVideo(req.params.id, req.workspaceId!);
    if (!video) throw notFound('Video not found.');

    const clip = await prisma.videoClip.create({
      data: {
        videoId: video.id,
        title: `AI Highlight from ${video.title}`,
        hook: 'This 20-second breakdown is mind-blowing.',
        startSec: 10.0,
        endSec: 35.0,
        durationSec: 25.0,
        score: 91,
        platform: 'INSTAGRAM',
        clipUrl:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      },
    });

    ok(res, { success: true, clip }, 'Clip generated.');
  })
);

// REPURPOSE FUNCTIONALITY INSIDE VIDEO LAB
router.post(
  '/:id/repurpose',
  asyncHandler(async (req: AuthRequest, res) => {
    const { targetPlatform, targetFormat } = req.body ?? {};
    const workspaceId = req.workspaceId!;

    const video = await findVideo(req.params.id, workspaceId);
    if (!video) throw notFound('Video not found.');

    // The UI offers TikTok/LinkedIn/Instagram targets in SHORT/ARTICLE/CAROUSEL
    // form, so validate against the full enums rather than a narrow subset —
    // otherwise a LinkedIn article silently becomes a TikTok short.
    const platform = asEnum(targetPlatform, Object.values(PlatformType)) ?? 'TIKTOK';
    const format = asEnum(targetFormat, Object.values(ContentType)) ?? 'SHORT';

    const content = await prisma.content.create({
      data: {
        workspaceId,
        title: `[Repurposed] ${video.title} for ${platform}`,
        description: `Extracted high-retention concepts from "${video.title}"`,
        caption: `Key takeaway from my latest deep dive: Focus on systems, not outputs. #Repurposed #${platform}`,
        type: format,
        platform,
        status: 'DRAFT',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
        tags: ['Repurposed', platform],
      },
    });

    ok(res, { success: true, content });
  })
);

export default router;

