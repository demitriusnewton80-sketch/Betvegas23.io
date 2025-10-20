
import express, { Request, Response } from 'express';
import { espnTrackerService } from '../services/ESPNSportsTrackerService.js';
import { sportsRadioService } from '../services/SportsRadioService.js';

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

  // ESPN Radio Streaming Integration
router.get('/radio-streams', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  
  const liveGames = espnTrackerService.getCurrentLiveGames();
  const radioStreams = sportsRadioService.getLiveRadioStreams();
  
  // Map ESPN games to radio streams
  const espnRadioData = liveGames.map(game => {
    const matchingRadio = radioStreams.find(r => 
      r.league === game.league && 
      (r.homeTeam === game.homeTeam || r.awayTeam === game.awayTeam)
    );
    
    return {
      gameId: game.gameId,
      league: game.league,
      matchup: `${game.awayTeam} @ ${game.homeTeam}`,
      status: game.status,
      score: game.score,
      radioStream: matchingRadio ? {
        streamUrl: matchingRadio.streamUrl,
        fallbackUrls: matchingRadio.fallbackUrls,
        listeners: matchingRadio.listeners,
        quality: matchingRadio.quality
      } : null
    };
  });
  
  res.json({
    success: true,
    espnRadioStreams: espnRadioData,
    totalGames: liveGames.length,
    gamesWithRadio: espnRadioData.filter(g => g.radioStream).length,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Get ESPN radio stream for specific game
router.get('/radio-stream/:gameId', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  
  const { gameId } = req.params;
  const game = espnTrackerService.getGame(gameId);
  
  if (!game) {
    return res.status(404).json({
      success: false,
      error: 'Game not found'
    });
  }
  
  const radioStreams = sportsRadioService.getRadioStreamsByLeague(game.league);
  const matchingRadio = radioStreams.find(r => 
    r.homeTeam === game.homeTeam || r.awayTeam === game.awayTeam
  );
  
  if (!matchingRadio) {
    return res.status(404).json({
      success: false,
      error: 'No radio stream available for this game'
    });
  }
  
  res.json({
    success: true,
    game: {
      gameId: game.gameId,
      league: game.league,
      matchup: `${game.awayTeam} @ ${game.homeTeam}`,
      status: game.status,
      score: game.score
    },
    radioStream: {
      streamUrl: matchingRadio.streamUrl,
      fallbackUrls: matchingRadio.fallbackUrls,
      listeners: matchingRadio.listeners,
      quality: matchingRadio.quality,
      homeTeamLogo: matchingRadio.homeTeamLogo,
      awayTeamLogo: matchingRadio.awayTeamLogo
    },
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

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
