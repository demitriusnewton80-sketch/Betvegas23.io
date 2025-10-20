
import { EventEmitter } from 'events';

export interface PS5Game {
  id: string;
  title: string;
  type: 'madden' | 'nba2k' | 'ufc' | 'undisputed' | '5v5-basketball';
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  odds: {
    home: number;
    away: number;
  };
  status: 'upcoming' | 'live' | 'completed';
  streamUrl?: string;
  betCount: number;
  maxPlayers?: number;
  currentPlayers?: number;
  entryFee?: number;
}

export interface PS5Bet {
  id: string;
  userId: string;
  gameId: string;
  team: 'home' | 'away';
  amount: number;
  odds: number;
  potentialPayout: number;
  status: 'pending' | 'won' | 'lost';
  placedAt: string;
}

export interface PS5User {
  id: string;
  psnId: string;
  username: string;
  email: string;
  walletBalance: number;
  totalBets: number;
  enrolledAt: string;
}

class PS5SportsService extends EventEmitter {
  private games: Map<string, PS5Game> = new Map();
  private bets: Map<string, PS5Bet> = new Map();
  private users: Map<string, PS5User> = new Map();
  private enrollmentPoints: Map<string, number> = new Map();

  constructor() {
    super();
    this.initializePS5Games();
  }

  private initializePS5Games() {
    // Madden NFL Games
    this.addGame({
      id: 'ps5-madden-1',
      title: 'Madden NFL 25',
      type: 'madden',
      homeTeam: 'Kansas City Chiefs',
      awayTeam: 'Buffalo Bills',
      startTime: new Date(Date.now() + 3600000).toISOString(),
      odds: { home: -150, away: +130 },
      status: 'upcoming',
      streamUrl: 'https://www.twitch.tv/madden',
      betCount: 0
    });

    this.addGame({
      id: 'ps5-madden-2',
      title: 'Madden NFL 25',
      type: 'madden',
      homeTeam: 'San Francisco 49ers',
      awayTeam: 'Dallas Cowboys',
      startTime: new Date(Date.now() + 7200000).toISOString(),
      odds: { home: -110, away: -110 },
      status: 'upcoming',
      betCount: 0
    });

    // NBA 2K Games
    this.addGame({
      id: 'ps5-nba2k-1',
      title: 'NBA 2K25',
      type: 'nba2k',
      homeTeam: 'Los Angeles Lakers',
      awayTeam: 'Boston Celtics',
      startTime: new Date(Date.now() + 5400000).toISOString(),
      odds: { home: +120, away: -140 },
      status: 'upcoming',
      streamUrl: 'https://www.twitch.tv/nba2k',
      betCount: 0
    });

    this.addGame({
      id: 'ps5-nba2k-2',
      title: 'NBA 2K25',
      type: 'nba2k',
      homeTeam: 'Golden State Warriors',
      awayTeam: 'Milwaukee Bucks',
      startTime: new Date(Date.now() + 10800000).toISOString(),
      odds: { home: -105, away: -115 },
      status: 'upcoming',
      betCount: 0
    });

    // UFC Games
    this.addGame({
      id: 'ps5-ufc-1',
      title: 'UFC 5',
      type: 'ufc',
      homeTeam: 'Jon Jones',
      awayTeam: 'Stipe Miocic',
      startTime: new Date(Date.now() + 14400000).toISOString(),
      odds: { home: -200, away: +170 },
      status: 'upcoming',
      streamUrl: 'https://www.twitch.tv/ufc',
      betCount: 0
    });

    // Undisputed Boxing
    this.addGame({
      id: 'ps5-undisputed-1',
      title: 'Undisputed',
      type: 'undisputed',
      homeTeam: 'Tyson Fury',
      awayTeam: 'Oleksandr Usyk',
      startTime: new Date(Date.now() + 18000000).toISOString(),
      odds: { home: -180, away: +150 },
      status: 'upcoming',
      streamUrl: 'https://www.twitch.tv/boxing',
      betCount: 0
    });

    // 5v5 Basketball
    this.addGame({
      id: 'ps5-5v5-1',
      title: '5v5 Pick-Up Basketball',
      type: '5v5-basketball',
      homeTeam: 'Team Alpha',
      awayTeam: 'Team Omega',
      startTime: new Date(Date.now() + 21600000).toISOString(),
      odds: { home: -110, away: -110 },
      status: 'upcoming',
      betCount: 0
    });
  }

