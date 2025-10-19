
import express, { Request, Response } from 'express';
import { bettingService } from '../services/BettingService.js';
import { quickNodeService } from '../services/QuickNodeService.js';
import { sportsDataService } from '../services/SportsDataService.js';

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
  radioLink?: string;
}

router.get('/', (req: Request, res: Response) => {
  const allEvents = sportsDataService.getAllEvents();
  res.json({
    message: 'Young Meat LLC Sportsbook - Money Line Betting',
    totalGames: allEvents.length,
    sports: ['NFL', 'NBA', 'MLB', 'NHL', 'Boxing']
  });
});

router.get('/games', (req: Request, res: Response) => {
  const { sport, status, source } = req.query;
  
  let events = sport ? sportsDataService.getEventsBySport(sport as string) : sportsDataService.getAllEvents();
  
  if (status) {
    events = events.filter(event => event.status === status);
  }
  
  const games: Game[] = events.map(event => ({
    id: event.id,
    sport: event.sport,
    homeTeam: event.homeTeam,
    awayTeam: event.awayTeam,
    startTime: event.startTime,
    odds: event.moneyLine,
    status: event.status,
    radioLink: event.radioLink
  }));
  
  const response: any = {
    games,
    count: games.length
  };

  // Add PlayStation Network specific info
  if (source === 'psn') {
    response.psnGaming = {
      maddenNFL: games.filter(g => g.sport === 'NFL').length,
      nba2k: games.filter(g => g.sport === 'NBA').length,
      undisputedBoxing: games.filter(g => g.sport === 'Boxing').length,
      message: 'Bet on your favorite PlayStation 5 gaming content'
    };
  }
  
  res.json(response);
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
  const event = sportsDataService.getEvent(req.params.id);
  
  if (!event) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  const game: Game = {
    id: event.id,
    sport: event.sport,
    homeTeam: event.homeTeam,
    awayTeam: event.awayTeam,
    startTime: event.startTime,
    odds: event.moneyLine,
    status: event.status,
    radioLink: event.radioLink
  };
  
  res.json(game);
});

// Get radio link for a game
router.get('/games/:id/radio', (req: Request, res: Response) => {
  const radioLink = sportsDataService.getRadioLink(req.params.id);
  
  if (!radioLink) {
    return res.status(404).json({ error: 'Radio link not found for this game' });
  }
  
  res.json({
    gameId: req.params.id,
    radioLink,
    message: 'Live radio stream available'
  });
});

router.post('/bet', (req: Request, res: Response) => {
  const { userId = 'demo-user', gameId, team, amount } = req.body;
  
  const event = sportsDataService.getEvent(gameId);
  
  if (!event) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount' });
  }

  const odds = team === 'home' ? event.moneyLine.home : team === 'away' ? event.moneyLine.away : event.moneyLine.draw || 0;
  
  const result = bettingService.placeBet(userId, gameId, team, amount, odds);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  
  res.json({
    message: 'Money line bet placed successfully',
    bet: result.bet,
    sport: event.sport,
    radioLink: event.radioLink
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
