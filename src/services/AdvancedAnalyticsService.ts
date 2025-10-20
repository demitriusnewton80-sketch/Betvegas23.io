
import { EventEmitter } from 'events';

export interface UserBehaviorMetrics {
  userId: string;
  totalBets: number;
  totalWagered: number;
  averageBetSize: number;
  favoriteTeams: string[];
  preferredSports: string[];
  winRate: number;
  sessionDuration: number;
  lastActive: Date;
}

export interface PlatformMetrics {
  totalUsers: number;
  activeUsers: number;
  totalBetsToday: number;
  totalVolumeToday: number;
  popularGames: { name: string; betCount: number }[];
  peakHours: { hour: number; activity: number }[];
  conversionRate: number;
}

class AdvancedAnalyticsService extends EventEmitter {
  private userMetrics: Map<string, UserBehaviorMetrics> = new Map();
  private platformMetrics: PlatformMetrics;

  constructor() {
    super();
    this.platformMetrics = {
      totalUsers: 0,
      activeUsers: 0,
      totalBetsToday: 0,
      totalVolumeToday: 0,
      popularGames: [],
      peakHours: [],
      conversionRate: 0
    };
    this.initializeSampleData();
  }

  private initializeSampleData() {
    this.platformMetrics = {
      totalUsers: 15847,
      activeUsers: 3421,
      totalBetsToday: 8932,
      totalVolumeToday: 2847392,
      popularGames: [
        { name: 'Super Bowl LVIII', betCount: 2341 },
        { name: 'Lakers vs Celtics', betCount: 1876 },
        { name: 'Champions League Final', betCount: 1543 }
      ],
      peakHours: [
        { hour: 18, activity: 95 },
        { hour: 19, activity: 100 },
        { hour: 20, activity: 87 }
      ],
      conversionRate: 23.4
    };
  }

  trackUserBehavior(userId: string, action: string, metadata: any) {
    let metrics = this.userMetrics.get(userId);
    
    if (!metrics) {
      metrics = {
        userId,
        totalBets: 0,
        totalWagered: 0,
        averageBetSize: 0,
        favoriteTeams: [],
        preferredSports: [],
        winRate: 0,
        sessionDuration: 0,
        lastActive: new Date()
      };
      this.userMetrics.set(userId, metrics);
    }

    metrics.lastActive = new Date();
    this.emit('user:activity', { userId, action, metadata });
  }

  getUserMetrics(userId: string): UserBehaviorMetrics | null {
    return this.userMetrics.get(userId) || null;
  }

  getPlatformMetrics(): PlatformMetrics {
    return { ...this.platformMetrics };
  }

  generateReport(type: 'daily' | 'weekly' | 'monthly') {
    return {
      type,
      generatedAt: new Date(),
      metrics: this.platformMetrics,
      userCount: this.userMetrics.size,
      fccEntity: '20130314143016'
    };
  }

  predictTrends() {
    return {
      predictions: [
        { sport: 'NFL', trend: 'up', confidence: 87 },
        { sport: 'NBA', trend: 'stable', confidence: 92 },
        { sport: 'Soccer', trend: 'up', confidence: 78 }
      ],
      timestamp: new Date()
    };
  }
}

export const advancedAnalyticsService = new AdvancedAnalyticsService();
