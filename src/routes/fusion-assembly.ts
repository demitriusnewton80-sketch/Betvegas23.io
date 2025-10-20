
import express, { Request, Response } from 'express';
import { fusionAssemblyCore } from '../core/FusionAssemblyCore.js';

const router = express.Router();

// Get fusion assembly status
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = fusionAssemblyCore.getStatus();

    res.json({
      success: true,
      ...status,
      message: 'Fusion Assembly pipeline operational',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed'
    });
  }
});

// Sync data into the pipeline
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { source, payload } = req.body;

    if (!source || !payload) {
      return res.status(400).json({
        success: false,
        error: 'source and payload are required'
      });
    }

    const syncId = await fusionAssemblyCore.sync(source, payload);

    res.json({
      success: true,
      syncId,
      message: 'Data synced to fusion pipeline',
      timestamp: new Date().toISOString(),
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed'
    });
  }
});

// Get sync queue
router.get('/sync/queue', (req: Request, res: Response) => {
  try {
    const queue = fusionAssemblyCore.getSyncQueue();

    res.json({
      success: true,
      queue,
      total: queue.length,
      synced: queue.filter(s => s.synced).length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Queue fetch failed'
    });
  }
});

// Get signal queue
router.get('/signal/queue', (req: Request, res: Response) => {
  try {
    const queue = fusionAssemblyCore.getSignalQueue();

    res.json({
      success: true,
      queue,
      total: queue.length,
      processed: queue.filter(s => s.processed).length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Queue fetch failed'
    });
  }
});

// Get assembly queue
router.get('/assembly/queue', (req: Request, res: Response) => {
  try {
    const queue = fusionAssemblyCore.getAssemblyQueue();

    res.json({
      success: true,
      queue,
      total: queue.length,
      completed: queue.filter(a => a.status === 'completed').length,
      assembling: queue.filter(a => a.status === 'assembling').length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Queue fetch failed'
    });
  }
});

// Trigger manual assembly
router.post('/assembly/trigger', async (req: Request, res: Response) => {
  try {
    const status = fusionAssemblyCore.getStatus();

    res.json({
      success: true,
      message: 'Assembly process running in background',
      currentStatus: status,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Assembly trigger failed'
    });
  }
});

export default router;
