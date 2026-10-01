import { Router } from 'express';
import { dbStore, ContentData } from '../utils/store';
import { aiProvider } from '../ai/provider';

const router = Router();

// SCREEN 09 — CONTENT LIBRARY
router.get('/', (req, res) => {
  const { platform, type, status, search } = req.query;
  let items = [...dbStore.contents];

  if (platform && platform !== 'ALL') {
    items = items.filter(c => c.platform.toUpperCase() === (platform as string).toUpperCase());
  }
  if (type && type !== 'ALL') {
    items = items.filter(c => c.type.toUpperCase() === (type as string).toUpperCase());
  }
  if (status && status !== 'ALL') {
    items = items.filter(c => c.status.toUpperCase() === (status as string).toUpperCase());
  }
  if (search) {
    const q = (search as string).toLowerCase();
    items = items.filter(c => c.title.toLowerCase().includes(q) || c.tags.some(t => t.toLowerCase().includes(q)));
  }

  res.json({ contents: items });
});

// SCREEN 10 — CONTENT DETAIL
router.get('/:id', (req, res) => {
  const item = dbStore.contents.find(c => c.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Content not found' });
  const dna = dbStore.dnaList.find(d => d.contentId === item.id);
  res.json({ content: item, dna });
});

// Create
router.post('/', (req, res) => {
  const newContent: ContentData = {
    id: `cnt_${Date.now()}`,
    workspaceId: 'ws_main_01',
    title: req.body.title || 'Untitled Creation',
    description: req.body.description || '',
    caption: req.body.caption || '',
    type: req.body.type || 'POST',
    platform: req.body.platform || 'YOUTUBE',
    status: req.body.status || 'DRAFT',
    thumbnailUrl: req.body.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    mediaUrl: req.body.mediaUrl || '',
    scheduledAt: req.body.scheduledAt || null,
    tags: req.body.tags || ['CreatorOS'],
    views: 0,
    likes: 0,
    commentsCount: 0,
    shares: 0,
    engagementRate: 0,
    watchTimeMinutes: 0,
    createdAt: new Date().toISOString()
  };

  dbStore.contents.unshift(newContent);
  res.status(201).json({ content: newContent });
});

// Update
router.put('/:id', (req, res) => {
  const idx = dbStore.contents.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Content not found' });
  dbStore.contents[idx] = { ...dbStore.contents[idx], ...req.body };
  res.json({ content: dbStore.contents[idx] });
});

// Delete
router.delete('/:id', (req, res) => {
  dbStore.contents = dbStore.contents.filter(c => c.id !== req.params.id);
  res.json({ success: true });
});

// SCREEN 11 — CONTENT DNA
router.get('/:id/dna', async (req, res) => {
  const item = dbStore.contents.find(c => c.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Content not found' });

  let dna = dbStore.dnaList.find(d => d.contentId === item.id);
  if (!dna) {
    const aiAnalysis = await aiProvider.analyzeContent(item);
    dna = {
      id: `dna_${Date.now()}`,
      contentId: item.id,
      hook: 'Dynamic curiosity gap identified in title and intro seconds.',
      topic: item.title,
      format: item.type,
      tone: 'Engaging, High-Retention',
      lengthSeconds: 180,
      keywords: item.tags,
      cta: 'Subscribe / Comment for full blueprint',
      targetAudience: 'Content Creators & Modern Builders',
      strengths: aiAnalysis.strengths,
      weaknesses: aiAnalysis.weaknesses,
      recommendations: aiAnalysis.recommendations,
      visualStyle: 'Modern Studio Lighting with Kinetic Captions',
      score: 89
    };
    dbStore.dnaList.push(dna);
  }
  res.json({ dna, content: item });
});

export default router;
