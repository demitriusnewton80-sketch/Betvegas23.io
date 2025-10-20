
import express, { Request, Response } from 'express';
import { draftKingsService } from '../services/DraftKingsService.js';
import { bettingService } from '../services/BettingService.js';

const router = express.Router();

// Get all DraftKings odds
router.get('/odds', (req: Request, res: Response) => {
  const { sport } = req.query;
  
  const odds = sport 
    ? draftKingsService.getOddsBySport(sport as string)
    : draftKingsService.getAllOdds();
  
  res.json({
    success: true,
    sportsbook: 'DraftKings',
    odds,
    count: odds.length,
    lastUpdate: draftKingsService.getLastUpdate(),
    fccEntity: '20130314143016'
  });
});

// Get specific game odds
router.get('/odds/:gameId', (req: Request, res: Response) => {
  const { gameId } = req.params;
  const odds = draftKingsService.getGameOdds(gameId);
  
  if (!odds) {
    return res.status(404).json({
      success: false,
      error: 'Game not found'
    });
  }
  
  res.json({
    success: true,
    sportsbook: 'DraftKings',
    odds,
    fccEntity: '20130314143016'
  });
});

// Compare odds with other sportsbooks
router.post('/compare', (req: Request, res: Response) => {
  const { gameId, otherOdds } = req.body;
  
  if (!gameId || !otherOdds) {
    return res.status(400).json({
      success: false,
      error: 'Missing gameId or otherOdds'
    });
  }
  
  const comparison = draftKingsService.compareOdds(gameId, otherOdds);
  
  res.json({
    success: true,
    gameId,
    comparison,
    recommendation: comparison.betterValue === 'draftkings' 
      ? 'DraftKings offers better odds for this game'
      : comparison.betterValue === 'other'
      ? 'Other sportsbook offers better odds'
      : 'Odds are equal',
    fccEntity: '20130314143016'
  });
});

// Place bet via DraftKings odds
router.post('/bet', (req: Request, res: Response) => {
  const { userId = 'demo-user', gameId, team, amount, betType = 'moneyline' } = req.body;
  
  const odds = draftKingsService.getGameOdds(gameId);
  
  if (!odds) {
    return res.status(404).json({
      success: false,
      error: 'Game not found on DraftKings'
    });
  }
  
  let finalOdds = team === 'home' ? odds.odds.home : odds.odds.away;
  
  // Apply different odds based on bet type
  if (betType === 'spread' && odds.spread) {
    finalOdds = team === 'home' ? odds.spread.home.odds : odds.spread.away.odds;
  } else if (betType === 'total' && odds.total) {
    finalOdds = team === 'over' ? odds.total.over.odds : odds.total.under.odds;
  }
  
  const result = bettingService.placeBet(userId, gameId, team, amount, finalOdds);
  
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error
    });
  }
  
  res.json({
    success: true,
    message: 'DraftKings bet placed successfully',
    bet: result.bet,
    sportsbook: 'DraftKings',
    betType,
    fccEntity: '20130314143016'
  });
});

// Get best odds for a game
router.get('/best-odds/:gameId', (req: Request, res: Response) => {
  const { gameId } = req.params;
  const bestOdds = draftKingsService.getBestOdds(gameId);
  
  if (!bestOdds) {
    return res.status(404).json({
      success: false,
      error: 'Game not found'
    });
  }
  
  res.json({
    success: true,
    gameId,
    bestOdds,
    sportsbook: 'DraftKings',
    fccEntity: '20130314143016'
  });
});

// Refresh odds data
router.post('/refresh', (req: Request, res: Response) => {
  draftKingsService.refreshOdds();
  
  res.json({
    success: true,
    message: 'DraftKings odds refreshed',
    lastUpdate: draftKingsService.getLastUpdate(),
    fccEntity: '20130314143016'
  });
});

export default router;
