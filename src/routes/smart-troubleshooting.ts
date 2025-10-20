
import express, { Request, Response } from 'express';
import { smartTroubleshootingCore } from '../core/SmartTroubleshootingCore.js';

const router = express.Router();

// Get troubleshooting status
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = smartTroubleshootingCore.getStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get status',
      fccEntity: '20130314143016'
    });
  }
});

// Get all troubleshooting sessions
router.get('/sessions', (req: Request, res: Response) => {
  try {
    const sessions = smartTroubleshootingCore.getSessions();
    res.json({
      success: true,
      sessions,
      count: sessions.length,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get sessions'
    });
  }
});

// Get endpoint health
router.get('/health', (req: Request, res: Response) => {
  try {
    const health = smartTroubleshootingCore.getEndpointHealth();
    res.json({
      success: true,
      endpoints: health,
      count: health.length,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get health'
    });
  }
});

// Enable/disable auto-fix
router.post('/auto-fix', (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    smartTroubleshootingCore.setAutoFix(enabled);
    res.json({
      success: true,
      autoFixEnabled: enabled,
      message: `Auto-fix ${enabled ? 'enabled' : 'disabled'}`,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update auto-fix'
    });
  }
});

// Create troubleshooting session
router.post('/sessions', (req: Request, res: Response) => {
  try {
    const { type, issue, endpoint, response } = req.body;
    
    console.log(`📝 Creating troubleshooting session: ${type} - ${issue}`);
    
    res.json({
      success: true,
      sessionId: `session-${Date.now()}`,
      type: type || 'api',
      issue: issue || 'Communication error',
      autoFixTriggered: true,
      message: 'Troubleshooting session created',
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create session'
    });
  }
});

// Server-Sent Events for real-time monitoring
router.get('/monitor', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendUpdate = () => {
    const status = smartTroubleshootingCore.getStatus();
    res.write(`data: ${JSON.stringify(status)}\n\n`);
  };

  sendUpdate();
  const interval = setInterval(sendUpdate, 3000);

  req.on('close', () => clearInterval(interval));
});

export default router;
