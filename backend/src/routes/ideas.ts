import { Router } from 'express';
import { dbStore, IdeaData } from '../utils/store';
import { aiProvider } from '../ai/provider';

const router = Router();

// SCREEN 12 — IDEAS
router.get('/', (req, res) => {
  const { category, platform } = req.query;
  let items = [...dbStore.ideas];
  if (category && category !== 'ALL') items = items.filter(i => i.category === category);
  if (platform && platform !== 'ALL') items = items.filter(i => i.platform === platform);
  res.json({ ideas: items });
});

router.post('/generate', async (req, res) => {
  const { topic, niche, platform } = req.body;
  const generated = await aiProvider.generateIdeas(topic, niche, platform);
  
  const savedIdeas = generated.map(g => {
    const idea: IdeaData = {
      id: `idea_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      workspaceId: 'ws_main_01',
      title: g.title,
      hook: g.hook,
      format: g.format,
      platform: g.platform,
      category: g.category,
      reason: g.reason,
      potentialScore: g.potentialScore,
      cta: g.cta,
      isFavorite: false,
      isArchived: false,
      createdAt: new Date().toISOString()
    };
    dbStore.ideas.unshift(idea);
    return idea;
  });

  res.json({ ideas: savedIdeas });
});

router.post('/:id/favorite', (req, res) => {
  const idea = dbStore.ideas.find(i => i.id === req.params.id);
  if (!idea) return res.status(404).json({ error: 'Idea not found' });
  idea.isFavorite = !idea.isFavorite;
  res.json({ idea });
});

router.delete('/:id', (req, res) => {
  dbStore.ideas = dbStore.ideas.filter(i => i.id !== req.params.id);
  res.json({ success: true });
});

// Convert Idea to Content
router.post('/:id/convert-content', (req, res) => {
  const idea = dbStore.ideas.find(i => i.id === req.params.id);
  if (!idea) return res.status(404).json({ error: 'Idea not found' });

  const content = {
    id: `cnt_${Date.now()}`,
    workspaceId: 'ws_main_01',
    title: idea.title,
    description: `Generated from idea: ${idea.reason}`,
    caption: `${idea.hook}\n\n${idea.cta}`,
    type: idea.format,
    platform: idea.platform,
    status: 'DRAFT',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    tags: [idea.category, 'AI_Idea'],
    views: 0,
    likes: 0,
    commentsCount: 0,
    shares: 0,
    engagementRate: 0,
    watchTimeMinutes: 0,
    createdAt: new Date().toISOString()
  };

  dbStore.contents.unshift(content);
  res.json({ success: true, content });
});

// Convert Idea to Script
router.post('/:id/convert-script', async (req, res) => {
  const idea = dbStore.ideas.find(i => i.id === req.params.id);
  if (!idea) return res.status(404).json({ error: 'Idea not found' });

  const script = await aiProvider.generateScript({
    topic: idea.title,
    platform: idea.platform,
    tone: 'Engaging, Technical, Inspiring',
    length: '60 seconds'
  });

  res.json({ success: true, script });
});

export default router;
