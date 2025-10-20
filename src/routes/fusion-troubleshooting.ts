
import express, { Request, Response } from 'express';
import { microsoftGoogleFusionCore } from '../core/MicrosoftGoogleFusionCore.js';
import { smartTroubleshootingCore } from '../core/SmartTroubleshootingCore.js';
import { streamingService } from '../services/StreamingService.js';

const router = express.Router();

// Get fusion status
router.get('/status', (req: Request, res: Response) => {
  const fusionStatus = microsoftGoogleFusionCore.getFusionStatus();
  const troubleStatus = smartTroubleshootingCore.getStatus();
  
  res.json({
    success: true,
    fusion: fusionStatus,
    troubleshooting: troubleStatus,
    systemControlsComplete: troubleStatus.autoFixEnabled && fusionStatus.active,
    fccEntity: '20130314143016'
  });
});

// Get all fusion errors
router.get('/errors', (req: Request, res: Response) => {
  const errors = microsoftGoogleFusionCore.getErrors();
  
  res.json({
    success: true,
    errors,
    totalErrors: errors.length,
    resolvedErrors: errors.filter(e => e.resolved).length,
    fccEntity: '20130314143016'
  });
});

// Get broadcast outputs
router.get('/broadcasts', (req: Request, res: Response) => {
  const broadcasts = microsoftGoogleFusionCore.getBroadcastOutputs();
  const sportsbooks = streamingService.getExternalSportsbooks();
  
  res.json({
    success: true,
    broadcasts: broadcasts.map(b => ({
      ...b,
      sportsbookName: sportsbooks.find(s => s.id === b.sportsbookId)?.name || 'Unknown'
    })),
    totalBroadcasts: broadcasts.length,
    activeBroadcasts: broadcasts.filter(b => b.status === 'broadcasting').length,
    fccEntity: '20130314143016'
  });
});

// Start broadcast to specific sportsbook
router.post('/broadcasts/:sportsbookId/start', (req: Request, res: Response) => {
  const { sportsbookId } = req.params;
  
  microsoftGoogleFusionCore.startBroadcast(sportsbookId);
  
  res.json({
    success: true,
    message: `Broadcast started to sportsbook ${sportsbookId}`,
    fccEntity: '20130314143016'
  });
});

// Stop broadcast to specific sportsbook
router.post('/broadcasts/:sportsbookId/stop', (req: Request, res: Response) => {
  const { sportsbookId } = req.params;
  
  microsoftGoogleFusionCore.stopBroadcast(sportsbookId);
  
  res.json({
    success: true,
    message: `Broadcast stopped to sportsbook ${sportsbookId}`,
    fccEntity: '20130314143016'
  });
});

// Live stream events for page plugin
router.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const sendUpdate = () => {
    const fusionStatus = microsoftGoogleFusionCore.getFusionStatus();
    const broadcasts = microsoftGoogleFusionCore.getBroadcastOutputs();
    
    res.write(`data: ${JSON.stringify({
      type: 'fusion_update',
      timestamp: Date.now(),
      fusion: fusionStatus,
      broadcasts: broadcasts.map(b => ({
        sportsbookId: b.sportsbookId,
        status: b.status,
        viewerCount: b.viewerCount
      })),
      fccEntity: '20130314143016'
    })}\n\n`);
  };

  const interval = setInterval(sendUpdate, 2000);
  sendUpdate();

  req.on('close', () => {
    clearInterval(interval);
  });
});

// Trigger complete system control
router.post('/activate', async (req: Request, res: Response) => {
  try {
    // Enable all troubleshooting
    smartTroubleshootingCore.setAutoFix(true);
    
    // Start all broadcasts
    const broadcasts = microsoftGoogleFusionCore.getBroadcastOutputs();
    broadcasts.forEach(b => {
      microsoftGoogleFusionCore.startBroadcast(b.sportsbookId);
    });
    
    res.json({
      success: true,
      message: 'System controls activated - streaming to all sportsbooks',
      activeBroadcasts: broadcasts.length,
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Activation failed'
    });
  }
});

export default router;
