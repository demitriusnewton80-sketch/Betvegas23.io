
import express, { Request, Response } from 'express';
import { oddsAggregatorService } from '../services/OddsAggregatorService.js';

const router = express.Router();

// Get all live odds
router.get('/live', (req: Request, res: Response) => {
  const odds = oddsAggregatorService.getAllLiveOdds();
  
  res.json({
    success: true,
    odds,
    count: odds.length,
    lastUpdated: new Date().toISOString(),
    fccEntity: '20130314143016'
  });
});

// Compare odds across bookmakers
router.get('/compare/:eventName', (req: Request, res: Response) => {
  const { eventName } = req.params;
  const odds = oddsAggregatorService.compareOdds(eventName);
  
  res.json({
    success: true,
    eventName,
    odds,
    bookmakerCount: odds.length,
    fccEntity: '20130314143016'
  });
});

// Get best odds for specific event
router.get('/best/:eventId', (req: Request, res: Response) => {
  const { eventId } = req.params;
  const odds = oddsAggregatorService.getBestOdds(eventId);
  
  if (!odds) {
    return res.status(404).json({
      success: false,
      error: 'Event not found'
    });
  }
  
  res.json({
    success: true,
    odds,
    fccEntity: '20130314143016'
  });
});

export default router;
