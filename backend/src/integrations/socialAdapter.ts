export interface ISocialPlatformAdapter {
  platformName: string;
  connect(authCode: string): Promise<any>;
  disconnect(accountId: string): Promise<boolean>;
  getProfile(accountId: string): Promise<any>;
  getContent(accountId: string): Promise<any[]>;
  getMetrics(accountId: string): Promise<any>;
  publishContent(postData: any): Promise<{ success: boolean; postId: string; url: string }>;
  getComments(contentId: string): Promise<any[]>;
  getAudience(accountId: string): Promise<any>;
}

export class MockSocialPlatformAdapter implements ISocialPlatformAdapter {
  constructor(public platformName: string) {}

  async connect(authCode: string) {
    return {
      connected: true,
      platform: this.platformName,
      username: `@creator_${this.platformName.toLowerCase()}`,
      mock: true
    };
  }

  async disconnect(accountId: string) {
    return true;
  }

  async getProfile(accountId: string) {
    return {
      name: `Creator on ${this.platformName}`,
      handle: `@creator_${this.platformName.toLowerCase()}`,
      followers: 125000,
      verified: true
    };
  }

  async getContent(accountId: string) {
    return [];
  }

  async getMetrics(accountId: string) {
    return {
      views: 245000,
      engagement: 7.8,
      shares: 3400
    };
  }

  async publishContent(postData: any) {
    return {
      success: true,
      postId: `mock_${this.platformName.toLowerCase()}_${Date.now()}`,
      url: `https://${this.platformName.toLowerCase()}.com/p/${Date.now()}`
    };
  }

  async getComments(contentId: string) {
    return [];
  }

  async getAudience(accountId: string) {
    return {
      demographics: {
        age: { '18-24': 25, '25-34': 52, '35-44': 18, '45+': 5 },
        gender: { male: 68, female: 29, other: 3 },
        countries: { US: 42, UK: 14, IN: 12, DE: 8, CA: 7, Others: 17 }
      }
    };
  }
}

export class SocialPlatformFactory {
  static getAdapter(platform: string): ISocialPlatformAdapter {
    return new MockSocialPlatformAdapter(platform.toUpperCase());
  }
}
