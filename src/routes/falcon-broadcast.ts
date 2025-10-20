
import express, { Request, Response } from 'express';
import { falconBroadcastEngine } from '../services/FalconBroadcastEngine.js';

const router = express.Router();

// Get engine status
router.get('/status', (req: Request, res: Response) => {
  const status = falconBroadcastEngine.getEngineStatus();

  res.json({
    success: true,
    engine: status,
    message: 'Falcon Broadcast Engine operational',
    fccEntity: '20130314143016'
  });
});

// Ingest report
router.post('/ingest', (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;

    if (!type || !data) {
      return res.status(400).json({
        success: false,
        error: 'type and data are required'
      });
    }

    const reportId = falconBroadcastEngine.ingestReport(type, data);

    res.json({
      success: true,
      reportId,
      message: 'Report ingested and broadcast initiated',
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Ingestion failed'
    });
  }
});

// Build and broadcast report
router.post('/build', async (req: Request, res: Response) => {
  try {
    const { reportType, data } = req.body;

    if (!reportType || !data) {
      return res.status(400).json({
        success: false,
        error: 'reportType and data are required'
      });
    }

    const reportId = await falconBroadcastEngine.buildReport(reportType, data);

    res.json({
      success: true,
      reportId,
      message: 'Report built and broadcasting to core',
      falconSource: 'https://reports.falcon.ag/Report/Welcome.aspx?login=1',
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Build failed'
    });
  }
});

// Get all reports
router.get('/reports', (req: Request, res: Response) => {
  const reports = falconBroadcastEngine.getReports();

  res.json({
    success: true,
    reports,
    totalReports: reports.length,
    fccEntity: '20130314143016'
  });
});

// Get all broadcasts
router.get('/broadcasts', (req: Request, res: Response) => {
  const broadcasts = falconBroadcastEngine.getBroadcasts();

  res.json({
    success: true,
    broadcasts,
    totalBroadcasts: broadcasts.length,
    fccEntity: '20130314143016'
  });
});

// Get specific broadcast
router.get('/broadcasts/:broadcastId', (req: Request, res: Response) => {
  const { broadcastId } = req.params;
  const broadcast = falconBroadcastEngine.getBroadcast(broadcastId);

  if (!broadcast) {
    return res.status(404).json({
      success: false,
      error: 'Broadcast not found'
    });
  }

  res.json({
    success: true,
    broadcast,
    fccEntity: '20130314143016'
  });
});

// Real-time broadcast stream (SSE)
router.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const sendUpdate = () => {
    const status = falconBroadcastEngine.getEngineStatus();
    res.write(`data: ${JSON.stringify({
      type: 'status_update',
      timestamp: Date.now(),
      status,
      fccEntity: '20130314143016'
    })}\n\n`);
  };

  // Listen to broadcast events
  const onBroadcastCompleted = (broadcast: any) => {
    res.write(`data: ${JSON.stringify({
      type: 'broadcast_completed',
      timestamp: Date.now(),
      broadcast,
      fccEntity: '20130314143016'
    })}\n\n`);
  };

  falconBroadcastEngine.on('broadcast:completed', onBroadcastCompleted);

  const interval = setInterval(sendUpdate, 3000);
  sendUpdate();

  req.on('close', () => {
    clearInterval(interval);
    falconBroadcastEngine.off('broadcast:completed', onBroadcastCompleted);
    res.end();
  });
});

export default router;
