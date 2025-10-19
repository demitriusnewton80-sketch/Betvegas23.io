
import express, { Request, Response } from 'express';
import { espnTrackerService } from '../services/ESPNSportsTrackerService.js';

const router = express.Router();

// Get all live games
router.get('/live', (req: Request, res: Response) => {
  const liveGames = espnTrackerService.getCurrentLiveGames();
  
  res.json({
    liveGames,
    count: liveGames.length,
    timestamp: new Date().toISOString()
  });
});

// Get live games by league
router.get('/live/:league', (req: Request, res: Response) => {
  const { league } = req.params;
  const liveGames = espnTrackerService.getLiveGamesByLeague(league.toUpperCase());
  
  res.json({
    league: league.toUpperCase(),
    liveGames,
    count: liveGames.length,
    timestamp: new Date().toISOString()
  });
});

// Get upcoming games
router.get('/upcoming', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const upcomingGames = espnTrackerService.getUpcomingGames(limit);
  
  res.json({
    upcomingGames,
    count: upcomingGames.length,
    timestamp: new Date().toISOString()
  });
});

// Get all games (live and upcoming)
router.get('/games', (req: Request, res: Response) => {
  const allGames = espnTrackerService.getAllLiveGames();
  
  res.json({
    games: allGames,
    liveCount: allGames.filter(g => g.status === 'live').length,
    upcomingCount: allGames.filter(g => g.status === 'scheduled').length,
    totalCount: allGames.length,
    timestamp: new Date().toISOString()
  });
});

// Get specific game details
router.get('/game/:gameId', (req: Request, res: Response) => {
  const { gameId } = req.params;
  const game = espnTrackerService.getGame(gameId);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  res.json({
    game,
    timestamp: new Date().toISOString()
  });
});

// Get recent sports news
router.get('/news', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const news = espnTrackerService.getRecentNews(limit);
  
  res.json({
    news,
    count: news.length,
    timestamp: new Date().toISOString()
  });
});

// Get news by league
router.get('/news/:league', (req: Request, res: Response) => {
  const { league } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const news = espnTrackerService.getNewsByLeague(league.toUpperCase(), limit);
  
  res.json({
    league: league.toUpperCase(),
    news,
    count: news.length,
    timestamp: new Date().toISOString()
  });
});

// SSE endpoint for live score updates
router.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const updateHandler = (update: any) => {
    res.write(`data: ${JSON.stringify(update)}\n\n`);
  };

  espnTrackerService.on('scoreUpdate', updateHandler);

  // Send initial data
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    liveGames: espnTrackerService.getCurrentLiveGames(),
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Send updates every 5 seconds
  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify({
      type: 'refresh',
      liveGames: espnTrackerService.getCurrentLiveGames(),
      timestamp: new Date().toISOString()
    })}\n\n`);
  }, 5000);

  req.on('close', () => {
    espnTrackerService.off('scoreUpdate', updateHandler);
    clearInterval(interval);
    res.end();
  });
});

export default router;
