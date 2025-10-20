import express, { Request, Response } from 'express';
import { bettingService } from '../services/BettingService.js';
import { streamingService } from '../services/StreamingService.js';
import { ps5SportsService } from '../services/PS5SportsService.js';

const router = express.Router();

// Mobile-optimized games endpoint
router.get('/games', async (req: Request, res: Response) => {
  try {
    const games = bettingService.getAllGames();

    // Return mobile-optimized response with reduced data
    const mobileGames = games.slice(0, 20).map(game => ({
      id: game.id,
      sport: game.sport,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      startTime: game.startTime,
      status: game.status,
      odds: {
        home: game.odds.home,
        away: game.odds.away
      }
    }));

    res.json({
      success: true,
      games: mobileGames,
      count: mobileGames.length,
      mobile: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load games'
    });
  }
});

// Mobile quick stats
router.get('/stats', (req: Request, res: Response) => {
  try {
    const games = bettingService.getAllGames();
    const liveGames = games.filter(g => g.status === 'live');
    const upcomingGames = games.filter(g => g.status === 'scheduled');

    res.json({
      success: true,
      stats: {
        totalGames: games.length,
        liveGames: liveGames.length,
        upcomingGames: upcomingGames.length,
        sports: [...new Set(games.map(g => g.sport))].length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load stats'
    });
  }
});

// Mobile user profile
router.get('/profile/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const wallet = bettingService.getUserWallet(userId);
    const bets = bettingService.getUserBets(userId);

    res.json({
      success: true,
      profile: {
        userId,
        balance: wallet.balance,
        totalBets: bets.length,
        activeBets: bets.filter(b => b.status === 'pending').length,
        wonBets: bets.filter(b => b.status === 'won').length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load profile'
    });
  }
});

// Mobile-optimized streaming status
router.get('/streaming/status', (req: Request, res: Response) => {
  try {
    const partners = streamingService.getExternalSportsbooks();

    res.json({
      success: true,
      streaming: {
        active: partners.filter(p => p.active).length,
        total: partners.length,
        available: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load streaming status'
    });
  }
});

// Mobile PS5 games
router.get('/ps5/games', (req: Request, res: Response) => {
  try {
    const games = ps5SportsService.getAllGames();

    const mobileGames = games.slice(0, 15).map(game => ({
      id: game.id,
      type: game.type,
      title: game.title,
      status: game.status,
      maxPlayers: game.maxPlayers,
      currentPlayers: game.currentPlayers,
      entryFee: game.entryFee
    }));

    res.json({
      success: true,
      games: mobileGames,
      count: mobileGames.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load PS5 games'
    });
  }
});

export default router;