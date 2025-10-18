
import express, { Request, Response } from 'express';
import { bettingService } from '../services/BettingService.js';
import { quickNodeService } from '../services/QuickNodeService.js';

const router = express.Router();

interface Game {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  odds: {
    home: number;
    away: number;
    draw?: number;
  };
  status: 'upcoming' | 'live' | 'completed';
}

const sampleGames: Game[] = [
  {
    id: '1',
    sport: 'NFL',
    homeTeam: 'Kansas City Chiefs',
    awayTeam: 'Buffalo Bills',
    startTime: '2025-01-15T18:00:00Z',
    odds: { home: -110, away: +105 },
    status: 'upcoming'
  },
  {
    id: '2',
    sport: 'NBA',
    homeTeam: 'Los Angeles Lakers',
    awayTeam: 'Boston Celtics',
    startTime: '2025-01-15T20:00:00Z',
    odds: { home: +120, away: -140 },
    status: 'upcoming'
  },
  {
    id: '3',
    sport: 'Soccer',
    homeTeam: 'Manchester United',
    awayTeam: 'Liverpool',
    startTime: '2025-01-16T15:00:00Z',
    odds: { home: +150, away: +180, draw: +220 },
    status: 'upcoming'
  },
  {
    id: '4',
    sport: 'NHL',
    homeTeam: 'Toronto Maple Leafs',
    awayTeam: 'Montreal Canadiens',
    startTime: '2025-01-15T19:00:00Z',
    odds: { home: -125, away: +115 },
    status: 'live'
  }
];

router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Young Meat LLC Sportsbook',
    totalGames: sampleGames.length,
    sports: ['NFL', 'NBA', 'NHL', 'Soccer']
  });
});

router.get('/games', (req: Request, res: Response) => {
  const { sport, status } = req.query;
  
  let filteredGames = sampleGames;
  
  if (sport) {
    filteredGames = filteredGames.filter(game => 
      game.sport.toLowerCase() === (sport as string).toLowerCase()
    );
  }
  
  if (status) {
    filteredGames = filteredGames.filter(game => 
      game.status === status
    );
  }
  
  res.json({
    games: filteredGames,
    count: filteredGames.length
  });
});

router.get('/external-data', async (req: Request, res: Response) => {
  try {
    const aggregatedData = await quickNodeService.aggregateSportsData();
    
    res.json({
      success: true,
      sources: aggregatedData.length,
      data: aggregatedData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch external data'
    });
  }
});

router.get('/blockchain-data', async (req: Request, res: Response) => {
  try {
    const blockchainData = await quickNodeService.getBlockchainSportsData();
    
    res.json({
      success: true,
      quicknode: 'connected',
      endpoint: 'Polygon Network',
      data: blockchainData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch blockchain data'
    });
  }
});

router.get('/games/:id', (req: Request, res: Response) => {
  const game = sampleGames.find(g => g.id === req.params.id);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  res.json(game);
});

router.post('/bet', (req: Request, res: Response) => {
  const { userId = 'demo-user', gameId, team, amount } = req.body;
  
  const game = sampleGames.find(g => g.id === gameId);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount' });
  }

  const odds = team === 'home' ? game.odds.home : team === 'away' ? game.odds.away : game.odds.draw || 0;
  
  const result = bettingService.placeBet(userId, gameId, team, amount, odds);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  
  res.json({
    message: 'Bet placed successfully',
    bet: result.bet
  });
});

router.post('/cashout/:betId', (req: Request, res: Response) => {
  const { betId } = req.params;
  
  const result = bettingService.cashOut(betId);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  
  res.json({
    message: 'Cash out successful',
    amount: result.amount
  });
});

router.get('/user/:userId/bets', (req: Request, res: Response) => {
  const { userId } = req.params;
  const bets = bettingService.getUserBets(userId);
  
  res.json({
    bets,
    count: bets.length
  });
});

router.get('/user/:userId/wallet', (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = bettingService.getUser(userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    balance: user.walletBalance,
    transactions: bettingService.getUserTransactions(userId)
  });
});

router.post('/user/:userId/deposit', (req: Request, res: Response) => {
  const { userId } = req.params;
  const { amount } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid deposit amount' });
  }
  
  const result = bettingService.deposit(userId, amount);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  
  const user = bettingService.getUser(userId);
  
  res.json({
    message: 'Deposit successful',
    newBalance: user?.walletBalance
  });
});

export default router;
