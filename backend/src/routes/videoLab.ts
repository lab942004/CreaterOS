import { Router } from 'express';
import { dbStore, VideoData } from '../utils/store';

const router = Router();

// SCREEN 21 — VIDEO LAB: Get all videos & detail
router.get('/', (req, res) => {
  res.json({ videos: dbStore.videos });
});

router.get('/:id', (req, res) => {
  const video = dbStore.videos.find(v => v.id === req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });
  res.json({ video });
});

// Upload Video (Simulated Async Processing Job)
router.post('/upload', (req, res) => {
  const { title, filename, durationSec, fileUrl } = req.body;

  const newVideo: VideoData = {
    id: `vid_${Date.now()}`,
    workspaceId: 'ws_main_01',
    title: title || 'New Studio Recording',
    filename: filename || 'recording.mp4',
    fileUrl: fileUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    durationSec: durationSec || 420.0,
    status: 'READY',
    transcript: {
      text: 'Here is the full speech transcription processed by Whisper AI. We detected high clarity across all audio channels.',
      segments: [
        { start: 0.0, end: 5.2, speaker: 'Speaker 1', text: 'Welcome back. In this video we test the latest models.' },
        { start: 5.3, end: 15.0, speaker: 'Speaker 1', text: 'Notice how the inference latency dropped by 4x.' },
        { start: 15.1, end: 32.4, speaker: 'Speaker 1', text: 'This enables real-time reasoning loops on consumer hardware.' }
      ]
    },
    clips: [
      {
        id: `clip_${Date.now()}_1`,
        title: 'Why Inference Latency Just Changed Forever',
        hook: 'Watch this benchmark before you buy new GPUs.',
        startSec: 5.3,
        endSec: 32.4,
        durationSec: 27.1,
        score: 93,
        platform: 'TIKTOK',
        clipUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
      }
    ],
    createdAt: new Date().toISOString()
  };

  dbStore.videos.unshift(newVideo);
  res.status(201).json({ success: true, video: newVideo });
});

// SCREEN 22 — VIDEO TRANSCRIPT
router.get('/:id/transcript', (req, res) => {
  const video = dbStore.videos.find(v => v.id === req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });
  res.json({ transcript: video.transcript, videoTitle: video.title });
});

router.put('/:id/transcript', (req, res) => {
  const video = dbStore.videos.find(v => v.id === req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });
  if (video.transcript && req.body.text) {
    video.transcript.text = req.body.text;
  }
  res.json({ success: true, transcript: video.transcript });
});

// SCREEN 23 — CLIP GENERATOR
router.get('/:id/clips', (req, res) => {
  const video = dbStore.videos.find(v => v.id === req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });
  res.json({ clips: video.clips || [] });
});

router.post('/:id/clips/generate', (req, res) => {
  const video = dbStore.videos.find(v => v.id === req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });

  const generatedClip = {
    id: `clip_${Date.now()}`,
    title: `AI Highlight from ${video.title}`,
    hook: 'This 20-second breakdown is mind-blowing.',
    startSec: 10.0,
    endSec: 35.0,
    durationSec: 25.0,
    score: 91,
    platform: 'INSTAGRAM',
    clipUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
  };

  if (!video.clips) video.clips = [];
  video.clips.unshift(generatedClip);

  res.json({ success: true, clip: generatedClip });
});

// REPURPOSE FUNCTIONALITY INSIDE VIDEO LAB
router.post('/:id/repurpose', (req, res) => {
  const { targetPlatform, targetFormat } = req.body;
  const video = dbStore.videos.find(v => v.id === req.params.id);
  if (!video) return res.status(404).json({ error: 'Video not found' });

  const repurposedPost = {
    id: `cnt_${Date.now()}`,
    workspaceId: 'ws_main_01',
    title: `[Repurposed] ${video.title} for ${targetPlatform}`,
    description: `Extracted high-retention concepts from "${video.title}"`,
    caption: `Key takeaway from my latest deep dive: Focus on systems, not outputs. #Repurposed #${targetPlatform}`,
    type: targetFormat || 'SHORT',
    platform: targetPlatform || 'TIKTOK',
    status: 'DRAFT',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    tags: ['Repurposed', targetPlatform],
    views: 0,
    likes: 0,
    commentsCount: 0,
    shares: 0,
    engagementRate: 0,
    watchTimeMinutes: 0,
    createdAt: new Date().toISOString()
  };

  dbStore.contents.unshift(repurposedPost);
  res.json({ success: true, content: repurposedPost });
});

export default router;
