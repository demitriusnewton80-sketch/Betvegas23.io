
import { EventEmitter } from 'events';

interface FeedSource {
  id: string;
  name: string;
  type: 'sportsbook' | 'streaming' | 'gaming' | 'radio' | 'web3';
  endpoint: string;
  icon: string;
  enabled: boolean;
}

interface UserFeed {
  userId: string;
  feedId: string;
  name: string;
  sources: string[];
  filters: {
    sports?: string[];
    leagues?: string[];
    teams?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

class FeedBuilderService extends EventEmitter {
  private availableSources: Map<string, FeedSource> = new Map();
  private userFeeds: Map<string, UserFeed[]> = new Map();

  constructor() {
    super();
    this.initializeAvailableSources();
  }

  private initializeAvailableSources() {
    // Sportsbook sources
    this.availableSources.set('live-betting', {
      id: 'live-betting',
      name: 'Live Sportsbook',
      type: 'sportsbook',
      endpoint: '/sportsbook/games',
      icon: '🏆',
      enabled: true
    });

    this.availableSources.set('draftkings', {
      id: 'draftkings',
      name: 'DraftKings Integration',
      type: 'sportsbook',
      endpoint: '/draftkings/odds',
      icon: '👑',
      enabled: true
    });

    // Streaming sources
    this.availableSources.set('streaming-partners', {
      id: 'streaming-partners',
      name: 'Streaming Partners',
      type: 'streaming',
      endpoint: '/streaming/partners',
      icon: '📺',
      enabled: true
    });

    this.availableSources.set('radio-streams', {
      id: 'radio-streams',
      name: 'Sports Radio',
      type: 'radio',
      endpoint: '/sports-radio/live',
      icon: '📻',
      enabled: true
    });

    // Gaming sources
    this.availableSources.set('ps5-gaming', {
      id: 'ps5-gaming',
      name: 'PS5 Sports Gaming',
      type: 'gaming',
      endpoint: '/ps5/games',
      icon: '🎮',
      enabled: true
    });

    // Web3 sources
    this.availableSources.set('web3-bridge', {
      id: 'web3-bridge',
      name: 'Web3 Betting',
      type: 'web3',
      endpoint: '/web3/transactions',
      icon: '🔗',
      enabled: true
    });

    // AI sources
    this.availableSources.set('ai-predictions', {
      id: 'ai-predictions',
      name: 'AI Predictions',
      type: 'sportsbook',
      endpoint: '/ai/predictions',
      icon: '🤖',
      enabled: true
    });
  }

  getAvailableSources(): FeedSource[] {
    return Array.from(this.availableSources.values());
  }

  createFeed(userId: string, feedName: string, sourceIds: string[], filters?: any): UserFeed {
    const feedId = `feed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newFeed: UserFeed = {
      userId,
      feedId,
      name: feedName,
      sources: sourceIds,
      filters: filters || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!this.userFeeds.has(userId)) {
      this.userFeeds.set(userId, []);
    }

    this.userFeeds.get(userId)!.push(newFeed);
    this.emit('feedCreated', newFeed);

    return newFeed;
  }

  getUserFeeds(userId: string): UserFeed[] {
    return this.userFeeds.get(userId) || [];
  }

  updateFeed(userId: string, feedId: string, updates: Partial<UserFeed>): UserFeed | null {
    const feeds = this.userFeeds.get(userId);
    if (!feeds) return null;

    const feedIndex = feeds.findIndex(f => f.feedId === feedId);
    if (feedIndex === -1) return null;

    feeds[feedIndex] = {
      ...feeds[feedIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.emit('feedUpdated', feeds[feedIndex]);
    return feeds[feedIndex];
  }

  deleteFeed(userId: string, feedId: string): boolean {
    const feeds = this.userFeeds.get(userId);
    if (!feeds) return false;

    const newFeeds = feeds.filter(f => f.feedId !== feedId);
    this.userFeeds.set(userId, newFeeds);
    this.emit('feedDeleted', { userId, feedId });

    return true;
  }

  async getFeedData(feedId: string, userId: string): Promise<any> {
    const feeds = this.userFeeds.get(userId);
    if (!feeds) return null;

    const feed = feeds.find(f => f.feedId === feedId);
    if (!feed) return null;

    const feedData: any = {
      feedId: feed.feedId,
      name: feed.name,
      updatedAt: feed.updatedAt,
      items: []
    };

    // Aggregate data from all sources
    for (const sourceId of feed.sources) {
      const source = this.availableSources.get(sourceId);
      if (source && source.enabled) {
        feedData.items.push({
          source: source.name,
          type: source.type,
          endpoint: source.endpoint,
          icon: source.icon
        });
      }
    }

    return feedData;
  }
}

export const feedBuilderService = new FeedBuilderService();
