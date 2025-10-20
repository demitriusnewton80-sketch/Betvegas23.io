
import { EventEmitter } from 'events';

export interface OddsData {
  id: string;
  sportType: string;
  eventName: string;
  homeTeam: string;
  awayTeam: string;
  odds: {
    moneyline: { home: number; away: number };
    spread: { line: number; home: number; away: number };
    total: { line: number; over: number; under: number };
  };
  bookmaker: string;
  timestamp: Date;
}

class OddsAggregatorService extends EventEmitter {
  private oddsCache: Map<string, OddsData[]> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startRealTimeUpdates();
  }

  private startRealTimeUpdates() {
    this.updateInterval = setInterval(() => {
      this.fetchLatestOdds();
    }, 30000); // Update every 30 seconds
  }

  private fetchLatestOdds() {
    const sampleOdds: OddsData[] = [
      {
        id: `odds_${Date.now()}_1`,
        sportType: 'NFL',
        eventName: 'Super Bowl LVIII',
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'San Francisco 49ers',
        odds: {
          moneyline: { home: -120, away: +110 },
          spread: { line: -2.5, home: -110, away: -110 },
          total: { line: 47.5, over: -110, under: -110 }
        },
        bookmaker: 'DraftKings',
        timestamp: new Date()
      },
      {
        id: `odds_${Date.now()}_2`,
        sportType: 'NBA',
        eventName: 'Lakers vs Celtics',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Boston Celtics',
        odds: {
          moneyline: { home: +150, away: -180 },
          spread: { line: +4.5, home: -110, away: -110 },
          total: { line: 225.5, over: -115, under: -105 }
        },
        bookmaker: 'FanDuel',
        timestamp: new Date()
      }
    ];

    this.oddsCache.set('live', sampleOdds);
    this.emit('odds:updated', sampleOdds);
  }

  getBestOdds(eventId: string): OddsData | null {
    const allOdds = this.oddsCache.get('live') || [];
    return allOdds.find(o => o.id === eventId) || null;
  }

  compareOdds(eventName: string): OddsData[] {
    const allOdds = this.oddsCache.get('live') || [];
    return allOdds.filter(o => o.eventName.includes(eventName));
  }

  getAllLiveOdds(): OddsData[] {
    return this.oddsCache.get('live') || [];
  }

  shutdown() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

export const oddsAggregatorService = new OddsAggregatorService();
