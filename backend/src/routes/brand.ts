import { Router } from 'express';
import { dbStore } from '../utils/store';

const router = Router();

// SCREEN 37 — CREATOR BRAIN
router.get('/brain', (req, res) => {
  res.json({ brain: dbStore.creatorBrain });
});

router.put('/brain', (req, res) => {
  dbStore.creatorBrain = { ...dbStore.creatorBrain, ...req.body };
  res.json({ brain: dbStore.creatorBrain });
});

// SCREEN 38 — CREATOR MEMORY
router.get('/memory', (req, res) => {
  res.json({ memories: dbStore.creatorMemories });
});

router.post('/memory', (req, res) => {
  const { key, value, category } = req.body;
  const newMemory = {
    id: `mem_${Date.now()}`,
    workspaceId: 'ws_main_01',
    key,
    value,
    category: category || 'GENERAL'
  };
  dbStore.creatorMemories.push(newMemory);
  res.status(201).json({ memory: newMemory });
});

router.delete('/memory/:id', (req, res) => {
  dbStore.creatorMemories = dbStore.creatorMemories.filter(m => m.id !== req.params.id);
  res.json({ success: true });
});

// SCREEN 39 — BRAND KIT
router.get('/kit', (req, res) => {
  res.json({ brandKit: dbStore.brandKit });
});

router.put('/kit', (req, res) => {
  dbStore.brandKit = { ...dbStore.brandKit, ...req.body };
  res.json({ brandKit: dbStore.brandKit });
});

// SCREEN 40 — BRAND PREVIEW
router.get('/preview', (req, res) => {
  res.json({
    brandKit: dbStore.brandKit,
    mockPostPreview: {
      creatorName: 'Alex Rivera',
      handle: '@alexriveratech',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      samplePost: 'Why solo builders in 2026 are outpacing 50-person legacy agencies with automated workflow intelligence.',
      colors: dbStore.brandKit?.colors || []
    }
  });
});

export default router;
