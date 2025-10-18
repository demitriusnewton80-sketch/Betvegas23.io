
export interface User {
  id: string;
  username: string;
  email: string;
  walletBalance: number;
  createdAt: string;
}

export interface Bet {
  id: string;
  userId: string;
  gameId: string;
  team: string;
  amount: number;
  odds: number;
  potentialWin: number;
  status: 'pending' | 'won' | 'lost' | 'cashed_out';
  placedAt: string;
  settledAt?: string;
  cashOutAmount?: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'cashout';
  amount: number;
  timestamp: string;
  relatedBetId?: string;
}
