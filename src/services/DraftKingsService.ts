
import { EventEmitter } from 'events';

interface DraftKingsOdds {
  gameId: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  odds: {
    home: number;
    away: number;
    draw?: number;
  };
  spread?: {
    home: { line: number; odds: number };
    away: { line: number; odds: number };
  };
  total?: {
    over: { line: number; odds: number };
    under: { line: number; odds: number };
  };
}

class DraftKingsService extends EventEmitter {
  private oddsCache: Map<string, DraftKingsOdds> = new Map();
  private lastUpdate: Date = new Date();

  constructor() {
    super();
    this.initializeDraftKingsData();
  }

  private initializeDraftKingsData(): void {
    // Simulate DraftKings odds data
    const dkOdds: DraftKingsOdds[] = [
      {
        gameId: 'DK-NFL-001',
        sport: 'NFL',
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'Buffalo Bills',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        odds: { home: -125, away: +105 },
        spread: {
          home: { line: -3.5, odds: -110 },
          away: { line: +3.5, odds: -110 }
        },
        total: {
          over: { line: 52.5, odds: -110 },
          under: { line: 52.5, odds: -110 }
        }
      },
      {
        gameId: 'DK-NBA-001',
        sport: 'NBA',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Boston Celtics',
        startTime: new Date(Date.now() + 43200000).toISOString(),
        odds: { home: -140, away: +120 },
        spread: {
          home: { line: -5.5, odds: -108 },
          away: { line: +5.5, odds: -112 }
        },
        total: {
          over: { line: 225.5, odds: -110 },
          under: { line: 225.5, odds: -110 }
        }
      }
    ];

    dkOdds.forEach(odds => this.oddsCache.set(odds.gameId, odds));
    this.lastUpdate = new Date();
  }

  // Get all DraftKings odds
  getAllOdds(): DraftKingsOdds[] {
    return Array.from(this.oddsCache.values());
  }

  // Get odds by sport
  getOddsBySport(sport: string): DraftKingsOdds[] {
    return Array.from(this.oddsCache.values())
      .filter(odds => odds.sport.toLowerCase() === sport.toLowerCase());
  }

  // Get specific game odds
  getGameOdds(gameId: string): DraftKingsOdds | null {
    return this.oddsCache.get(gameId) || null;
  }

  // Compare odds with other sportsbooks
  compareOdds(gameId: string, otherOdds: { home: number; away: number }): {
    betterValue: 'draftkings' | 'other' | 'equal';
    dkOdds: { home: number; away: number };
    difference: { home: number; away: number };
  } {
    const dkGame = this.oddsCache.get(gameId);
    if (!dkGame) {
      return {
        betterValue: 'other',
        dkOdds: { home: 0, away: 0 },
        difference: { home: 0, away: 0 }
      };
    }

    const homeDiff = dkGame.odds.home - otherOdds.home;
    const awayDiff = dkGame.odds.away - otherOdds.away;

    let betterValue: 'draftkings' | 'other' | 'equal' = 'equal';
    if (homeDiff > 0 || awayDiff > 0) {
      betterValue = 'draftkings';
    } else if (homeDiff < 0 || awayDiff < 0) {
      betterValue = 'other';
    }

    return {
      betterValue,
      dkOdds: dkGame.odds,
      difference: { home: homeDiff, away: awayDiff }
    };
  }

  // Refresh odds data
  refreshOdds(): void {
    this.initializeDraftKingsData();
    this.emit('oddsUpdated', this.getAllOdds());
  }

  // Get best available odds across markets
  getBestOdds(gameId: string): {
    moneyline: { home: number; away: number };
    spread: { home: number; away: number };
    total: { over: number; under: number };
  } | null {
    const game = this.oddsCache.get(gameId);
    if (!game) return null;

    return {
      moneyline: game.odds,
      spread: {
        home: game.spread?.home.odds || -110,
        away: game.spread?.away.odds || -110
      },
      total: {
        over: game.total?.over.odds || -110,
        under: game.total?.under.odds || -110
      }
    };
  }

  // Get last update timestamp
  getLastUpdate(): Date {
    return this.lastUpdate;
  }
}

export const draftKingsService = new DraftKingsService();
