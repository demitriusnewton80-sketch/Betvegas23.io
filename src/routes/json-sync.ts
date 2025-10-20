
import express, { Request, Response } from 'express';
import { jsonSyncService } from '../services/JSONSyncService.js';

const router = express.Router();

// Sync JSON data across bridges
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { data, source, destinations } = req.body;

    if (!data || !source) {
      return res.status(400).json({
        success: false,
        error: 'data and source are required'
      });
    }

    const syncId = await jsonSyncService.syncJSON(data, source, destinations);

    res.json({
      success: true,
      syncId,
      message: 'JSON data queued for sync across bridges',
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed'
    });
  }
});

// Get sync status
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = jsonSyncService.getStatus();

    res.json({
      success: true,
      ...status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Status fetch failed'
    });
  }
});

// Get sync queue
router.get('/queue', (req: Request, res: Response) => {
  try {
    const queue = jsonSyncService.getSyncQueue();

    res.json({
      success: true,
      queue,
      total: queue.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Queue fetch failed'
    });
  }
});

// Get bridges
router.get('/bridges', (req: Request, res: Response) => {
  try {
    const bridges = jsonSyncService.getBridges();

    res.json({
      success: true,
      bridges,
      total: bridges.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Bridges fetch failed'
    });
  }
});

export default router;
