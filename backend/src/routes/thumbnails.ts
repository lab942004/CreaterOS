import { Router } from 'express';
import { dbStore } from '../utils/store';

const router = Router();

// SCREEN 25 — THUMBNAIL LAB
router.get('/', (req, res) => {
  const defaultThumbnails = [
    {
      id: 'thumb_01',
      title: 'AI Agent Blueprint 2026',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      platform: 'YOUTUBE',
      colors: ['#4F46E5', '#06B6D4'],
      clickEstimate: 14.8,
      variantGroup: 'Group A'
    },
    {
      id: 'thumb_02',
      title: 'Stop Writing Prompts',
      imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
      platform: 'YOUTUBE',
      colors: ['#EF4444', '#000000'],
      clickEstimate: 12.2,
      variantGroup: 'Group B'
    }
  ];

  res.json({ thumbnails: dbStore.thumbnails.length ? dbStore.thumbnails : defaultThumbnails });
});

router.post('/generate', (req, res) => {
  const { prompt, title, platform } = req.body;
  const newThumb = {
    id: `thumb_${Date.now()}`,
    title: title || 'AI Generated Thumbnail',
    imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop&q=80',
    platform: platform || 'YOUTUBE',
    colors: ['#7C3AED', '#3B82F6'],
    clickEstimate: 15.4,
    variantGroup: 'AI Variant'
  };

  dbStore.thumbnails.unshift(newThumb);
  res.json({ success: true, thumbnail: newThumb });
});

export default router;
