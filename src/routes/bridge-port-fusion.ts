
import express, { Request, Response } from 'express';
import { bridgePortFusionCore } from '../core/BridgePortFusionCore.js';

const router = express.Router();

// Get fusion status
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = bridgePortFusionCore.getStatus();

    res.json({
      success: true,
      ...status,
      message: 'Bridge-Port Fusion operational',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed'
    });
  }
});

// Create bridge-port mapping
router.post('/map', async (req: Request, res: Response) => {
  try {
    const { bridgeCommand, portNumber, deploymentCommand } = req.body;

    if (!bridgeCommand || !portNumber || !deploymentCommand) {
      return res.status(400).json({
        success: false,
        error: 'bridgeCommand, portNumber, and deploymentCommand are required'
      });
    }

    const mappingId = await bridgePortFusionCore.mapBridgeToPort(
      bridgeCommand,
      parseInt(portNumber),
      deploymentCommand
    );

    res.json({
      success: true,
      mappingId,
      message: 'Bridge-Port mapping created successfully',
      timestamp: new Date().toISOString(),
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Mapping creation failed'
    });
  }
});

// Create core position
router.post('/position', async (req: Request, res: Response) => {
  try {
    const { type, metadata } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'type is required'
      });
    }

    const positionId = await bridgePortFusionCore.createCorePosition(type, metadata || {});

    res.json({
      success: true,
      positionId,
      message: 'Core position created successfully',
      timestamp: new Date().toISOString(),
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Position creation failed'
    });
  }
});

// Build Think or Swim position
router.post('/think-or-swim', async (req: Request, res: Response) => {
  try {
    const { strategy, parameters } = req.body;

    if (!strategy) {
      return res.status(400).json({
        success: false,
        error: 'strategy is required'
      });
    }

    const positionId = await bridgePortFusionCore.buildThinkOrSwimPosition(
      strategy,
      parameters || {}
    );

    res.json({
      success: true,
      positionId,
      strategy,
      message: 'Think or Swim position built successfully',
      timestamp: new Date().toISOString(),
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Position build failed'
    });
  }
});

// Get all mappings
router.get('/mappings', (req: Request, res: Response) => {
  try {
    const mappings = bridgePortFusionCore.getAllMappings();

    res.json({
      success: true,
      mappings,
      total: mappings.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Mappings fetch failed'
    });
  }
});

// Get all core positions
router.get('/positions', (req: Request, res: Response) => {
  try {
    const positions = bridgePortFusionCore.getAllPositions();

    res.json({
      success: true,
      positions,
      total: positions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Positions fetch failed'
    });
  }
});

// Get all deployment controls
router.get('/controls', (req: Request, res: Response) => {
  try {
    const controls = bridgePortFusionCore.getAllControls();

    res.json({
      success: true,
      controls,
      total: controls.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Controls fetch failed'
    });
  }
});

export default router;
