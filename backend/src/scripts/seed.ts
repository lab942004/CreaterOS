import bcrypt from 'bcryptjs';
import { PrismaClient, PlatformType, ContentType, ContentStatus, Prisma } from '@prisma/client';
import { config } from '../config';

const prisma = new PrismaClient();

const log = (msg: string) => console.log(`  • ${msg}`);

/* ------------------------------------------------------------------ */
/* Feature flags                                                       */
/* ------------------------------------------------------------------ */

const FEATURE_FLAGS = [
  { key: 'ai.strategist', name: 'AI Strategist', description: 'Conversational strategy assistant' },
  { key: 'ai.command_center', name: 'AI Command Center', description: 'Natural-language workspace commands' },
  { key: 'publishing.auto_post', name: 'Auto Publishing', description: 'Publish directly to connected platforms' },
  { key: 'autopilot.enabled', name: 'Autopilot', description: 'Trigger-driven content automations' },
  { key: 'video.lab', name: 'Video Lab', description: 'Transcription, clipping and repurposing' },
  { key: 'billing.annual_plans', name: 'Annual Billing', description: 'Show annual pricing on the billing screen' },
];

const seedFeatureFlags = async () => {
  let created = 0;
  for (const flag of FEATURE_FLAGS) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      create: flag,
      update: { name: flag.name, description: flag.description },
    });
    created++;
  }
  log(`${created} feature flags ensured`);
};

/* ------------------------------------------------------------------ */
/* Admin console account                                               */
/* ------------------------------------------------------------------ */

