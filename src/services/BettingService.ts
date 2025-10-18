// To use Replit Database for persistence:
// 1. Install: npm install @replit/database
// 2. Import: import Database from "@replit/database";
// 3. Initialize: const db = new Database();
// 4. Store data: await db.set("users", users);
// 5. Retrieve data: const users = await db.get("users");

import { Bet, User, Transaction } from '../models/User.js';
import { accountService } from './AccountService.js';
import { streamingService } from './StreamingService.js';

class BettingService {
  private users: Map<string, User> = new Map();
  private bets: Map<string, Bet> = new Map();
  private games: Map<string, Game> = new Map();
  private transactions: Map<string, Transaction[]> = new Map();

  constructor() {
    // Initialize with a demo user
    this.users.set('demo-user', {
      id: 'demo-user',
      username: 'DemoUser',
      email: 'demo@youngmeat.com',
      walletBalance: 1000,
      createdAt: new Date().toISOString()
    });

    // Sync with account service
    const account = accountService.getAccountByUsername('demo-user');
    if (account) {
      accountService.updateBalance(account.id, 1000, 'add');
    }
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  placeBet(userId: string, gameId: string, team: string, amount: number, odds: number): { success: boolean; bet?: Bet; error?: string } {
    const user = this.users.get(userId);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.walletBalance < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    const bet: Bet = {
      id: `BET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      gameId,
      team,
      amount,
      odds,
      potentialWin: amount * Math.abs(odds > 0 ? (odds / 100 + 1) : (100 / Math.abs(odds) + 1)),
      status: 'pending',
      placedAt: new Date().toISOString()
    };

    user.walletBalance -= amount;
    this.bets.set(bet.id, bet);

    this.addTransaction(userId, {
      id: `TXN-${Date.now()}`,
      userId,
      type: 'bet',
      amount: -amount,
      timestamp: new Date().toISOString(),
      relatedBetId: bet.id
    });

    // Grant Amazon Prime stream access for the game
    const streamAccess = streamingService.grantStreamAccess(userId, gameId, bet.id);

    return { success: true, bet, streamAccess };
  }

  cashOut(betId: string): { success: boolean; amount?: number; error?: string } {
    const bet = this.bets.get(betId);

    if (!bet) {
      return { success: false, error: 'Bet not found' };
    }

    if (bet.status !== 'pending') {
      return { success: false, error: 'Bet cannot be cashed out' };
    }

    const user = this.users.get(bet.userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Calculate cash out amount (typically 80-95% of potential win)
    const cashOutMultiplier = 0.85;
    const currentValue = bet.amount + (bet.potentialWin - bet.amount) * cashOutMultiplier;

    bet.status = 'cashed_out';
    bet.cashOutAmount = currentValue;
    bet.settledAt = new Date().toISOString();

    user.walletBalance += currentValue;

    this.addTransaction(bet.userId, {
      id: `TXN-${Date.now()}`,
      userId: bet.userId,
      type: 'cashout',
      amount: currentValue,
      timestamp: new Date().toISOString(),
      relatedBetId: betId
    });

    return { success: true, amount: currentValue };
  }

  settleBet(betId: string, won: boolean): { success: boolean; error?: string } {
    const bet = this.bets.get(betId);

    if (!bet) {
      return { success: false, error: 'Bet not found' };
    }

    if (bet.status !== 'pending') {
      return { success: false, error: 'Bet already settled' };
    }

    const user = this.users.get(bet.userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    bet.status = won ? 'won' : 'lost';
    bet.settledAt = new Date().toISOString();

    if (won) {
      user.walletBalance += bet.potentialWin;
      this.addTransaction(bet.userId, {
        id: `TXN-${Date.now()}`,
        userId: bet.userId,
        type: 'win',
        amount: bet.potentialWin,
        timestamp: new Date().toISOString(),
        relatedBetId: betId
      });
    }

    return { success: true };
  }

  getUserBets(userId: string): Bet[] {
    return Array.from(this.bets.values()).filter(bet => bet.userId === userId);
  }

  private addTransaction(userId: string, transaction: Transaction): void {
    if (!this.transactions.has(userId)) {
      this.transactions.set(userId, []);
    }
    this.transactions.get(userId)!.push(transaction);
  }

  getUserTransactions(userId: string): Transaction[] {
    return this.transactions.get(userId) || [];
  }

  deposit(userId: string, amount: number): { success: boolean; error?: string } {
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    user.walletBalance += amount;
    this.addTransaction(userId, {
      id: `TXN-${Date.now()}`,
      userId,
      type: 'deposit',
      amount,
      timestamp: new Date().toISOString()
    });

    return { success: true };
  }
}

export const bettingService = new BettingService();