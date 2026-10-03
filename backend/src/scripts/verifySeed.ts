import { prisma } from '../utils/prisma';

const check = async () => {
  const counts: Record<string, number> = {};
  const models = [
    'user', 'workspace', 'workspaceMember', 'content', 'idea', 'video',
    'socialAccount', 'trend', 'opportunity', 'audienceMetric', 'comment',
    'automation', 'automationRun', 'creatorBrain', 'creatorMemory', 'brandKit',
    'brandDeal', 'thumbnail', 'notification', 'calendarEvent', 'adminUser',
    'featureFlag', 'subscription', 'profile',
  ] as const;
  for (const m of models) {
    try {
      counts[m] = await (prisma as any)[m].count();
    } catch {
      counts[m] = -1;
    }
  }
  console.log(JSON.stringify(counts, null, 2));
  await prisma.$disconnect();
};

check().catch((e) => { console.error(e); process.exit(1); });