const seedAdmin = async () => {
  const email = config.admin.email.toLowerCase();
  const password = config.admin.password || 'CreatorOS@2026';

  if (config.isProd && !config.admin.password) {
    throw new Error(
      'ADMIN_PASSWORD must be set when seeding in production (refusing to create a default admin).'
    );
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.adminUser.upsert({
    where: { email },
    create: { email, name: config.admin.name, password: hashed, role: 'SUPER_ADMIN' },
    update: {},
  });

  log(`admin account ready → ${email} (password ${config.admin.password ? 'from ADMIN_PASSWORD' : 'default dev password'})`);
};

/* ------------------------------------------------------------------ */
/* Demo creator workspace — gives a fresh install something to look at  */
/* ------------------------------------------------------------------ */

const DEMO = {
  email: 'creator@creatoros.ai',
  password: 'CreatorOS@2026',
  name: 'Alex Rivera',
};

/** Shared demographics blob for the Audience Intelligence screen. */
const DEMOGRAPHICS = {
  age: [
    { group: '18-24', percentage: 22 },
    { group: '25-34', percentage: 54 },
    { group: '35-44', percentage: 18 },
    { group: '45+', percentage: 6 },
  ],
  gender: [
    { type: 'Male', percentage: 71 },
    { type: 'Female', percentage: 26 },
    { type: 'Other', percentage: 3 },
  ],
  countries: [
    { country: 'United States', percentage: 46 },
    { country: 'United Kingdom', percentage: 14 },
    { country: 'India', percentage: 12 },
    { country: 'Germany', percentage: 9 },
    { country: 'Canada', percentage: 7 },
    { country: 'Others', percentage: 12 },
  ],
  devices: [
    { type: 'Mobile', percentage: 68 },
    { type: 'Desktop', percentage: 27 },
    { type: 'Tablet / TV', percentage: 5 },
  ],
};

const CONTENT_SEED = [
  { title: 'I tested 7 AI tools so you don’t have to', type: 'VIDEO', platform: 'YOUTUBE', status: 'PUBLISHED', tags: ['ai', 'tools', 'productivity'], views: 184200, likes: 9840, hoursAgo: 72 },
  { title: 'The 3-second hook framework', type: 'SHORT', platform: 'TIKTOK', status: 'PUBLISHED', tags: ['hooks', 'growth'], views: 96500, likes: 12400, hoursAgo: 96 },
  { title: 'Behind the scenes: my recording setup', type: 'REEL', platform: 'INSTAGRAM', status: 'PUBLISHED', tags: ['bts', 'gear'], views: 42100, likes: 3980, hoursAgo: 120 },
  { title: 'How I plan a month of content in 2 hours', type: 'VIDEO', platform: 'YOUTUBE', status: 'PUBLISHED', tags: ['planning', 'systems'], views: 73800, likes: 5120, hoursAgo: 168 },
  { title: '5 mistakes killing your retention', type: 'SHORT', platform: 'YOUTUBE', status: 'PUBLISHED', tags: ['retention', 'analytics'], views: 51200, likes: 4210, hoursAgo: 200 },
  { title: 'Creator economy in 2026: what actually works', type: 'ARTICLE', platform: 'LINKEDIN', status: 'SCHEDULED', tags: ['strategy', 'industry'], views: 0, likes: 0, hoursAgo: -30 },
  { title: 'Repurposing one video into 12 assets', type: 'CAROUSEL', platform: 'INSTAGRAM', status: 'SCHEDULED', tags: ['repurposing'], views: 0, likes: 0, hoursAgo: -54 },
  { title: 'My exact thumbnail workflow', type: 'VIDEO', platform: 'YOUTUBE', status: 'SCHEDULED', tags: ['thumbnails', 'design'], views: 0, likes: 0, hoursAgo: -78 },
  { title: 'Answering your biggest algorithm question', type: 'SHORT', platform: 'TIKTOK', status: 'DRAFT', tags: ['algorithm', 'qna'], views: 0, likes: 0, hoursAgo: -6 },
  { title: 'Sponsorship pitch template (free)', type: 'POST', platform: 'TWITTER', status: 'DRAFT', tags: ['sponsorship', 'monetization'], views: 0, likes: 0, hoursAgo: -12 },
  { title: 'Weekly analytics teardown', type: 'VIDEO', platform: 'YOUTUBE', status: 'DRAFT', tags: ['analytics'], views: 0, likes: 0, hoursAgo: -20 },
  { title: 'Why your first 1000 subscribers stall', type: 'REEL', platform: 'INSTAGRAM', status: 'ARCHIVED', tags: ['growth'], views: 18900, likes: 1510, hoursAgo: 340 },
] as const;

const IDEA_SEED = [
  ['I tried posting every day for 30 days', 'Growth', 'The real numbers after 30 daily posts', 94],
  ['The one metric nobody watches (but should)', 'Analytics', 'Retention curves explain everything', 88],
  ['Reacting to my worst-performing video', 'Entertainment', 'Turning a flop into content', 82],
  ['My $0 → $10k creator stack', 'Monetization', 'Free tools that carried the first year', 91],
  ['Stop editing. Start scripting.', 'Systems', 'Script-first workflows for faster output', 79],
  ['I rebuilt my channel in 7 days', 'Challenge', 'A full rebrand under a deadline', 86],
  ['The algorithm does not hate you', 'Education', 'Distribution myths, debunked', 84],
  ['3 hooks that beat every trend', 'Growth', 'Evergreen hooks outperform formats', 90],
] as const;

const QUESTIONS_SEED = [
  ['How do you stay consistent when views drop?', 'YOUTUBE', 12, 'NEUTRAL', 'Mindset'],
  ['What mic do you use for talking-head videos?', 'INSTAGRAM', 9, 'POSITIVE', 'Gear'],
  ['Do you script every video or just outline?', 'TIKTOK', 7, 'POSITIVE', 'Process'],
  ['Is long-form still worth it in 2026?', 'YOUTUBE', 6, 'NEUTRAL', 'Strategy'],
  ['How do you find sponsors as a small creator?', 'LINKEDIN', 4, 'POSITIVE', 'Monetization'],
] as const;

const COMMENTS_SEED = [
  ['Maya Chen', 'This hook framework completely changed my retention. Thank you!', 'YOUTUBE', 'POSITIVE', true],
  ['Jordan Blake', 'Can you do a follow-up on short-form scripting?', 'INSTAGRAM', 'POSITIVE', true],
  ['Priya N.', 'Wait, 2 hours for a whole month? Break this down please', 'TIKTOK', 'POSITIVE', true],
  ['Sam Okafor', 'The timestamps in this one were a lifesaver', 'YOUTUBE', 'POSITIVE', false],
  ['anon2931', 'this is overhyped garbage', 'YOUTUBE', 'TOXIC', false],
  ['Lena Fischer', 'Sharing this with my whole team tomorrow', 'LINKEDIN', 'POSITIVE', false],
] as const;

const TRENDS_SEED = [
  ['AI thumbnail critiques', 'TIKTOK', 'Creator Tools', 2.4, 184000, 'Ride the wave — publish a teardown this week'],
  ['Silent vlogs', 'INSTAGRAM', 'Formats', 1.9, 92000, 'Experiment with a no-talking B-roll edit'],
  ['Day-in-the-life timestamps', 'YOUTUBE', 'Retention', 1.6, 61000, 'Add chapter hooks to your next long-form video'],
  ['Newsletter cross-promos', 'LINKEDIN', 'Growth', 1.4, 34000, 'Pitch 3 creators for a swap'],
  ['Long-form reaction formats', 'YOUTUBE', 'Entertainment', 1.2, 128000, 'Batch one reaction episode this month'],
  ['Faceless finance channels', 'TIKTOK', 'Monetization', 2.1, 210000, 'Evaluate a faceless spin-off brand'],
] as const;


const seedDemoWorkspace = async () => {
  const password = await bcrypt.hash(DEMO.password, 12);

  const user = await prisma.user.upsert({
    where: { email: DEMO.email },
    create: {
      email: DEMO.email,
      name: DEMO.name,
      password,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isOnboarded: true,
      onboardingStep: 10,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    },
    update: { emailVerified: true, isOnboarded: true },
  });

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      handle: '@alexrivera',
      niche: 'Creator tools & productivity',
      bio: 'I help creators build systems that publish on autopilot.',
      creatorType: 'Educator',
      audience: 'Aspiring & mid-stage creators',
      audienceSize: '50k – 250k',
      voice: 'Practical, direct, energetic',
      goals: ['Grow to 100k', 'Launch a course', 'Land 3 retainers'],
      platforms: ['YouTube', 'Instagram', 'TikTok', 'LinkedIn'],
      contentTypes: ['Long-form video', 'Shorts', 'Carousel'],
      tones: ['Authoritative', 'Friendly'],
      importSelection: ['YouTube Studio', 'Google Analytics'],
    },
    update: {},
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'alex-rivera-studio' },
    create: {
      name: 'Alex Rivera Studio',
      slug: 'alex-rivera-studio',
      ownerId: user.id,
      members: { create: { userId: user.id, role: 'OWNER' } },
      subscription: {
        create: { plan: 'PRO', status: 'ACTIVE', price: 49, renewsAt: new Date(Date.now() + 21 * 864e5) },
      },
      creatorBrain: {
        create: {
          pillars: ['Creator systems', 'AI tooling', 'Growth psychology'],
          targetAudience: 'Creators with 5k–250k followers who want to publish consistently',
          missionStatement: 'Give every creator an operating system for their content.',
          nicheContext: 'Long-form education with shorts-first distribution.',
          rules: ['No hype without evidence', 'Show the numbers', 'One idea per video'],
        },
      },
      brandKit: { create: {} },
    },
    update: {},
  });

  const socials: Array<[string, string, string, number]> = [
    ['YOUTUBE', 'Alex Rivera', 'alexrivera', 148000],
    ['INSTAGRAM', 'Alex Rivera', 'alexrivera', 62400],
    ['TIKTOK', 'Alex Rivera', 'alexrivera', 91200],
    ['LINKEDIN', 'Alex Rivera', 'alexrivera', 18700],
  ];
  for (const [platform, accountName, username, followers] of socials) {
    await prisma.socialAccount.upsert({
      where: {
        workspaceId_platform_username: {
          workspaceId: workspace.id,
          platform: platform as never,
          username,
        },
      },
      create: {
        workspaceId: workspace.id,
        platform: platform as never,
        accountName,
        username,
        profileUrl: `https://${platform.toLowerCase()}.com/@${username}`,
        followers,
        isConnected: true,
        lastSyncedAt: new Date(),
      },
      update: { followers, lastSyncedAt: new Date() },
    });
  }

  await seedWorkspaceContent(workspace.id);

  return { user, workspace };
};

