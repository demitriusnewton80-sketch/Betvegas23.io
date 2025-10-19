
import { EventEmitter } from 'events';
import { sportsDataService } from './SportsDataService.js';

export interface ParlayLeg {
  id: string;
  gameId: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  selection: string;
  betType: 'moneyline' | 'spread' | 'total';
  odds: number;
  startTime: string;
}

export interface Parlay {
  id: string;
  userId: string;
  legs: ParlayLeg[];
  totalOdds: number;
  stake: number;
  potentialPayout: number;
  status: 'pending' | 'won' | 'lost' | 'active';
  createdAt: string;
  aiSuggested: boolean;
  confidence: number;
}

export interface AISuggestion {
  parlayLegs: ParlayLeg[];
  confidence: number;
  reasoning: string;
  expectedValue: number;
  riskLevel: 'low' | 'medium' | 'high';
}

class ParlayBuilderService extends EventEmitter {
  private parlays: Map<string, Parlay> = new Map();
  private userHistory: Map<string, string[]> = new Map();

  constructor() {
    super();
  }

  // Build parlay from selected legs
  buildParlay(userId: string, legs: ParlayLeg[], stake: number): Parlay {
    const parlayId = `PARLAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate combined odds
    let combinedOdds = 1;
    legs.forEach(leg => {
      const decimalOdds = leg.odds > 0 
        ? (leg.odds / 100 + 1) 
        : (100 / Math.abs(leg.odds) + 1);
      combinedOdds *= decimalOdds;
    });

    const americanOdds = combinedOdds > 2 
      ? Math.round((combinedOdds - 1) * 100) 
      : Math.round(-100 / (combinedOdds - 1));

    const potentialPayout = stake * combinedOdds;

    const parlay: Parlay = {
      id: parlayId,
      userId,
      legs,
      totalOdds: americanOdds,
      stake,
      potentialPayout,
      status: 'pending',
      createdAt: new Date().toISOString(),
      aiSuggested: false,
      confidence: this.calculateConfidence(legs)
    };

    this.parlays.set(parlayId, parlay);
    
    // Track user history
    if (!this.userHistory.has(userId)) {
      this.userHistory.set(userId, []);
    }
    this.userHistory.get(userId)!.push(parlayId);

    this.emit('parlayCreated', parlay);
    return parlay;
  }

  // AI-powered parlay suggestions based on user history
  getAISuggestions(userId: string, maxLegs: number = 4): AISuggestion[] {
    const allGames = sportsDataService.getAllEvents();
    const suggestions: AISuggestion[] = [];

    // Strategy 1: High confidence favorites
    const favorites = allGames
      .filter(g => g.status === 'upcoming')
      .filter(g => g.moneyLine.home < -200 || g.moneyLine.away < -200)
      .slice(0, 3);

    if (favorites.length >= 2) {
      const legs: ParlayLeg[] = favorites.map(game => ({
        id: crypto.randomUUID(),
        gameId: game.id,
        sport: game.sport,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        selection: game.moneyLine.home < game.moneyLine.away ? 'home' : 'away',
        betType: 'moneyline',
        odds: Math.min(game.moneyLine.home, game.moneyLine.away),
        startTime: game.startTime
      }));

      suggestions.push({
        parlayLegs: legs,
        confidence: 85,
        reasoning: 'Heavy favorites across multiple games - lower risk, steady returns',
        expectedValue: 1.15,
        riskLevel: 'low'
      });
    }

    // Strategy 2: Mixed favorites and underdogs
    const mixed = allGames
      .filter(g => g.status === 'upcoming')
      .slice(0, 4);

    if (mixed.length >= 3) {
      const legs: ParlayLeg[] = mixed.map((game, idx) => {
        const pickUnderdog = idx % 2 === 1;
        return {
          id: crypto.randomUUID(),
          gameId: game.id,
          sport: game.sport,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          selection: pickUnderdog 
            ? (game.moneyLine.home > game.moneyLine.away ? 'home' : 'away')
            : (game.moneyLine.home < game.moneyLine.away ? 'home' : 'away'),
          betType: 'moneyline',
          odds: pickUnderdog
            ? Math.max(game.moneyLine.home, game.moneyLine.away)
            : Math.min(game.moneyLine.home, game.moneyLine.away),
          startTime: game.startTime
        };
      });

      suggestions.push({
        parlayLegs: legs,
        confidence: 65,
        reasoning: 'Balanced mix of favorites and value picks - higher upside potential',
        expectedValue: 1.35,
        riskLevel: 'medium'
      });
    }

    // Strategy 3: Same-game parlay
    const liveGames = allGames.filter(g => g.status === 'live');
    if (liveGames.length > 0) {
      const game = liveGames[0];
      const legs: ParlayLeg[] = [
        {
          id: crypto.randomUUID(),
          gameId: game.id,
          sport: game.sport,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          selection: 'home',
          betType: 'moneyline',
          odds: game.moneyLine.home,
          startTime: game.startTime
        },
        {
          id: crypto.randomUUID(),
          gameId: game.id,
          sport: game.sport,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          selection: 'over',
          betType: 'total',
          odds: -110,
          startTime: game.startTime
        }
      ];

      suggestions.push({
        parlayLegs: legs,
        confidence: 70,
        reasoning: 'Same-game parlay: Team win + High scoring - correlated outcomes',
        expectedValue: 1.25,
        riskLevel: 'medium'
      });
    }

    return suggestions;
  }

  // Calculate win probability
  calculateWinProbability(parlay: Parlay): number {
    let totalProb = 1;
    
    parlay.legs.forEach(leg => {
      const prob = leg.odds < 0
        ? Math.abs(leg.odds) / (Math.abs(leg.odds) + 100)
        : 100 / (leg.odds + 100);
      totalProb *= prob;
    });

    return totalProb * 100;
  }

  // Calculate confidence based on legs
  private calculateConfidence(legs: ParlayLeg[]): number {
    const avgOdds = legs.reduce((sum, leg) => {
      const prob = leg.odds < 0
        ? Math.abs(leg.odds) / (Math.abs(leg.odds) + 100)
        : 100 / (leg.odds + 100);
      return sum + prob;
    }, 0) / legs.length;

    return Math.round(avgOdds * 100);
  }

  // Get user's parlays
  getUserParlays(userId: string): Parlay[] {
    const parlayIds = this.userHistory.get(userId) || [];
    return parlayIds
      .map(id => this.parlays.get(id))
      .filter(p => p !== undefined) as Parlay[];
  }

  // Get parlay by ID
  getParlay(parlayId: string): Parlay | undefined {
    return this.parlays.get(parlayId);
  }

  // Cash out parlay early
  cashOutParlay(parlayId: string): { success: boolean; amount?: number; error?: string } {
    const parlay = this.parlays.get(parlayId);
    
    if (!parlay) {
      return { success: false, error: 'Parlay not found' };
    }

    if (parlay.status !== 'pending') {
      return { success: false, error: 'Parlay cannot be cashed out' };
    }

    // Calculate cash out value (80% of current value)
    const cashOutValue = parlay.potentialPayout * 0.8;
    parlay.status = 'active';

    this.emit('parlayCashedOut', { parlay, cashOutValue });
    return { success: true, amount: cashOutValue };
  }
}

export const parlayBuilderService = new ParlayBuilderService();
