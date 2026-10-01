import { Router } from 'express';
import { dbStore } from '../utils/store';

const router = Router();

// SCREEN 26 — AUDIENCE INTELLIGENCE
router.get('/', (req, res) => {
  res.json({
    totalAudience: 906900,
    growthRate: 24.6,
    returningViewers: 41.2,
    engagementRate: 11.4,
    demographics: {
      age: [
        { group: '18-24', percentage: 22 },
        { group: '25-34', percentage: 54 },
        { group: '35-44', percentage: 18 },
        { group: '45+', percentage: 6 }
      ],
      gender: [
        { type: 'Male', percentage: 71 },
        { type: 'Female', percentage: 26 },
        { type: 'Other', percentage: 3 }
      ],
      countries: [
        { country: 'United States', percentage: 46 },
        { country: 'United Kingdom', percentage: 14 },
        { country: 'India', percentage: 12 },
        { country: 'Germany', percentage: 9 },
        { country: 'Canada', percentage: 7 },
        { country: 'Others', percentage: 12 }
      ],
      devices: [
        { type: 'Mobile', percentage: 68 },
        { type: 'Desktop', percentage: 27 },
        { type: 'Tablet / TV', percentage: 5 }
      ]
    },
    aiInsights: [
      'Your audience engagement doubles when you provide step-by-step code demonstrations.',
      'Sponsorship alignment with developer infrastructure yields highest comment sentiment.'
    ]
  });
});

// SCREEN 27 — AUDIENCE QUESTIONS
router.get('/questions', (req, res) => {
  res.json({ questions: dbStore.questions });
});

router.post('/questions/:id/turn-idea', (req, res) => {
  const q = dbStore.questions.find(item => item.id === req.params.id);
  if (!q) return res.status(404).json({ error: 'Question not found' });

  const idea = {
    id: `idea_${Date.now()}`,
    workspaceId: 'ws_main_01',
    title: `Answering: ${q.question}`,
    hook: `Over 50 of you asked this exact question this week. Here is the honest answer.`,
    format: 'VIDEO',
    platform: q.platform,
    category: 'Q&A',
    reason: `Direct viewer question asked ${q.frequency} times.`,
    potentialScore: 92,
    cta: 'What question should I answer next? Let me know below.',
    isFavorite: true,
    isArchived: false,
    createdAt: new Date().toISOString()
  };

  dbStore.ideas.unshift(idea);
  q.status = 'CONVERTED';

  res.json({ success: true, idea });
});

// SCREEN 28 — COMMENTS INTELLIGENCE
router.get('/comments', (req, res) => {
  res.json({ comments: dbStore.comments });
});

router.post('/comments/:id/reply', (req, res) => {
  const { replyText } = req.body;
  const comment = dbStore.comments.find(c => c.id === req.params.id);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  comment.reply = replyText;
  comment.isAnswered = true;
  res.json({ success: true, comment });
});

router.post('/comments/:id/hide', (req, res) => {
  dbStore.comments = dbStore.comments.filter(c => c.id !== req.params.id);
  res.json({ success: true });
});

export default router;
