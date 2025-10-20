
import express, { Request, Response } from 'express';
import { wiFiWeb3FusionService } from '../services/WiFiWeb3FusionService.js';

const router = express.Router();

// Get fusion status
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = wiFiWeb3FusionService.getFusionStatus();

    res.json({
      success: true,
      ...status,
      message: 'WiFi-Web3 Fusion Bridge operational',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed'
    });
  }
});

// Create fusion connection
router.post('/connect', async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber, walletAddress } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const connection = await wiFiWeb3FusionService.createFusionConnection(
      email,
      phoneNumber,
      walletAddress
    );

    res.json({
      success: true,
      message: 'Fusion connection established',
      connection,
      security: {
        wpa3: true,
        web3: !!walletAddress,
        encrypted: true
      },
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    });
  }
});

// Send signal through fusion bridge
router.post('/signal', async (req: Request, res: Response) => {
  try {
    const { source, destination, data, wpa3Secured } = req.body;

    if (!source || !destination || !data) {
      return res.status(400).json({
        success: false,
        error: 'source, destination, and data are required'
      });
    }

    const signal = await wiFiWeb3FusionService.sendSignal({
      source,
      destination,
      data,
      wpa3Secured
    });

    res.json({
      success: true,
      message: 'Signal sent through fusion bridge',
      signal,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Signal failed'
    });
  }
});

// Get fusion connection
router.get('/connection/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const connection = wiFiWeb3FusionService.getFusionConnection(userId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      });
    }

    res.json({
      success: true,
      connection,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lookup failed'
    });
  }
});

// Get all fusion connections
router.get('/connections', (req: Request, res: Response) => {
  try {
    const connections = wiFiWeb3FusionService.getAllFusionConnections();

    res.json({
      success: true,
      connections,
      count: connections.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get connections'
    });
  }
});

// Disconnect fusion
router.post('/disconnect/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const success = wiFiWeb3FusionService.disconnectFusion(userId);

    res.json({
      success,
      message: success ? 'Fusion disconnected' : 'Connection not found',
      userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Disconnect failed'
    });
  }
});

export default router;
