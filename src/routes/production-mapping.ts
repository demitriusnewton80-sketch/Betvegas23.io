
import express, { Request, Response } from 'express';
import { productionMappingCore } from '../core/ProductionMappingCore.js';

const router = express.Router();

// Get production mapping status
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = productionMappingCore.getStatus();

    res.json({
      success: true,
      ...status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed'
    });
  }
});

// Fuse all productions to entity
router.post('/fuse', async (req: Request, res: Response) => {
  try {
    const result = await productionMappingCore.fuseAllProductionsToEntity();

    res.json({
      success: true,
      ...result,
      message: 'All productions fused successfully',
      entity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Fusion failed'
    });
  }
});

// Get all production mappings
router.get('/mappings', (req: Request, res: Response) => {
  try {
    const mappings = productionMappingCore.getAllMappings();

    res.json({
      success: true,
      mappings,
      total: mappings.length,
      entity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get mappings'
    });
  }
});

// Get all functional landscapes
router.get('/landscapes', (req: Request, res: Response) => {
  try {
    const landscapes = productionMappingCore.getAllLandscapes();

    res.json({
      success: true,
      landscapes,
      total: landscapes.length,
      entity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get landscapes'
    });
  }
});

// Get environment conditions
router.get('/conditions', (req: Request, res: Response) => {
  try {
    const conditions = productionMappingCore.getAllConditions();

    res.json({
      success: true,
      conditions,
      total: conditions.length,
      entity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get conditions'
    });
  }
});

// Real-time sync updates (SSE)
router.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const sendUpdate = () => {
    const status = productionMappingCore.getStatus();
    res.write(`data: ${JSON.stringify({
      type: 'status_update',
      timestamp: Date.now(),
      status,
      entity: '20130314143016'
    })}\n\n`);
  };

  const interval = setInterval(sendUpdate, 2000);
  sendUpdate();

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

export default router;
