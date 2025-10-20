
import express, { Request, Response } from 'express';
import { bloombergPhoneBridgeService } from '../services/BloombergPhoneBridgeService.js';

const router = express.Router();

// Create Bloomberg session
router.post('/session/create', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, simPort, email } = req.body;

    if (!phoneNumber || !simPort) {
      return res.status(400).json({
        success: false,
        error: 'phoneNumber and simPort are required'
      });
    }

    const session = bloombergPhoneBridgeService.createBloombergSession(
      phoneNumber,
      simPort,
      email
    );

    res.json({
      success: true,
      session,
      message: 'Bloomberg session created with SIM port access',
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create session'
    });
  }
});

// Enable Think or Swim core
router.post('/session/:sessionId/enable-thinkorswim', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const enabled = bloombergPhoneBridgeService.enableThinkOrSwimCore(sessionId);

    res.json({
      success: true,
      sessionId,
      thinkOrSwimEnabled: enabled,
      message: 'Think or Swim core enabled for Bloomberg integration'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enable Think or Swim'
    });
  }
});

// Connect to Bloomberg VPN
router.post('/session/:sessionId/vpn/connect', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const vpnConnection = await bloombergPhoneBridgeService.connectBloombergVPN(sessionId, userId);

    res.json({
      success: true,
      vpnConnection,
      message: 'Connected to Bloomberg VPN',
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'VPN connection failed'
    });
  }
});

// Stream Bloomberg data
router.post('/session/:sessionId/stream', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { dataType } = req.body;

    const streamConfig = bloombergPhoneBridgeService.streamBloombergData(
      sessionId,
      dataType || 'market-data'
    );

    res.json({
      success: true,
      streamConfig,
      message: 'Bloomberg data streaming started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start stream'
    });
  }
});

// Get terminal access
router.get('/session/:sessionId/terminal', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const terminalAccess = bloombergPhoneBridgeService.getTerminalAccess(sessionId);

  if (!terminalAccess) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  res.json({
    success: true,
    ...terminalAccess
  });
});

// Execute Bloomberg command
router.post('/session/:sessionId/command', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({
        success: false,
        error: 'command is required'
      });
    }

    const result = bloombergPhoneBridgeService.executeBloombergCommand(sessionId, command);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Command execution failed'
    });
  }
});

// Get all sessions
router.get('/sessions', (req: Request, res: Response) => {
  const sessions = bloombergPhoneBridgeService.getAllSessions();

  res.json({
    success: true,
    sessions,
    count: sessions.length
  });
});

// Get Think or Swim status
router.get('/thinkorswim/status', (req: Request, res: Response) => {
  const status = bloombergPhoneBridgeService.getThinkOrSwimStatus();

  res.json({
    success: true,
    thinkOrSwim: status,
    fccEntity: '20130314143016'
  });
});

// Get stats
router.get('/stats', (req: Request, res: Response) => {
  const stats = bloombergPhoneBridgeService.getStats();

  res.json({
    success: true,
    stats,
    timestamp: new Date().toISOString()
  });
});

export default router;