  private addGame(game: PS5Game) {
    this.games.set(game.id, game);
  }

  // User Enrollment
  enrollUser(psnId: string, username: string, email: string): { success: boolean; user?: PS5User; error?: string } {
    const userId = `ps5-user-${crypto.randomUUID()}`;
    
    if (Array.from(this.users.values()).some(u => u.psnId === psnId)) {
      return { success: false, error: 'PSN ID already enrolled' };
    }

    const user: PS5User = {
      id: userId,
      psnId,
      username,
      email,
      walletBalance: 0,
      totalBets: 0,
      enrolledAt: new Date().toISOString()
    };

    this.users.set(userId, user);
    this.enrollmentPoints.set(userId, 100); // Starting enrollment points
    this.emit('userEnrolled', user);

    return { success: true, user };
  }

  // Get all PS5 games
  getAllGames(): PS5Game[] {
    return Array.from(this.games.values());
  }

  // Get games by type
  getGamesByType(type: PS5Game['type']): PS5Game[] {
    return Array.from(this.games.values()).filter(g => g.type === type);
  }

  // Get single game
  getGame(gameId: string): PS5Game | undefined {
    return this.games.get(gameId);
  }

  // Place bet on PS5 game
  placeBet(userId: string, gameId: string, team: 'home' | 'away', amount: number): { success: boolean; bet?: PS5Bet; error?: string } {
    const user = this.users.get(userId);
    const game = this.games.get(gameId);

    if (!user) {
      return { success: false, error: 'User not enrolled' };
    }

    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.status !== 'upcoming') {
      return { success: false, error: 'Game is not available for betting' };
    }

    if (user.walletBalance < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    const odds = team === 'home' ? game.odds.home : game.odds.away;
    const potentialPayout = this.calculatePayout(amount, odds);

    const bet: PS5Bet = {
      id: `ps5-bet-${crypto.randomUUID()}`,
      userId,
      gameId,
      team,
      amount,
      odds,
      potentialPayout,
      status: 'pending',
      placedAt: new Date().toISOString()
    };

    // Deduct from wallet
    user.walletBalance -= amount;
    user.totalBets += 1;

    // Increment game bet count
    game.betCount += 1;

    this.bets.set(bet.id, bet);
    this.emit('betPlaced', bet);

    return { success: true, bet };
  }

  private calculatePayout(amount: number, odds: number): number {
    if (odds > 0) {
      return amount + (amount * (odds / 100));
    } else {
      return amount + (amount / (Math.abs(odds) / 100));
    }
  }

  // Get user bets
  getUserBets(userId: string): PS5Bet[] {
    return Array.from(this.bets.values()).filter(b => b.userId === userId);
  }

  // Get user details
  getUser(userId: string): PS5User | undefined {
    return this.users.get(userId);
  }

  // Get user by PSN ID
  getUserByPSNId(psnId: string): PS5User | undefined {
    return Array.from(this.users.values()).find(u => u.psnId === psnId);
  }

  // Deposit funds
  deposit(userId: string, amount: number): { success: boolean; newBalance?: number; error?: string } {
    const user = this.users.get(userId);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    user.walletBalance += amount;
    this.emit('deposit', { userId, amount });

    return { success: true, newBalance: user.walletBalance };
  }

  // Get enrollment points
  getEnrollmentPoints(userId: string): number {
    return this.enrollmentPoints.get(userId) || 0;
  }

  // Award enrollment points
  awardPoints(userId: string, points: number): boolean {
    const currentPoints = this.getEnrollmentPoints(userId);
    this.enrollmentPoints.set(userId, currentPoints + points);
    return true;
  }
}

export const ps5SportsService = new PS5SportsService();
