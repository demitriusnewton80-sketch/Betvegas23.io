
import express, { Request, Response } from 'express';
import { espnTrackerService } from '../services/ESPNSportsTrackerService.js';
import { sportsDataService } from '../services/SportsDataService.js';

const router = express.Router();

// Public sports intelligence dashboard
router.get('/dashboard', (req: Request, res: Response) => {
  const liveGames = espnTrackerService.getCurrentLiveGames();
  const upcomingGames = espnTrackerService.getUpcomingGames(20);
  const allEvents = sportsDataService.getAllEvents();
  
  res.json({
    success: true,
    intelligence: {
      live: liveGames.map(game => ({
        gameId: game.gameId,
        league: game.league,
        matchup: `${game.awayTeam} @ ${game.homeTeam}`,
        venue: game.venue,
        status: game.status,
        score: game.score,
        location: getVenueCoordinates(game.venue)
      })),
      upcoming: upcomingGames.map(game => ({
        gameId: game.gameId,
        league: game.league,
        matchup: `${game.awayTeam} @ ${game.homeTeam}`,
        venue: game.venue,
        scheduledTime: game.scheduledStartTime,
        location: getVenueCoordinates(game.venue)
      })),
      allSports: allEvents.map(event => ({
        id: event.id,
        sport: event.sport,
        homeTeam: event.homeTeam,
        awayTeam: event.awayTeam,
        odds: event.moneyLine,
        radioLink: event.radioLink
      }))
    },
    publicAccess: true,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Google Maps integrated venue data
router.get('/venues/map', (req: Request, res: Response) => {
  const allGames = espnTrackerService.getAllLiveGames();
  
  const venueData = allGames.map(game => ({
    gameId: game.gameId,
    venue: game.venue,
    coordinates: getVenueCoordinates(game.venue),
    league: game.league,
    matchup: `${game.awayTeam} @ ${game.homeTeam}`,
    status: game.status
  }));
  
  res.json({
    success: true,
    venues: venueData,
    mapConfig: {
      apiKey: 'AIzaSyBFw0Qbyq9zTrrZINs7qkS8VwGQrAqWXP0', // Public Google Maps API
      center: { lat: 39.8283, lng: -98.5795 }, // Center of USA
      zoom: 4
    },
    publicAccess: true,
    fccEntity: '20130314143016'
  });
});

// League-specific intelligence
router.get('/league/:league', (req: Request, res: Response) => {
  const { league } = req.params;
  const leagueGames = espnTrackerService.getLiveGamesByLeague(league.toUpperCase());
  
  res.json({
    success: true,
    league: league.toUpperCase(),
    games: leagueGames,
    count: leagueGames.length,
    publicAccess: true,
    fccEntity: '20130314143016'
  });
});

// Public database export
router.get('/database/export', (req: Request, res: Response) => {
  const allGames = espnTrackerService.getAllLiveGames();
  const allEvents = sportsDataService.getAllEvents();
  
  res.json({
    success: true,
    database: {
      espnLiveGames: allGames,
      sportsEvents: allEvents,
      exportedAt: new Date().toISOString(),
      totalRecords: allGames.length + allEvents.length
    },
    publicAccess: true,
    fccEntity: '20130314143016'
  });
});

// Helper function to get venue coordinates
function getVenueCoordinates(venue: string): { lat: number; lng: number } | null {
  const venueMap: { [key: string]: { lat: number; lng: number } } = {
    'Arrowhead Stadium': { lat: 39.0489, lng: -94.4839 },
    'Levi\'s Stadium': { lat: 37.4032, lng: -121.9700 },
    'Crypto.com Arena': { lat: 34.0430, lng: -118.2673 },
    'Yankee Stadium': { lat: 40.8296, lng: -73.9262 },
    'Scotiabank Arena': { lat: 43.6435, lng: -79.3791 },
    'AT&T Stadium': { lat: 32.7473, lng: -97.0945 },
    'Madison Square Garden': { lat: 40.7505, lng: -73.9934 },
    'TD Garden': { lat: 42.3662, lng: -71.0621 }
  };
  
  return venueMap[venue] || { lat: 39.8283, lng: -98.5795 };
}

export default router;
