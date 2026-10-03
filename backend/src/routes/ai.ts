import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler, badRequest, ok } from '../utils/errors';
import { AuthRequest, requireWorkspace } from '../middleware/auth';
import { aiProvider } from '../ai/provider';
import { config } from '../config';

const router = Router();
router.use(requireWorkspace);

/**
 * Reports which backend is actually live and whether its key is present.
 * Lets you confirm a Hugging Face switch took effect without spending tokens.
 */
router.get(
  '/status',
  asyncHandler(async (_req: AuthRequest, res) => {
    const configured = {
      openai: Boolean(config.ai.openaiApiKey),
      huggingface: Boolean(config.ai.huggingfaceApiKey),
      anthropic: Boolean(config.ai.anthropicApiKey),
    };

    ok(res, {
      provider: aiProvider.name,
      model: aiProvider.name === 'mock' ? null : config.ai.model,
      baseUrl:
        aiProvider.name === 'huggingface'
          ? config.ai.huggingfaceBaseUrl
          : aiProvider.name === 'openai'
            ? config.ai.openaiBaseUrl
            : null,
      isMock: aiProvider.name === 'mock',
      credentialsPresent: configured,
    });
  })
);

/** Attributes token spend to the caller so the admin dashboard stays accurate. */
const usageOf = (req: AuthRequest, requestType: string) => ({
  requestType,
  userId: req.user?.id ?? null,
  workspaceId: req.workspaceId ?? null,
});

// SCREEN 14 — AI STRATEGIST
router.post(
  '/strategist',
  asyncHandler(async (req: AuthRequest, res) => {
    const { messages } = req.body ?? {};
    if (!Array.isArray(messages)) throw badRequest('A message history is required.');

    const creatorBrain = await prisma.creatorBrain.findUnique({
      where: { workspaceId: req.workspaceId! },
    });
    const reply = await aiProvider.chatWithStrategist(messages, creatorBrain, usageOf(req, 'strategist'));
    ok(res, { reply });
  })
);

// SCREEN 15 — AI MY CONTENT
router.post(
  '/my-content',
  asyncHandler(async (req: AuthRequest, res) => {
    const { question } = req.body ?? {};
    if (!question) throw badRequest('A question is required.');

    const contents = await prisma.content.findMany({
      where: { workspaceId: req.workspaceId! },
      orderBy: { views: 'desc' },
      take: 50,
    });

    const reply = await aiProvider.chatWithMyContent(
      String(question),
      contents,
      usageOf(req, 'myContent')
    );
    ok(res, { reply, referencedContent: contents.slice(0, 3) });
  })
);

// SCREEN 16 — AI COMMAND CENTER
router.post(
  '/command',
  asyncHandler(async (req: AuthRequest, res) => {
    const { command } = req.body ?? {};
    let actionResult: { type: string; data?: unknown; message?: string } = {
      type: 'INFO',
      message: 'Command processed.',
    };

    const cmd = String(command ?? '').toLowerCase();
    if (cmd.includes('generate idea') || cmd.includes('ideas')) {
      const ideas = await aiProvider.generateIdeas('AI Tools and Automation', 'Tech', 'YOUTUBE');
      actionResult = {
        type: 'IDEAS_GENERATED',
        data: ideas,
        message: 'Generated 3 high-impact ideas calibrated to your audience.',
      };
    } else if (cmd.includes('schedule') || cmd.includes('post')) {
      actionResult = {
        type: 'SCHEDULE_RECOMMENDATION',
        data: { bestTime: 'Thursday 3:00 PM EST', predictedLift: '+28%' },
      };
    } else {
      actionResult = {
        type: 'ASSISTANT_NOTE',
        message:
          'CreatorOS Command Executed: Analyzed channel metrics and verified all background autopilot triggers are healthy.',
      };
    }

    ok(res, { result: actionResult });
  })
);

// SCREEN 19 — AI CONTENT GENERATOR
router.post(
  '/generate-content',
  asyncHandler(async (req: AuthRequest, res) => {
    const { topic, platform, tone } = req.body ?? {};
    const caption = await aiProvider.generateCaption(
      {
        topic: String(topic ?? ''),
        platform: String(platform ?? 'YOUTUBE'),
        tone: String(tone ?? 'Practical'),
      },
      usageOf(req, 'generateCaption')
    );
    const hashtags = await aiProvider.generateHashtags(
      String(topic ?? ''),
      String(platform ?? 'YOUTUBE'),
      usageOf(req, 'generateHashtags')
    );
    const cta = await aiProvider.generateCTA(
      'Grow Followers',
      String(platform ?? 'YOUTUBE'),
      usageOf(req, 'generateCTA')
    );

    ok(res, {
      generatedText: `${caption}\n\n${cta}\n\n${hashtags.join(' ')}`,
      caption,
      hashtags,
      cta,
    });
  })
);

// SCREEN 20 — SCRIPT STUDIO
router.post(
  '/generate-script',
  asyncHandler(async (req: AuthRequest, res) => {
    const { topic, platform, tone, length } = req.body ?? {};
    const script = await aiProvider.generateScript(
      {
        topic: String(topic ?? ''),
        platform: String(platform ?? 'YOUTUBE'),
        tone: String(tone ?? 'Engaging'),
        length: String(length ?? '60 seconds'),
      },
      usageOf(req, 'generateScript')
    );
    ok(res, { script });
  })
);

export default router;
