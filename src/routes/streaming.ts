
import express, { Request, Response } from 'express';

const router = express.Router();

// Streaming partners registry
const streamingPartners = [
  { id: 'partner-1', name: 'ESPN Sportsbook', type: 'video', active: true },
  { id: 'partner-2', name: 'Unified Sports Hub', type: 'video', active: true },
  { id: 'partner-3', name: 'Enhanced Sportsbook', type: 'video', active: true },
  { id: 'partner-4', name: 'Mobile Sportsbook Hub', type: 'mobile', active: true },
  { id: 'partner-5', name: 'PS5 Betting', type: 'console', active: false },
  { id: 'partner-6', name: 'Boxing & UFC Hub', type: 'video', active: false }
];

// Get all streaming partners
router.get('/partners', (req: Request, res: Response) => {
  res.json({
    success: true,
    partners: streamingPartners,
    fccEntity: '20130314143016'
  });
});

// Deploy to all partners
router.post('/deploy-all', (req: Request, res: Response) => {
  const deployedCount = streamingPartners.filter(p => p.active).length;
  
  res.json({
    success: true,
    deployedCount,
    message: `Deployed to ${deployedCount} active partners`,
    fccEntity: '20130314143016'
  });
});

// Sync all sportsbooks
router.post('/sync-all', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'All sportsbooks synchronized',
    syncedCount: streamingPartners.length,
    fccEntity: '20130314143016'
  });
});

export default router;
