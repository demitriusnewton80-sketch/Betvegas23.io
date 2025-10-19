
import express, { Request, Response } from 'express';
import { hybridControlService } from '../services/HybridControlService.js';

const router = express.Router();

// Get complete system status
router.get('/status', (req: Request, res: Response) => {
  const status = hybridControlService.getSystemStatus();
  
  res.json({
    success: true,
    ...status,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Register a new game
router.post('/games/register', async (req: Request, res: Response) => {
  try {
    const { id, name, type, provider, cloudPreference, systemType } = req.body;

    if (!id || !name || !type || !provider) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id, name, type, provider'
      });
    }

    const registered = hybridControlService.registerGame({
      id,
      name,
      type,
      provider,
      cloudPreference: cloudPreference || 'aws',
      systemType: systemType || 'gaming'
    });

    res.json({
      success: registered,
      message: registered ? 'Game registered successfully' : 'Failed to register game',
      gameId: id,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Distribute game across infrastructure
router.post('/games/:gameId/distribute', async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const distribution = await hybridControlService.distributeGame(gameId);

    res.json({
      success: true,
      distribution,
      message: 'Game distributed across hybrid infrastructure',
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Distribution failed'
    });
  }
});

// Fuse control - synchronize all systems
router.post('/fuse', async (req: Request, res: Response) => {
  try {
    const fuseStatus = await hybridControlService.fuseControl();

    res.json({
      success: true,
      ...fuseStatus,
      message: 'Hybrid control fused successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Fuse failed'
    });
  }
});

// Get all power structures
router.get('/power-structures', (req: Request, res: Response) => {
  const structures = hybridControlService.getAllPowerStructures();

  res.json({
    success: true,
    powerStructures: structures,
    count: structures.length,
    fccEntity: '20130314143016'
  });
});

// Get game registry
router.get('/games', (req: Request, res: Response) => {
  const games = hybridControlService.getGameRegistry();

  res.json({
    success: true,
    games,
    count: games.length,
    fccEntity: '20130314143016'
  });
});

export default router;