/* ------------------------------------------------------------------ */
/* Workspace content (only on first run)                               */
/* ------------------------------------------------------------------ */

const seedWorkspaceContent = async (workspaceId: string) => {
  if ((await prisma.content.count({ where: { workspaceId } })) > 0) return;

  for (const c of CONTENT_SEED) {
    const at = new Date(Date.now() + c.hoursAgo * 3600_000);
    const isPublished = c.status === 'PUBLISHED' || c.status === 'ARCHIVED';
    const content = await prisma.content.create({
      data: {
        workspaceId,
        title: c.title,
        type: c.type as never,
        platform: c.platform as never,
        status: c.status as never,
        tags: [...c.tags],
        views: c.views,
        likes: c.likes,
        commentsCount: Math.round(c.likes * 0.06),
        shares: Math.round(c.likes * 0.09),
        engagementRate: c.views ? Number(((c.likes / c.views) * 100).toFixed(2)) : 0,
        watchTimeMinutes: Math.round(c.views * 0.35),
        publishedAt: isPublished ? at : null,
        scheduledAt: c.status === 'SCHEDULED' ? at : null,
        createdAt: at,
      },
    });

    await prisma.contentDNA.create({
      data: {
        contentId: content.id,
        hook: c.title.split(':')[0] ?? c.title,
        topic: c.tags[0],
        format: String(c.type).toLowerCase(),
        tone: 'Direct',
        keywords: [...c.tags],
        cta: 'Subscribe for the full breakdown',
        score: 80 + ((c.title.length * 7) % 18),
      },
    });
  }

  await prisma.idea.createMany({
    data: IDEA_SEED.map(([title, category, hook, potentialScore], i) => ({
      workspaceId,
      title,
      category,
      hook,
      potentialScore,
      isFavorite: i % 3 === 0,
      createdAt: new Date(Date.now() - (i + 1) * 7200_000),
    })),
  });

  await prisma.audienceQuestion.createMany({
    data: QUESTIONS_SEED.map(([question, platform, frequency, sentiment, topic]) => ({
      workspaceId,
      question,
      platform: platform as never,
      frequency,
      sentiment,
      topic,
      status: 'UNANSWERED',
    })),
  });

  await prisma.comment.createMany({
    data: COMMENTS_SEED.map(([authorName, text, platform, sentiment, isAnswered]) => ({
      workspaceId,
      authorName,
      text,
      platform: platform as never,
      sentiment,
      isAnswered,
      isQuestion: text.includes('?'),
      isToxic: sentiment === 'TOXIC',
      reply: isAnswered ? 'Thanks — a follow-up is already in the queue!' : null,
    })),
  });

  await prisma.trend.createMany({
    data: TRENDS_SEED.map(([topic, platform, category, velocity, volume, suggestedAction]) => ({
      workspaceId,
      topic,
      platform: platform as never,
      category,
      velocity,
      volume,
      suggestedAction,
    })),
  });

  await prisma.notification.createMany({
    data: [
      { workspaceId, title: 'Upload scheduled', message: '“Creator economy in 2026” goes live in 12 hours.', type: 'INFO', link: '/calendar' },
      { workspaceId, title: 'Retention spike', message: 'Average view duration is up 14% week over week.', type: 'SUCCESS', link: '/analytics' },
      { workspaceId, title: '3 unanswered comments', message: 'Two of them are asking about your gear setup.', type: 'WARN', link: '/audience' },
      { workspaceId, title: 'Autopilot rule ran', message: 'Cross-posted a short to TikTok from your latest upload.', type: 'AUTOMATION', link: '/autopilot' },
      { workspaceId, title: 'New brand lead', message: 'Northwind Labs opened a sponsorship enquiry.', type: 'SUCCESS', link: '/revenue' },
    ],
  });

  await prisma.creatorMemory.createMany({
    data: [
      { workspaceId, key: 'upload_cadence', value: 'Long-form on Tuesdays, shorts Mon/Wed/Fri', category: 'SCHEDULE' },
      { workspaceId, key: 'avg_hook_length', value: '3.2 seconds before the payoff', category: 'STYLE' },
      { workspaceId, key: 'best_performing_cta', value: '“Full breakdown in the pinned comment”', category: 'GROWTH' },
      { workspaceId, key: 'audience_timezone', value: '62% of views land 18:00–21:00 EST', category: 'AUDIENCE' },
    ],
  });

  await seedWorkspaceExtras(workspaceId);

  log('workspace content seeded (content, ideas, audience, trends, notifications, memory)');
};

