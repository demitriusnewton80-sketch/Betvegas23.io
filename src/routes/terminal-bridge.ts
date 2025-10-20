
import express, { Request, Response } from 'express';
import { terminalBridgeCore } from '../core/TerminalBridgeCore.js';

const router = express.Router();

// Get bridge status
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = terminalBridgeCore.getStatus();

    res.json({
      success: true,
      ...status,
      message: 'Terminal Bridge operational',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed'
    });
  }
});

// Execute terminal command
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { command, type } = req.body;

    if (!command || !type) {
      return res.status(400).json({
        success: false,
        error: 'command and type are required'
      });
    }

    const output = await terminalBridgeCore.executeCommand(command, type);

    res.json({
      success: true,
      output,
      message: 'Command executed successfully',
      timestamp: new Date().toISOString(),
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Command execution failed'
    });
  }
});

// Analyze content with Amazon sales integration
router.post('/content/analyze', async (req: Request, res: Response) => {
  try {
    const { source, data, amazonSalesData } = req.body;

    if (!source || !data) {
      return res.status(400).json({
        success: false,
        error: 'source and data are required'
      });
    }

    const analysisId = await terminalBridgeCore.analyzeContent(source, data, amazonSalesData);

    res.json({
      success: true,
      analysisId,
      message: 'Content analyzed and synced to database',
      timestamp: new Date().toISOString(),
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Content analysis failed'
    });
  }
});

// Connect Amazon sales to production
router.post('/amazon/connect', async (req: Request, res: Response) => {
  try {
    const { salesData } = req.body;

    if (!salesData) {
      return res.status(400).json({
        success: false,
        error: 'salesData is required'
      });
    }

    await terminalBridgeCore.connectAmazonSalesToProduction(salesData);

    res.json({
      success: true,
      message: 'Amazon sales data connected to production',
      timestamp: new Date().toISOString(),
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Amazon connection failed'
    });
  }
});

// Fuse deployment controls
router.post('/deployment/fuse', async (req: Request, res: Response) => {
  try {
    await terminalBridgeCore.fuseDeploymentControls();

    res.json({
      success: true,
      message: 'Deployment controls fused into core system',
      timestamp: new Date().toISOString(),
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Deployment fusion failed'
    });
  }
});

// Execute deployment
router.post('/deployment/execute', async (req: Request, res: Response) => {
  try {
    const { config } = req.body;

    await terminalBridgeCore.executeDeploymentCommand(config || {});

    res.json({
      success: true,
      message: 'Deployment executed successfully',
      timestamp: new Date().toISOString(),
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Deployment execution failed'
    });
  }
});

// Get command history
router.get('/commands/history', (req: Request, res: Response) => {
  try {
    const history = terminalBridgeCore.getCommandHistory();

    res.json({
      success: true,
      commands: history,
      total: history.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'History fetch failed'
    });
  }
});

// Get content analyses
router.get('/content/analyses', (req: Request, res: Response) => {
  try {
    const analyses = terminalBridgeCore.getContentAnalyses();

    res.json({
      success: true,
      analyses,
      total: analyses.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Analyses fetch failed'
    });
  }
});

export default router;
