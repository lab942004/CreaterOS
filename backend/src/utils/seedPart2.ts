export function seedPart2(store: any) {
  store.ideas.push(
    {
      id: 'idea_01',
      workspaceId: 'ws_main_01',
      title: 'I Automated My YouTube Channel With AI',
      hook: 'What happens when AI takes over 100% of video creation?',
      format: 'VIDEO',
      platform: 'YOUTUBE',
      category: 'Experiment',
      reason: 'Surging interest in automation experiments (+142%).',
      potentialScore: 96,
      cta: 'Subscribe for week-by-week raw analytics',
      isFavorite: true,
      isArchived: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'idea_02',
      workspaceId: 'ws_main_01',
      title: 'The Death of Traditional Video Editing',
      hook: 'Timeline editing is dead. Here is generative editing.',
      format: 'SHORT',
      platform: 'TIKTOK',
      category: 'Hot Take',
      reason: 'High controversy sentiment drives comment velocity.',
      potentialScore: 89,
      cta: 'Drop your editing software in comments',
      isFavorite: false,
      isArchived: false,
      createdAt: new Date().toISOString()
    }
  );

  store.opportunities.push(
    {
      id: 'opp_01',
      workspaceId: 'ws_main_01',
      type: 'content_gap',
      title: 'Untapped Opportunity: Local LLM Setup',
      description: 'Audience searched "local offline models" 3,420 times last month.',
      platform: 'YOUTUBE',
      impactScore: 94,
      actionType: 'create_content',
      createdAt: new Date().toISOString()
    },
    {
      id: 'opp_02',
      workspaceId: 'ws_main_01',
      type: 'repurpose',
      title: 'High-Retention Segment Ready for Short',
      description: 'Minutes 03:12 to 04:05 spiked to 118% retention. Repurpose as short.',
      platform: 'TIKTOK',
      impactScore: 91,
      actionType: 'turn_into_idea',
      createdAt: new Date().toISOString()
    }
  );

  store.videos.push({
    id: 'vid_01',
    workspaceId: 'ws_main_01',
    title: 'Multimodal AI Agent Masterclass Raw',
    filename: 'ai_agent_masterclass_raw.mp4',
    fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    durationSec: 684.5,
    status: 'READY',
    transcript: {
      text: 'Welcome back. Today we are building an autonomous AI agent in under ten minutes.',
      segments: [
        { start: 0.0, end: 4.8, speaker: 'Alex', text: 'Welcome back everyone.' },
        { start: 4.9, end: 12.3, speaker: 'Alex', text: 'Building an autonomous AI agent in under ten minutes.' }
      ]
    },
    clips: [
      {
        id: 'clip_01',
        title: 'The 3 Pillars of Autonomous Agents',
        hook: 'If your AI agent lacks these 3 things, it is just a chatbot.',
        startSec: 12.4,
        endSec: 45.0,
        durationSec: 32.6,
        score: 95,
        platform: 'TIKTOK',
        clipUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
      }
    ],
    createdAt: new Date().toISOString()
  });

  store.automations.push({
    id: 'auto_01',
    workspaceId: 'ws_main_01',
    name: 'Auto-Repurpose YouTube to Shorts',
    description: 'AI clips highlights and drafts posts upon video publish.',
    trigger: 'NEW_VIDEO_PUBLISHED',
    conditions: [{ field: 'duration', operator: 'GREATER_THAN', value: 300 }],
    actions: [{ type: 'TRANSCRIBE' }, { type: 'CLIP_GENERATE' }],
    isActive: true,
    runsCount: 18,
    timeSavedMinutes: 540,
    createdAt: new Date().toISOString()
  });

  store.automationRuns.push({
    id: 'run_01',
    automationId: 'auto_01',
    event: 'Video Masterclass Processed',
    details: 'Extracted 2 viral clips successfully.',
    status: 'SUCCESS',
    executedAt: new Date().toISOString()
  });
}
