import express, { Request, Response } from 'express';
import { sportsDataService } from '../services/SportsDataService.js';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    sportsbook: 'Young Meeat LLC',
    fccEntity: '20130314143016',
    endpoints: {
      games: '/sportsbook/games',
      platforms: '/sportsbook/platforms'
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
      games,
      count: games.length,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    console.error('Error loading games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load games',
      fccEntity: '20130314143016'
    });
  }
});

router.get('/platforms', (req: Request, res: Response) => {
  res.json({
    success: true,
    platforms: [
      { name: 'Live Sportsbook', url: '/index.html' },
      { name: 'Enhanced Sportsbook', url: '/enhanced-sportsbook.html' },
      { name: 'Mobile Hub', url: '/mobile-sportsbook-hub.html' }
    ]
  });
});

export default router;