/**
 * The remaining screens (opportunities, video lab, autopilot, revenue, team,
 * reports, calendar, billing) read from their own tables — without these rows
 * those pages would render empty on a fresh install.
 */
const seedWorkspaceExtras = async (workspaceId: string) => {
  const skipIfPresent = async (model: { count: (args: { where: { workspaceId: string } }) => Promise<number> }) =>
    (await model.count({ where: { workspaceId } })) === 0;

  if (await skipIfPresent(prisma.audienceMetric)) {
    await prisma.audienceMetric.createMany({
      data: [
        { totalAudience: 906900, growthRate: 24.6, createdAt: new Date(Date.now() - 20 * 86400_000), demographics: DEMOGRAPHICS },
        { totalAudience: 871200, growthRate: 19.8, createdAt: new Date(Date.now() - 10 * 86400_000), demographics: DEMOGRAPHICS },
        { totalAudience: 906900, growthRate: 24.6, demographics: DEMOGRAPHICS },
      ].map((m) => ({ workspaceId, ...m })),
    });
    log('audience metrics seeded');
  }

  if (await skipIfPresent(prisma.opportunity)) {
    const rows: Omit<Prisma.OpportunityCreateManyInput, 'workspaceId'>[] = [
      { type: 'TREND', title: '“Local-first AI” is spiking', description: 'Search volume for local LLM tooling tripled this week — publish a setup guide while intent is high.', platform: 'YOUTUBE', impactScore: 94, actionType: 'create_content' },
      { type: 'GAP', title: 'Your viewers keep asking about pricing', description: 'Three comments in 24 hours asked what CreatorOS costs — answer it with a breakdown video.', platform: 'YOUTUBE', impactScore: 88, actionType: 'turn_into_idea' },
      { type: 'COLLAB', title: 'Newsletter cross-promo with BuildLog', description: 'BuildLog offered a 1:1 swap — their audience matches your builder persona closely.', platform: 'LINKEDIN', impactScore: 82, actionType: 'create_content' },
      { type: 'FORMAT', title: 'Shorts are outrunning your longform', description: 'Vertical clips retain 2.4x longer — cut two more from your last tutorial.', platform: 'TIKTOK', impactScore: 79, actionType: 'turn_into_idea' },
    ];
    await prisma.opportunity.createMany({ data: rows.map((o) => ({ workspaceId, ...o })) });
    log('opportunities seeded');
  }

  if (await skipIfPresent(prisma.video)) {
    await prisma.video.createMany({
      data: [
        { title: 'Building an AI Agent in 10 Minutes', filename: 'ai-agent-10min.mp4', fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', durationSec: 612, status: 'READY', createdAt: new Date(Date.now() - 72 * 3600_000) },
        { title: 'My 2026 Creator Stack', filename: 'creator-stack-2026.mp4', fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', durationSec: 484, status: 'READY', createdAt: new Date(Date.now() - 120 * 3600_000) },
      ].map((v) => ({ workspaceId, ...v })),
    });
    log('videos seeded');
  }

  if (await skipIfPresent(prisma.thumbnail)) {
    const rows: Omit<Prisma.ThumbnailCreateManyInput, 'workspaceId'>[] = [
      { title: 'AI Agent Blueprint 2026', imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80', platform: 'YOUTUBE', colors: ['#4F46E5', '#06B6D4'], variantGroup: 'Group A', clickEstimate: 14.8 },
      { title: 'Stop Writing Prompts', imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80', platform: 'YOUTUBE', colors: ['#EF4444', '#000000'], variantGroup: 'Group B', clickEstimate: 12.2 },
    ];
    await prisma.thumbnail.createMany({ data: rows.map((t) => ({ workspaceId, ...t })) });
    log('thumbnails seeded');
  }

  if (await skipIfPresent(prisma.automation)) {
    const rows: Omit<Prisma.AutomationCreateManyInput, 'workspaceId'>[] = [
      { name: 'Auto-republish shorts', description: 'Cross-post every published longform short to TikTok and Reels.', trigger: 'VIDEO_PUBLISHED', conditions: { minDurationSec: 15 }, actions: [{ type: 'EXTRACT_CLIP' }, { type: 'CROSS_POST' }], runsCount: 142, timeSavedMinutes: 380 },
      { name: 'Comment → idea triage', description: 'Turn high-signal questions into draft ideas every morning.', trigger: 'NEW_COMMENT', conditions: { isQuestion: true }, actions: [{ type: 'CREATE_IDEA' }], runsCount: 61, timeSavedMinutes: 185 },
      { name: 'Weekly performance digest', description: 'Compile the top performers and email them to the workspace owner.', trigger: 'WEEKLY_CRON', conditions: {}, actions: [{ type: 'GENERATE_REPORT' }], runsCount: 12, timeSavedMinutes: 96 },
    ];
    await prisma.automation.createMany({ data: rows.map((a) => ({ workspaceId, ...a })) });
    const created = await prisma.automation.findMany({ where: { workspaceId } });
    await prisma.automationRun.createMany({
      data: created.flatMap((a, i) => [
        { automationId: a.id, event: `${a.trigger} fired`, details: `Ran ${a.name} successfully.`, status: 'SUCCESS', executedAt: new Date(Date.now() - (i + 1) * 3600_000) },
        { automationId: a.id, event: `${a.trigger} fired`, details: `Ran ${a.name} successfully.`, status: 'SUCCESS', executedAt: new Date(Date.now() - (i + 1) * 9 * 3600_000) },
      ]),
    });
    log('automations seeded');
  }

  await prisma.creatorBrain.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      pillars: ['Build in public', 'AI tooling deep dives', 'Creator systems'],
      targetAudience: 'Solo creators and indie builders shipping with AI',
      missionStatement: 'Help one-person teams ship like studios.',
      nicheContext: 'Practical AI workflows for content operations.',
      rules: ['Lead with a specific outcome', 'Show the screen, not the slides', 'One takeaway per video'],
    },
    update: {},
  });

  await prisma.brandKit.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
      colors: ['#4F46E5', '#7C3AED', '#06B6D4'],
      fonts: ['Inter', 'Poppins'],
      brandVoice: 'Direct, technical, encouraging',
      handles: { youtube: '@alexriveratech', x: '@alexriveratech', linkedin: 'alexrivera' },
    },
    update: {},
  });

  if (await skipIfPresent(prisma.brandDeal)) {
    await prisma.brandDeal.createMany({
      data: [
        { brandName: 'Northwind Labs', contactPerson: 'Priya Raman', contactEmail: 'priya@northwind.dev', dealValue: 8500, stage: 'NEGOTIATION', deliverables: ['1x integrated video', '2x shorts'], paymentStatus: 'PENDING', dueDate: new Date(Date.now() + 10 * 86400_000) },
        { brandName: 'Halcyon Audio', contactPerson: 'Dan Whitfield', contactEmail: 'dan@halcyon.audio', dealValue: 6000, stage: 'SPONSORED', deliverables: ['1x dedicated video'], paymentStatus: 'PAID', dueDate: new Date(Date.now() - 5 * 86400_000) },
        { brandName: 'Orbit Hosting', contactPerson: 'Mei Lin', contactEmail: 'mei@orbithost.com', dealValue: 4500, stage: 'LEAD', deliverables: ['1x newsletter mention'], paymentStatus: 'PENDING', dueDate: new Date(Date.now() + 21 * 86400_000) },
        { brandName: 'Field Notes Co.', contactPerson: 'Sam Ortiz', contactEmail: 'sam@fieldnotes.co', dealValue: 2500, stage: 'CLOSED', deliverables: ['3x social posts'], paymentStatus: 'PAID', dueDate: new Date(Date.now() - 30 * 86400_000) },
      ].map((d) => ({ workspaceId, ...d })),
    });
    log('brand deals seeded');
  }

  if (await skipIfPresent(prisma.campaign)) {
    await prisma.campaign.createMany({
      data: [
        { title: 'Q1 AI Tooling Series', brandName: 'Northwind Labs', budget: 24000, status: 'ACTIVE', deadline: new Date(Date.now() + 45 * 86400_000), deliverables: { youtube: 3, shorts: 6 } },
        { title: 'Creator Stack Relaunch', brandName: 'Halcyon Audio', budget: 12000, status: 'PLANNED', deadline: new Date(Date.now() + 70 * 86400_000), deliverables: { youtube: 2, instagram: 4 } },
      ].map((c) => ({ workspaceId, ...c })),
    });
    log('campaigns seeded');
  }

  if (await skipIfPresent(prisma.teamTask)) {
    await prisma.teamTask.createMany({
      data: [
        { title: 'Edit “Local-first AI” explainer', assignedTo: 'Chloe Nguyen', status: 'IN_PROGRESS', priority: 'HIGH', dueDate: new Date(Date.now() + 2 * 86400_000) },
        { title: 'Design thumbnail variants for series', assignedTo: 'Marcus Bell', status: 'TODO', priority: 'MEDIUM', dueDate: new Date(Date.now() + 4 * 86400_000) },
        { title: 'Draft sponsor brief for Northwind', assignedTo: 'Alex Rivera', status: 'TODO', priority: 'HIGH', dueDate: new Date(Date.now() + 6 * 86400_000) },
        { title: 'Repurpose tutorial into 3 shorts', assignedTo: 'Chloe Nguyen', status: 'DONE', priority: 'LOW', dueDate: new Date(Date.now() - 86400_000) },
      ].map((t) => ({ workspaceId, ...t })),
    });
    log('team tasks seeded');
  }

  if (await skipIfPresent(prisma.report)) {
    await prisma.report.createMany({
      data: [
        { title: 'Executive Content Performance Brief', type: 'analytics', summary: 'Omnichannel subscriber growth, cross-network watch-time and CPM rates for the last 30 days.', metrics: { totalViews: 1320000, engagementRate: 11.4, grossSponsorships: 35500, conversionRate: 4.8 } },
        { title: 'Sponsorship Pipeline Review', type: 'revenue', summary: 'Open deals, stage velocity and expected payout across the current quarter.', metrics: { openPipeline: 13000, closedWon: 8500, avgDealSize: 5375, conversionRate: 40 } },
      ].map((r) => ({ workspaceId, ...r })),
    });
    log('reports seeded');
  }

  if (await skipIfPresent(prisma.calendarEvent)) {
    const rows: Omit<Prisma.CalendarEventCreateManyInput, 'workspaceId'>[] = [
      { title: 'Publish: Local-first AI setup guide', start: new Date(Date.now() + 2 * 86400_000), platform: 'YOUTUBE', status: 'SCHEDULED' },
      { title: 'Livestream: viewer Q&A', start: new Date(Date.now() + 5 * 86400_000), platform: 'YOUTUBE', status: 'SCHEDULED' },
      { title: 'Post: weekly build log', start: new Date(Date.now() + 86400_000), platform: 'LINKEDIN', status: 'SCHEDULED' },
    ];
    await prisma.calendarEvent.createMany({ data: rows.map((e) => ({ workspaceId, ...e })) });
    log('calendar events seeded');
  }

  await prisma.subscription.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      plan: 'PRO',
      status: 'ACTIVE',
      renewsAt: new Date(Date.now() + 21 * 86400_000),
      price: 49,
      features: ['Unlimited AI commands', 'Video lab + auto clips', '5 team seats'],
    },
    update: {},
  });

  const owner = await prisma.workspaceMember.findFirst({
    where: { workspaceId },
    orderBy: { createdAt: 'asc' },
  });
  if (owner) {
    await prisma.profile.upsert({
      where: { userId: owner.userId },
      create: {
        userId: owner.userId,
        niche: 'AI & creator systems',
        goals: ['Grow to 1M subscribers', 'Productise the newsletter'],
        platforms: ['YOUTUBE', 'TIKTOK', 'LINKEDIN'],
        aiSettings: {
          defaultTone: 'Authoritative, Practical, Energetic',
          primaryModel: 'GPT-4o Mini',
          creativityLevel: 0.7,
          autoClipDetection: true,
        },
      },
      update: {},
    });
  }

  log('workspace extras seeded (brain, kit, deals, campaigns, tasks, reports, calendar, billing)');
};

export { seedFeatureFlags as seedFlags, seedAdmin, seedDemoWorkspace };

/* Run directly: `npm run seed` */
if (require.main === module) {
  (async () => {
    console.log('\n🌱 CreaterOS seed starting…');
    await seedFeatureFlags();
    await seedAdmin();
    await seedDemoWorkspace();
    console.log('✅ Seed complete.\n');
  })()
    .catch((err) => {
      console.error('❌ Seed failed:', err);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
