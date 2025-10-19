
import express, { Request, Response } from 'express';
import { ps5SportsService } from '../services/PS5SportsService.js';

const router = express.Router();

// Get all PS5 games
router.get('/games', (req: Request, res: Response) => {
  const { type } = req.query;
  
  let games;
  if (type && typeof type === 'string') {
    games = ps5SportsService.getGamesByType(type as any);
  } else {
    games = ps5SportsService.getAllGames();
  }
  
  res.json({
    message: 'PlayStation 5 Sports Betting - Available Games',
    games,
    count: games.length,
    types: ['madden', 'nba2k', 'ufc', 'undisputed', '5v5-basketball']
  });
});

// Get specific game
router.get('/games/:gameId', (req: Request, res: Response) => {
  const { gameId } = req.params;
  const game = ps5SportsService.getGame(gameId);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  res.json(game);
});

// Enroll new user
router.post('/enroll', (req: Request, res: Response) => {
  const { psnId, username, email } = req.body;
  
  if (!psnId || !username || !email) {
    return res.status(400).json({ error: 'PSN ID, username, and email are required' });
  }
  
  const result = ps5SportsService.enrollUser(psnId, username, email);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  
  res.json({
    message: 'Successfully enrolled in PS5 Sports Betting',
    user: result.user,
    enrollmentPoints: ps5SportsService.getEnrollmentPoints(result.user!.id)
  });
});

// Place bet
router.post('/bet', (req: Request, res: Response) => {
  const { userId, gameId, team, amount } = req.body;
  
  if (!userId || !gameId || !team || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (amount <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount' });
  }
  
  const result = ps5SportsService.placeBet(userId, gameId, team, amount);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  
  // Award enrollment points for placing bet
  ps5SportsService.awardPoints(userId, 10);
  
  res.json({
    message: 'Bet placed successfully',
    bet: result.bet,
    pointsAwarded: 10,
    totalPoints: ps5SportsService.getEnrollmentPoints(userId)
  });
});

// Get user info
router.get('/user/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = ps5SportsService.getUser(userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    user,
    enrollmentPoints: ps5SportsService.getEnrollmentPoints(userId)
  });
});

// Get user by PSN ID
router.get('/user/psn/:psnId', (req: Request, res: Response) => {
  const { psnId } = req.params;
  const user = ps5SportsService.getUserByPSNId(psnId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    user,
    enrollmentPoints: ps5SportsService.getEnrollmentPoints(user.id)
  });
});

// Get user bets
router.get('/user/:userId/bets', (req: Request, res: Response) => {
  const { userId } = req.params;
  const bets = ps5SportsService.getUserBets(userId);
  
  res.json({
    bets,
    count: bets.length
  });
});

// Deposit funds
router.post('/user/:userId/deposit', (req: Request, res: Response) => {
  const { userId } = req.params;
  const { amount } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid deposit amount' });
  }
  
  const result = ps5SportsService.deposit(userId, amount);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  
  res.json({
    message: 'Deposit successful',
    newBalance: result.newBalance
  });
});

// Get enrollment points
router.get('/user/:userId/points', (req: Request, res: Response) => {
  const { userId } = req.params;
  const points = ps5SportsService.getEnrollmentPoints(userId);
  
  res.json({
    userId,
    enrollmentPoints: points
  });
});

// Public plugin approval endpoint
router.get('/plugin/status', (req: Request, res: Response) => {
  res.json({
    pluginName: 'PS5 Network Enrollment Plugin',
    status: 'active',
    approved: true,
    publicAccess: true,
    connectionPoint: 'https://2ff2dd2c-0218-43d5-83da-e4e4577d5b62-00-2ntrr3ce4l5i4.picard.replit.dev',
    fccEntity: '20130314143016',
    samGovPermit: 'Young Meeat LLC',
    supportedGames: ['madden', 'nba2k', 'ufc', 'undisputed', '5v5-basketball'],
    enrollmentEnabled: true,
    message: 'PlayStation 5 Network users approved for enrollment through this plugin point'
  });
});

// Verify plugin connection
router.post('/plugin/verify', (req: Request, res: Response) => {
  const { psnId, connectionUrl } = req.body;
  
  const expectedUrl = 'https://2ff2dd2c-0218-43d5-83da-e4e4577d5b62-00-2ntrr3ce4l5i4.picard.replit.dev';
  
  if (connectionUrl !== expectedUrl) {
    return res.status(400).json({
      verified: false,
      error: 'Invalid connection URL'
    });
  }
  
  res.json({
    verified: true,
    psnId,
    pluginApproved: true,
    enrollmentLink: '/ps5-enrollment-plugin.html',
    message: 'Connection verified. Proceed with enrollment.'
  });
});

export default router;
