
import express, { Request, Response } from 'express';

const router = express.Router();

interface Fight {
  id: string;
  type: 'boxing' | 'ufc';
  fighter1: { name: string; record: string };
  fighter2: { name: string; record: string };
  title: string;
  rounds: number;
  venue: string;
  date: string;
  status: 'upcoming' | 'live' | 'completed';
  odds: { fighter1: number; fighter2: number };
}

const fights: Fight[] = [
  {
    id: 'boxing-1',
    type: 'boxing',
    fighter1: { name: 'Tyson Fury', record: '34-0-1' },
    fighter2: { name: 'Oleksandr Usyk', record: '21-0' },
    title: 'Heavyweight Championship',
    rounds: 12,
    venue: 'Las Vegas, NV',
    date: new Date(Date.now() + 86400000 * 7).toISOString(),
    status: 'upcoming',
    odds: { fighter1: -180, fighter2: +150 }
  },
  {
    id: 'ufc-1',
    type: 'ufc',
    fighter1: { name: 'Jon Jones', record: '27-1' },
    fighter2: { name: 'Stipe Miocic', record: '20-4' },
    title: 'UFC Heavyweight Title',
    rounds: 5,
    venue: 'UFC Apex',
    date: new Date(Date.now() + 86400000 * 3).toISOString(),
    status: 'upcoming',
    odds: { fighter1: -200, fighter2: +170 }
  },
  {
    id: 'boxing-2',
    type: 'boxing',
    fighter1: { name: 'Canelo Alvarez', record: '60-2-2' },
    fighter2: { name: 'Jermall Charlo', record: '32-0' },
    title: 'Super Middleweight',
    rounds: 12,
    venue: 'T-Mobile Arena',
    date: new Date(Date.now() + 86400000 * 14).toISOString(),
    status: 'upcoming',
    odds: { fighter1: -250, fighter2: +200 }
  },
  {
    id: 'ufc-2',
    type: 'ufc',
    fighter1: { name: 'Islam Makhachev', record: '25-1' },
    fighter2: { name: 'Charles Oliveira', record: '34-9' },
    title: 'UFC Lightweight Title',
    rounds: 5,
    venue: 'Abu Dhabi',
    date: new Date(Date.now() + 86400000 * 5).toISOString(),
    status: 'upcoming',
    odds: { fighter1: -140, fighter2: +120 }
  }
];

// Get all fights
router.get('/fights', (req: Request, res: Response) => {
  const { type } = req.query;
  
  let filteredFights = fights;
  if (type === 'boxing' || type === 'ufc') {
    filteredFights = fights.filter(f => f.type === type);
  }
  
  res.json({
    success: true,
    fights: filteredFights,
    count: filteredFights.length
  });
});

// Get specific fight
router.get('/fights/:fightId', (req: Request, res: Response) => {
  const { fightId } = req.params;
  const fight = fights.find(f => f.id === fightId);
  
  if (!fight) {
    return res.status(404).json({ success: false, error: 'Fight not found' });
  }
  
  res.json({ success: true, fight });
});

// Place bet
router.post('/bet', (req: Request, res: Response) => {
  const { fightId, fighter, amount, odds } = req.body;
  
  if (!fightId || !fighter || !amount || !odds) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  
  const fight = fights.find(f => f.id === fightId);
  if (!fight) {
    return res.status(404).json({ success: false, error: 'Fight not found' });
  }
  
  const potentialPayout = odds > 0 
    ? amount + (amount * (odds / 100))
    : amount + (amount / (Math.abs(odds) / 100));
  
  const bet = {
    id: `bet-${Date.now()}`,
    fightId,
    fightType: fight.type,
    fighter,
    amount,
    odds,
    potentialPayout,
    status: 'pending',
    placedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: 'Bet placed successfully',
    bet
  });
});

// Get live fights
router.get('/live', (req: Request, res: Response) => {
  const liveFights = fights.filter(f => f.status === 'live');
  res.json({
    success: true,
    fights: liveFights,
    count: liveFights.length
  });
});

export default router;
