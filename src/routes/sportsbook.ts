
import express, { Request, Response } from 'express';
import { sportsDataService } from '../services/SportsDataService.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    sportsbook: 'BettingSites™ - Young Meeat LLC',
    brand: 'BettingSites',
    trademark: '™',
    fccEntity: '20130314143016',
    company: 'Young Meeat LLC',
    poweredBy: 'Amazon Web Services (AWS)',
    endpoints: {
      games: '/sportsbook/games',
      platforms: '/sportsbook/platforms',
      streams: '/streaming/streams',
      radio: '/sports-radio/live'
    }
  });
});

router.get('/games', (req: Request, res: Response) => {
  try {
    const events = sportsDataService.getAllEvents();

    const games = events.map(event => ({
      id: event.id,
      sport: event.sport,
      homeTeam: event.homeTeam,
      awayTeam: event.awayTeam,
      startTime: event.startTime,
      odds: event.moneyLine,
      status: event.status,
      radioLink: event.radioLink
    }));

    res.json({
      success: true,
      brand: 'BettingSites™',
      games,
      count: games.length,
      fccEntity: '20130314143016',
      poweredBy: 'AWS'
    });
  } catch (error) {
    console.error('Error loading games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load games',
      brand: 'BettingSites™',
      fccEntity: '20130314143016'
    });
  }
});

router.get('/platforms', (req: Request, res: Response) => {
  res.json({
    success: true,
    brand: 'BettingSites™',
    platforms: [
      { name: 'BettingSites Home', url: '/bettingsites-home.html' },
      { name: 'Live Sportsbook', url: '/index.html' },
      { name: 'Enhanced Sportsbook', url: '/enhanced-sportsbook.html' },
      { name: 'Mobile Hub', url: '/mobile-sportsbook-hub.html' },
      { name: 'Unified Sportsbook', url: '/unified-public-sportsbook.html' }
    ]
  });
});

router.post('/bet', (req: Request, res: Response) => {
  const { userId, gameId, team, amount } = req.body;
  
  if (!userId || !gameId || !team || !amount) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
      brand: 'BettingSites™'
    });
  }

  const event = sportsDataService.getEvent(gameId);
  if (!event) {
    return res.status(404).json({
      success: false,
      error: 'Game not found',
      brand: 'BettingSites™'
    });
  }

  const odds = team === 'home' ? event.moneyLine.home : event.moneyLine.away;
  const potentialWin = amount * Math.abs(odds > 0 ? (odds / 100 + 1) : (100 / Math.abs(odds) + 1));

  res.json({
    success: true,
    brand: 'BettingSites™',
    bet: {
      id: `BET-${Date.now()}`,
      userId,
      gameId,
      team,
      amount,
      odds,
      potentialWin: potentialWin.toFixed(2),
      status: 'pending',
      placedAt: new Date().toISOString()
    },
    fccEntity: '20130314143016',
    poweredBy: 'AWS'
  });
});

export default router;
