import {
  UserData, WorkspaceData, SocialAccountData, ContentData,
  ContentDNAData, IdeaData, OpportunityData, VideoData,
  AutomationData, AutomationRunData
} from './storeTypes';
import { seedPart1 } from './seedPart1';
import { seedPart2 } from './seedPart2';
import { seedPart3 } from './seedPart3';

export * from './storeTypes';

export class Store {
  users: UserData[] = [
    {
      id: 'usr_creator_01',
      email: 'creator@creatoros.ai',
      name: 'Alex Rivera',
      passwordHash: '$2a$10$wE26UvAonNl2.F68N3bXie4o2N4qE6u5T/9BwNl.YvL8xGk3Wqf9m',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'OWNER',
      onboardingStep: 7,
      isOnboarded: true,
      createdAt: new Date().toISOString()
    }
  ];

  workspaces: WorkspaceData[] = [
    { id: 'ws_main_01', name: 'Alex Rivera Productions', slug: 'alex-rivera', ownerId: 'usr_creator_01' }
  ];

  socials: SocialAccountData[] = [
    { id: 'soc_yt', workspaceId: 'ws_main_01', platform: 'YOUTUBE', accountName: 'Alex Rivera Tech', username: '@alexriveratech', followers: 245000, isConnected: true, isMock: true },
    { id: 'soc_ig', workspaceId: 'ws_main_01', platform: 'INSTAGRAM', accountName: 'Alex Rivera Official', username: '@alexrivera.ai', followers: 182400, isConnected: true, isMock: true },
    { id: 'soc_tt', workspaceId: 'ws_main_01', platform: 'TIKTOK', accountName: 'Alex R Shorts', username: '@alexrivera_tok', followers: 310500, isConnected: true, isMock: true },
    { id: 'soc_li', workspaceId: 'ws_main_01', platform: 'LINKEDIN', accountName: 'Alex Rivera', username: 'in/alex-rivera-tech', followers: 45200, isConnected: true, isMock: true },
    { id: 'soc_tw', workspaceId: 'ws_main_01', platform: 'TWITTER', accountName: 'Alex Rivera', username: '@alexrivera_x', followers: 88700, isConnected: true, isMock: true },
    { id: 'soc_fb', workspaceId: 'ws_main_01', platform: 'FACEBOOK', accountName: 'Alex Rivera Creator Hub', username: 'alexriveracreator', followers: 34100, isConnected: true, isMock: true }
  ];

  contents: ContentData[] = [];
  dnaList: ContentDNAData[] = [];
  ideas: IdeaData[] = [];
  opportunities: OpportunityData[] = [];
  videos: VideoData[] = [];
  automations: AutomationData[] = [];
  automationRuns: AutomationRunData[] = [];
  questions: any[] = [];
  comments: any[] = [];
  trends: any[] = [];
  brandKit: any = null;
  creatorBrain: any = null;
  creatorMemories: any[] = [];
  brandDeals: any[] = [];
  campaigns: any[] = [];
  teamMembers: any[] = [];
  teamTasks: any[] = [];
  reports: any[] = [];
  notifications: any[] = [];
  adminUsers: any[] = [];
  featureFlags: any[] = [];
  auditLogs: any[] = [];
  thumbnails: any[] = [];
  benchmarks: any[] = [];
  conversations: any[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    seedPart1(this);
    seedPart2(this);
    seedPart3(this);
  }
}

export const dbStore = new Store();
