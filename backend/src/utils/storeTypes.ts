export interface UserData {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  avatar?: string;
  role: string;
  onboardingStep: number;
  isOnboarded: boolean;
  createdAt: string;
}

export interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
}

export interface SocialAccountData {
  id: string;
  workspaceId: string;
  platform: 'YOUTUBE' | 'INSTAGRAM' | 'TIKTOK' | 'FACEBOOK' | 'LINKEDIN' | 'TWITTER';
  accountName: string;
  username: string;
  followers: number;
  profileUrl?: string;
  avatarUrl?: string;
  isConnected: boolean;
  isMock: boolean;
}

export interface ContentData {
  id: string;
  workspaceId: string;
  socialAccountId?: string;
  title: string;
  description: string;
  caption: string;
  type: string;
  platform: string;
  status: string;
  thumbnailUrl?: string;
  mediaUrl?: string;
  scheduledAt?: string;
  publishedAt?: string;
  tags: string[];
  views: number;
  likes: number;
  commentsCount: number;
  shares: number;
  engagementRate: number;
  watchTimeMinutes: number;
  createdAt: string;
}

export interface ContentDNAData {
  id: string;
  contentId: string;
  hook: string;
  topic: string;
  format: string;
  tone: string;
  lengthSeconds: number;
  keywords: string[];
  cta: string;
  targetAudience: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  visualStyle: string;
  score: number;
}

export interface IdeaData {
  id: string;
  workspaceId: string;
  title: string;
  hook: string;
  format: string;
  platform: string;
  category: string;
  reason: string;
  potentialScore: number;
  cta: string;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
}

export interface OpportunityData {
  id: string;
  workspaceId: string;
  type: string;
  title: string;
  description: string;
  platform: string;
  impactScore: number;
  actionType: string;
  createdAt: string;
}

export interface VideoData {
  id: string;
  workspaceId: string;
  title: string;
  filename: string;
  fileUrl: string;
  durationSec: number;
  status: string;
  transcript?: {
    text: string;
    segments: Array<{ start: number; end: number; speaker: string; text: string }>;
  };
  clips: Array<{
    id: string;
    title: string;
    hook: string;
    startSec: number;
    endSec: number;
    durationSec: number;
    score: number;
    platform: string;
    clipUrl?: string;
  }>;
  createdAt: string;
}

export interface AutomationData {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  trigger: string;
  conditions: any[];
  actions: any[];
  isActive: boolean;
  runsCount: number;
  timeSavedMinutes: number;
  createdAt: string;
}

export interface AutomationRunData {
  id: string;
  automationId: string;
  event: string;
  details: string;
  status: string;
  error?: string;
  executedAt: string;
}
