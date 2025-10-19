
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

// Core sportsbook info
router.get('/', (req: Request, res: Response) => {
  const allEvents = sportsDataService.getAllEvents();
  res.json({
    success: true,
    sportsbook: 'Young Meeat LLC',
    fccEntity: '20130314143016',
    fccRegistration: '0024454324',
    totalGames: allEvents.length,
    sports: ['NFL', 'NBA', 'MLB', 'NHL', 'Boxing'],
    endpoints: {
      games: '/sportsbook/games',
      placeBet: '/sportsbook/bet',
      userBets: '/sportsbook/user/:userId/bets',
      wallet: '/sportsbook/user/:userId/wallet'
    }
  });
});

// Get all games with filtering
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
    success: true,
    games,
    count: games.length,
    fccEntity: '20130314143016'
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

// Get single game details
router.get('/games/:id', (req: Request, res: Response) => {
  const event = sportsDataService.getEvent(req.params.id);
  
  if (!event) {
    return res.status(404).json({ 
      success: false,
      error: 'Game not found' 
    });
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
  
  res.json({
    success: true,
    game,
    fccEntity: '20130314143016'
  });
});

// Get radio link for a game
router.get('/games/:id/radio', (req: Request, res: Response) => {
  const radioLink = sportsDataService.getRadioLink(req.params.id);
  
  if (!radioLink) {
    return res.status(404).json({ 
      success: false,
      error: 'Radio link not found for this game' 
    });
  }
  
  res.json({
    success: true,
    gameId: req.params.id,
    radioLink,
    message: 'Live radio stream available',
    fccEntity: '20130314143016'
  });
});

// Place bet
router.post('/bet', (req: Request, res: Response) => {
  const { userId = 'demo-user', gameId, team, amount } = req.body;
  
  if (!gameId || !team || !amount) {
    return res.status(400).json({ 
      success: false,
      error: 'Missing required fields: gameId, team, amount' 
    });
  }

  const event = sportsDataService.getEvent(gameId);
  
  if (!event) {
    return res.status(404).json({ 
      success: false,
      error: 'Game not found' 
    });
  }
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid bet amount' 
    });
  }

  const odds = team === 'home' ? event.moneyLine.home : team === 'away' ? event.moneyLine.away : event.moneyLine.draw || 0;
  
  const result = bettingService.placeBet(userId, gameId, team, amount, odds);
  
  if (!result.success) {
    return res.status(400).json({ 
      success: false,
      error: result.error 
    });
  }
  
  res.json({
    success: true,
    message: 'Money line bet placed successfully',
    bet: result.bet,
    sport: event.sport,
    radioLink: event.radioLink,
    loyaltyPointsEarned: 10,
    fccEntity: '20130314143016'
  });
});

// Cash out bet
router.post('/cashout/:betId', (req: Request, res: Response) => {
  const { betId } = req.params;
  
  const result = bettingService.cashOut(betId);
  
  if (!result.success) {
    return res.status(400).json({ 
      success: false,
      error: result.error 
    });
  }
  
  res.json({
    success: true,
    message: 'Cash out successful',
    amount: result.amount,
    fccEntity: '20130314143016'
  });
});

// Get user bets
router.get('/user/:userId/bets', (req: Request, res: Response) => {
  const { userId } = req.params;
  const bets = bettingService.getUserBets(userId);
  
  res.json({
    success: true,
    bets,
    count: bets.length,
    fccEntity: '20130314143016'
  });
});

// Get user wallet
router.get('/user/:userId/wallet', (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = bettingService.getUser(userId);
  
  if (!user) {
    return res.status(404).json({ 
      success: false,
      error: 'User not found' 
    });
  }
  
  res.json({
    success: true,
    balance: user.walletBalance,
    transactions: bettingService.getUserTransactions(userId),
    fccEntity: '20130314143016'
  });
});

// Get user stats
router.get('/user/:userId/stats', (req: Request, res: Response) => {
  const { userId } = req.params;
  const stats = bettingService.getUserStats(userId);
  
  res.json({
    success: true,
    stats,
    fccEntity: '20130314143016'
  });
});

// Deposit funds
router.post('/user/:userId/deposit', (req: Request, res: Response) => {
  const { userId } = req.params;
  const { amount } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid deposit amount' 
    });
  }
  
  const result = bettingService.deposit(userId, amount);
  
  if (!result.success) {
    return res.status(400).json({ 
      success: false,
      error: result.error 
    });
  }
  
  const user = bettingService.getUser(userId);
  
  res.json({
    success: true,
    message: 'Deposit successful',
    newBalance: user?.walletBalance,
    fccEntity: '20130314143016'
  });
});

// Get external blockchain data
router.get('/external-data', async (req: Request, res: Response) => {
  try {
    const aggregatedData = await quickNodeService.aggregateSportsData();
    
    res.json({
      success: true,
      sources: aggregatedData.length,
      data: aggregatedData,
      timestamp: new Date().toISOString(),
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch external data'
    });
  }
});

// Get blockchain sports data
router.get('/blockchain-data', async (req: Request, res: Response) => {
  try {
    const blockchainData = await quickNodeService.getBlockchainSportsData();
    
    res.json({
      success: true,
      quicknode: 'connected',
      endpoint: 'Polygon Network',
      data: blockchainData,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch blockchain data'
    });
  }
});

// Mobile-optimized games endpoint
router.get('/mobile/games', async (req: Request, res: Response) => {
  try {
    const games = bettingService.getAllGames();
    
    res.json({
      success: true,
      games,
      quicknode: {
        endpoint: 'https://billowing-billowing-glitter.matic.quiknode.pro',
        chain: 'Polygon',
        chainId: 137
      },
      fccEntity: '20130314143016',
      mobileOptimized: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch mobile games'
    });
  }
});

export default router;
