export interface IAIProvider {
  generateText(prompt: string, context?: any): Promise<string>;
  generateIdeas(topic: string, niche: string, platform: string): Promise<any[]>;
  generateScript(params: { topic: string; platform: string; tone: string; length: string }): Promise<any>;
  analyzeContent(content: any): Promise<any>;
  generateCaption(params: { topic: string; platform: string; tone: string }): Promise<string>;
  generateHashtags(topic: string, platform: string): Promise<string[]>;
  generateCTA(goal: string, platform: string): Promise<string>;
  chatWithStrategist(messages: any[], creatorBrain: any): Promise<string>;
  chatWithMyContent(question: string, userContent: any[]): Promise<string>;
}

export class MockAIProvider implements IAIProvider {
  async generateText(prompt: string, context?: any): Promise<string> {
    return 'AI Analysis & Strategy Response: Prioritizing 3s video hooks yields a 42% retention improvement.';
  }

  async generateIdeas(topic: string, niche: string, platform: string): Promise<any[]> {
    return [
      {
        title: `The 10-Minute ${topic || 'AI'} Breakthrough`,
        hook: 'Stop doing this manual workflow. Here is what 2026 creators are using instead.',
        format: platform === 'TIKTOK' || platform === 'INSTAGRAM' ? 'SHORT' : 'VIDEO',
        platform: platform || 'YOUTUBE',
        category: 'Tutorial & Breakdown',
        reason: 'Surging demand in viewer search for automated tools.',
        potentialScore: 94,
        cta: 'Comment GUIDE to get my free checklist.'
      },
      {
        title: 'Why I Replaced My Editing Suite With An AI Pipeline',
        hook: 'Here is what happens when you automate transcript clipping.',
        format: 'SHORT',
        platform: platform || 'TIKTOK',
        category: 'Hot Take',
        reason: 'Tool comparisons drive high comment density.',
        potentialScore: 91,
        cta: 'Do you agree? Let me know below.'
      },
      {
        title: 'From Zero to 100k Followers: The Exact Blueprint',
        hook: 'You do not need luck, you need these 4 calibrated content pillars.',
        format: 'CAROUSEL',
        platform: platform || 'LINKEDIN',
        category: 'Growth Case Study',
        reason: 'Saves and reposts drive 70% of distribution on this topic.',
        potentialScore: 88,
        cta: 'Save this swipe file for later.'
      }
    ];
  }

  async generateScript(params: { topic: string; platform: string; tone: string; length: string }): Promise<any> {
    return {
      title: `Script: Master ${params.topic}`,
      hook: `If you have been struggling with ${params.topic}, stop and watch this until the end.`,
      targetDuration: params.length || '60 seconds',
      scenes: [
        { sceneNumber: 1, visual: 'Speaker looking directly at lens, holding phone.', voiceover: 'Most creators spend 80% of time on dead tasks.', durationSec: 5 },
        { sceneNumber: 2, visual: 'CreatorOS dashboard clips view.', voiceover: 'CreatorOS pulls out 3 clips in 30 seconds.', durationSec: 15 },
        { sceneNumber: 3, visual: '12 hours vs 15 minutes diagram.', voiceover: 'The secret is building an automated loop.', durationSec: 20 },
        { sceneNumber: 4, visual: 'CTA screen.', voiceover: 'Check out the link in bio to test free.', durationSec: 10 }
      ],
      callToAction: 'Check link in bio or comment below!'
    };
  }

  async analyzeContent(content: any): Promise<any> {
    return {
      hookScore: 91,
      retentionScore: 88,
      clarityScore: 94,
      strengths: ['Hook grabs attention within 2.8s', 'Zero filler speech', 'Contextual graphics match speech'],
      weaknesses: ['End CTA could use audio contrast', 'Pattern interrupt needed at 3:30'],
      recommendations: ['Turn section 2 into a 45s vertical clip', 'Post follow-up poll in community tab']
    };
  }

  async generateCaption(params: { topic: string; platform: string; tone: string }): Promise<string> {
    return `Building with AI shouldn't feel like wrestling a spaceship. 🚀\n\nHow we streamlined our content workflow for ${params.topic}. Drop a comment with your biggest bottleneck! 👇`;
  }

  async generateHashtags(topic: string, platform: string): Promise<string[]> {
    return ['#CreatorOS', '#ContentCreation', '#AITools', '#ProductivityHacks', '#TechCreator'];
  }

  async generateCTA(goal: string, platform: string): Promise<string> {
    return 'Save this post for your next project and comment SYSTEM for our checklist!';
  }

  async chatWithStrategist(messages: any[], creatorBrain: any): Promise<string> {
    return `Strategic recommendation for ${creatorBrain?.pillars?.join(', ') || 'Tech, AI'}:\n1. High-Intent Topics: Focus on agent architecture.\n2. Repurposing: Convert longform tutorials into vertical shorts.\n3. Brand Monetization: Increase CPM rate based on 14.3% engagement spike.`;
  }

  async chatWithMyContent(question: string, userContent: any[]): Promise<string> {
    return `Querying your content database (${userContent.length} items):\n- Top performing: "Building an AI Agent in 10 Minutes" (184.5k views, 8.8% engagement).\n- Hands-on tutorials retain 64% more viewers.\n- Suggested next post: "Connecting Your AI Agent to APIs in 10 Minutes".`;
  }
}

export const aiProvider = new MockAIProvider();
