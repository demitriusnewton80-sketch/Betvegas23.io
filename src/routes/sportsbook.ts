
import express, { Request, Response } from 'express';

const router = express.Router();

interface Game {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  odds: {
    home: number;
    away: number;
    draw?: number;
  };
  status: 'upcoming' | 'live' | 'completed';
}

const sampleGames: Game[] = [
  {
    id: '1',
    sport: 'NFL',
    homeTeam: 'Kansas City Chiefs',
    awayTeam: 'Buffalo Bills',
    startTime: '2025-01-15T18:00:00Z',
    odds: { home: -110, away: +105 },
    status: 'upcoming'
  },
  {
    id: '2',
    sport: 'NBA',
    homeTeam: 'Los Angeles Lakers',
    awayTeam: 'Boston Celtics',
    startTime: '2025-01-15T20:00:00Z',
    odds: { home: +120, away: -140 },
    status: 'upcoming'
  },
  {
    id: '3',
    sport: 'Soccer',
    homeTeam: 'Manchester United',
    awayTeam: 'Liverpool',
    startTime: '2025-01-16T15:00:00Z',
    odds: { home: +150, away: +180, draw: +220 },
    status: 'upcoming'
  },
  {
    id: '4',
    sport: 'NHL',
    homeTeam: 'Toronto Maple Leafs',
    awayTeam: 'Montreal Canadiens',
    startTime: '2025-01-15T19:00:00Z',
    odds: { home: -125, away: +115 },
    status: 'live'
  }
];

router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Young Meat LLC Sportsbook',
    totalGames: sampleGames.length,
    sports: ['NFL', 'NBA', 'NHL', 'Soccer']
  });
});

router.get('/games', (req: Request, res: Response) => {
  const { sport, status } = req.query;
  
  let filteredGames = sampleGames;
  
  if (sport) {
    filteredGames = filteredGames.filter(game => 
      game.sport.toLowerCase() === (sport as string).toLowerCase()
    );
  }
  
  if (status) {
    filteredGames = filteredGames.filter(game => 
      game.status === status
    );
  }
  
  res.json({
    games: filteredGames,
    count: filteredGames.length
  });
});

router.get('/games/:id', (req: Request, res: Response) => {
  const game = sampleGames.find(g => g.id === req.params.id);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  res.json(game);
});

router.post('/bet', (req: Request, res: Response) => {
  const { gameId, team, amount } = req.body;
  
  const game = sampleGames.find(g => g.id === gameId);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount' });
  }
  
  res.json({
    message: 'Bet placed successfully',
    betId: `BET-${Date.now()}`,
    gameId,
    team,
    amount,
    potentialWin: amount * 1.9,
    timestamp: new Date().toISOString()
  });
});

export default router;
