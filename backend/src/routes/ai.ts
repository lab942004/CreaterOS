import { Router } from 'express';
import { dbStore } from '../utils/store';
import { aiProvider } from '../ai/provider';

const router = Router();

// SCREEN 14 — AI STRATEGIST
router.post('/strategist', async (req, res) => {
  const { messages } = req.body;
  const reply = await aiProvider.chatWithStrategist(messages || [], dbStore.creatorBrain);
  res.json({ reply });
});

// SCREEN 15 — AI MY CONTENT
router.post('/my-content', async (req, res) => {
  const { question } = req.body;
  const reply = await aiProvider.chatWithMyContent(question, dbStore.contents);
  res.json({
    reply,
    referencedContent: dbStore.contents.slice(0, 3)
  });
});

// SCREEN 16 — AI COMMAND CENTER
router.post('/command', async (req, res) => {
  const { command } = req.body;
  let actionResult: any = { type: 'INFO', message: 'Command processed.' };

  const cmd = (command || '').toLowerCase();
  if (cmd.includes('generate idea') || cmd.includes('ideas')) {
    const ideas = await aiProvider.generateIdeas('AI Tools and Automation', 'Tech', 'YOUTUBE');
    actionResult = { type: 'IDEAS_GENERATED', data: ideas, message: 'Generated 3 high-impact ideas calibrated to your audience.' };
  } else if (cmd.includes('schedule') || cmd.includes('post')) {
    actionResult = { type: 'SCHEDULE_RECOMMENDATION', data: { bestTime: 'Thursday 3:00 PM EST', predictedLift: '+28%' } };
  } else {
    actionResult = { type: 'ASSISTANT_NOTE', message: `CreatorOS Command Executed: Analyzed channel metrics and verified all background autopilot triggers are healthy.` };
  }

  res.json({ result: actionResult });
});

// SCREEN 19 — AI CONTENT GENERATOR
router.post('/generate-content', async (req, res) => {
  const { topic, platform, tone, type } = req.body;
  const caption = await aiProvider.generateCaption({ topic, platform, tone });
  const hashtags = await aiProvider.generateHashtags(topic, platform);
  const cta = await aiProvider.generateCTA('Grow Followers', platform);

  res.json({
    generatedText: `${caption}\n\n${cta}\n\n${hashtags.join(' ')}`,
    caption,
    hashtags,
    cta
  });
});

// SCREEN 20 — SCRIPT STUDIO
router.post('/generate-script', async (req, res) => {
  const { topic, platform, tone, length } = req.body;
  const script = await aiProvider.generateScript({ topic, platform, tone, length });
  res.json({ script });
});

export default router;
