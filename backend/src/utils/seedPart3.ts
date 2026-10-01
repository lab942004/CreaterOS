export function seedPart3(store: any) {
  store.questions.push({
    id: 'q_01',
    workspaceId: 'ws_main_01',
    question: 'What hardware setup do you recommend for local LLMs?',
    platform: 'YOUTUBE',
    frequency: 54,
    sentiment: 'POSITIVE',
    topic: 'Hardware',
    status: 'UNANSWERED',
    createdAt: new Date().toISOString()
  });

  store.comments.push({
    id: 'cm_01',
    workspaceId: 'ws_main_01',
    authorName: 'Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    text: 'Cleanest explanation of agent loops. Subscribed!',
    platform: 'YOUTUBE',
    sentiment: 'POSITIVE',
    isAnswered: true,
    isQuestion: false,
    isToxic: false,
    reply: 'Thanks Marcus!',
    createdAt: new Date().toISOString()
  });

  store.trends.push({
    id: 'tr_01',
    workspaceId: 'ws_main_01',
    topic: '#DeepSeekR1',
    platform: 'TWITTER',
    category: 'AI Models',
    velocity: 4.8,
    volume: 185000,
    suggestedAction: 'Create benchmark vs Sonnet'
  });

  store.brandKit = {
    workspaceId: 'ws_main_01',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
    colors: ['#4F46E5', '#7C3AED', '#06B6D4', '#10B981'],
    fonts: ['Inter', 'Plus Jakarta Sans', 'Fira Code'],
    brandVoice: 'Authoritative, builder-focused, pragmatic.',
    handles: { youtube: '@alexriveratech', instagram: '@alexrivera.ai', tiktok: '@alexrivera_tok' }
  };

  store.creatorBrain = {
    workspaceId: 'ws_main_01',
    pillars: ['AI System Architecture', 'Creator Monetization', 'Developer Productivity'],
    targetAudience: 'Software engineers and tech builders.',
    missionStatement: 'Empower individual creators to wield software leverage.',
    rules: ['Provide real code.', 'Keep intro hooks under 5s.']
  };

  store.creatorMemories.push({
    id: 'mem_01',
    workspaceId: 'ws_main_01',
    key: 'Thumbnail Style',
    value: 'High contrast dark background with bold cyan rim light.',
    category: 'BRAND'
  });

  store.brandDeals.push({
    id: 'deal_01',
    workspaceId: 'ws_main_01',
    brandName: 'Supabase',
    contactPerson: 'Sarah Jenkins',
    contactEmail: 'sarah@supabase.io',
    dealValue: 8500,
    stage: 'CONTRACT',
    deliverables: ['1x Video Integration', '2x Twitter Threads'],
    paymentStatus: 'PENDING',
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString()
  });

  store.campaigns.push({
    id: 'cmp_01',
    workspaceId: 'ws_main_01',
    title: 'Spring AI Developer Sprint',
    brandName: 'Cursor AI',
    budget: 12000,
    status: 'ACTIVE',
    deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    deliverables: { youtube: 1, shorts: 3 }
  });

  store.teamMembers.push({
    id: 'tm_01',
    workspaceId: 'ws_main_01',
    name: 'Alex Rivera',
    email: 'creator@creatoros.ai',
    role: 'OWNER',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
  });

  store.teamTasks.push({
    id: 'tsk_01',
    workspaceId: 'ws_main_01',
    title: 'Final cut for Cursor AI sponsored integration',
    assignedTo: 'Chloe Nguyen',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString()
  });

  store.reports.push({
    id: 'rep_01',
    workspaceId: 'ws_main_01',
    title: 'Q1 2026 Growth Audit',
    type: 'growth',
    summary: '1.2M views across platforms with +34% follower acceleration.',
    createdAt: new Date().toISOString(),
    metrics: { totalViews: 1240000, netFollowers: 38400, grossRevenue: 35500 }
  });

  store.notifications.push({
    id: 'notif_01',
    workspaceId: 'ws_main_01',
    title: 'Video Repurposing Completed',
    message: 'Video Lab extracted 2 vertical clips with 90%+ viral scores.',
    type: 'AI',
    isRead: false,
    link: '/video-lab',
    createdAt: new Date().toISOString()
  });

  store.featureFlags.push({
    id: 'flag_01',
    key: 'ai_video_editing_v2',
    name: 'AI Generative Video Trimming',
    isEnabled: true,
    description: 'Enables silence removal and multi-speaker transcription'
  });

  store.auditLogs.push({
    id: 'log_01',
    userId: 'usr_creator_01',
    action: 'CONTENT_PUBLISHED',
    details: 'Published "Building an AI Agent in 10 Minutes"',
    ipAddress: '192.168.1.10',
    createdAt: new Date().toISOString()
  });
}
