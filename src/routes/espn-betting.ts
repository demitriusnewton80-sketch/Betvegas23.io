
import express, { Request, Response } from 'express';
import { espnTrackerService } from '../services/ESPNSportsTrackerService.js';
import { bettingService } from '../services/BettingService.js';

const router = express.Router();

// Get ESPN betting odds for live games
router.get('/odds/live', (req: Request, res: Response) => {
  const liveGames = espnTrackerService.getCurrentLiveGames();
  
  const bettingOdds = liveGames.map(game => ({
    gameId: game.gameId,
    league: game.league,
    matchup: `${game.awayTeam} @ ${game.homeTeam}`,
    status: game.status,
    score: game.score,
    odds: {
      home: -110,
      away: -110,
      over: game.score ? (game.score.home + game.score.away + 45) : 210,
      under: game.score ? (game.score.home + game.score.away + 45) : 210
    },
    quarter: game.quarter,
    timeRemaining: game.timeRemaining
  }));
  
  res.json({
    liveGames: bettingOdds,
    count: bettingOdds.length,
    timestamp: new Date().toISOString()
  });
});

// Get ESPN betting odds for upcoming games
router.get('/odds/upcoming', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const upcomingGames = espnTrackerService.getUpcomingGames(limit);
  
  const bettingOdds = upcomingGames.map(game => ({
    gameId: game.gameId,
    league: game.league,
    matchup: `${game.awayTeam} @ ${game.homeTeam}`,
    scheduledTime: game.scheduledStartTime,
    venue: game.venue,
    odds: {
      home: Math.floor(Math.random() * 200) - 150,
      away: Math.floor(Math.random() * 200) - 150,
      over: 210 + Math.floor(Math.random() * 20),
      under: 210 + Math.floor(Math.random() * 20)
    }
  }));
  
  res.json({
    upcomingGames: bettingOdds,
    count: bettingOdds.length,
    timestamp: new Date().toISOString()
  });
});

// Place ESPN bet
router.post('/bet', (req: Request, res: Response) => {
  const { userId = 'demo-user', gameId, betType, selection, amount } = req.body;
  
  const game = espnTrackerService.getGame(gameId);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount' });
  }
  
  // Calculate odds based on bet type
  let odds = -110;
  if (betType === 'moneyline') {
    odds = selection === 'home' ? -130 : +110;
  } else if (betType === 'spread') {
    odds = -110;
  } else if (betType === 'total') {
    odds = -110;
  }
  
  const result = bettingService.placeBet(userId, gameId, selection, amount, odds);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  
  res.json({
    message: 'ESPN bet placed successfully',
    bet: result.bet,
    game: {
      league: game.league,
      matchup: `${game.awayTeam} @ ${game.homeTeam}`,
      status: game.status
    },
    espnLink: `https://www.espn.com/${game.league.toLowerCase()}/game/_/gameId/${gameId}`
  });
});

// Get ESPN live betting opportunities
router.get('/live-betting', (req: Request, res: Response) => {
  const liveGames = espnTrackerService.getCurrentLiveGames();
  
  const liveBettingOps = liveGames.map(game => ({
    gameId: game.gameId,
    league: game.league,
    matchup: `${game.awayTeam} @ ${game.homeTeam}`,
    score: game.score,
    quarter: game.quarter,
    timeRemaining: game.timeRemaining,
    liveBets: {
      nextScore: {
        home: -120,
        away: +100
      },
      totalPoints: {
        over: game.score ? (game.score.home + game.score.away + 25) : 150,
        under: game.score ? (game.score.home + game.score.away + 25) : 150
      },
      quarterWinner: {
        home: -115,
        away: -105
      }
    }
  }));
  
  res.json({
    liveBettingOpportunities: liveBettingOps,
    count: liveBettingOps.length,
    timestamp: new Date().toISOString()
  });
});

// Get ESPN parlay builder
router.post('/parlay', (req: Request, res: Response) => {
  const { userId = 'demo-user', selections, amount } = req.body;
  
  if (!selections || selections.length < 2) {
    return res.status(400).json({ error: 'Parlay requires at least 2 selections' });
  }
  
  // Calculate combined odds
  let combinedOdds = 1;
  selections.forEach((sel: any) => {
    const decimalOdds = sel.odds > 0 ? (sel.odds / 100 + 1) : (100 / Math.abs(sel.odds) + 1);
    combinedOdds *= decimalOdds;
  });
  
  const americanOdds = combinedOdds > 2 ? Math.round((combinedOdds - 1) * 100) : Math.round(-100 / (combinedOdds - 1));
  const potentialWin = amount * combinedOdds;
  
  res.json({
    parlayBet: {
      legs: selections.length,
      totalOdds: americanOdds,
      stake: amount,
      potentialPayout: potentialWin.toFixed(2),
      selections: selections
    },
    espnParlay: true
  });
});

export default router;
