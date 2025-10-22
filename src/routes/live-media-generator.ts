
import express, { Request, Response } from 'express';
import { liveMediaGenerator } from '../services/LiveMediaGenerator.js';

const router = express.Router();

// Get generator status
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = liveMediaGenerator.getGeneratorStatus();

    res.json({
      success: true,
      status,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get status'
    });
  }
});

// Get all live events
router.get('/events', (req: Request, res: Response) => {
  try {
    const events = liveMediaGenerator.getLiveEvents();

    res.json({
      success: true,
      events,
      count: events.length,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get events'
    });
  }
});

// Create a new live event
router.post('/events/create', (req: Request, res: Response) => {
  try {
    const { sport, homeTeam, awayTeam } = req.body;

    if (!sport || !homeTeam || !awayTeam) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sport, homeTeam, awayTeam'
      });
    }

    const eventId = liveMediaGenerator.createLiveEvent(sport, homeTeam, awayTeam);

    res.json({
      success: true,
      eventId,
      message: `Live event created: ${homeTeam} vs ${awayTeam}`,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create event'
    });
  }
});

// Get broadcast outputs for an event
router.get('/events/:eventId/outputs', (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const outputs = liveMediaGenerator.getBroadcastOutputs(eventId);

    res.json({
      success: true,
      eventId,
      outputs,
      count: outputs.length,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get outputs'
    });
  }
});

// End a live event
router.post('/events/:eventId/end', (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    liveMediaGenerator.endEvent(eventId);

    res.json({
      success: true,
      message: 'Event ended successfully',
      eventId,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to end event'
    });
  }
});

// Live media stream (SSE)
router.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const sendUpdate = () => {
    const status = liveMediaGenerator.getGeneratorStatus();
    res.write(`data: ${JSON.stringify({
      type: 'status_update',
      timestamp: Date.now(),
      status,
      fccEntity: '20130314143016'
    })}\n\n`);
  };

  const onMediaGenerated = (mediaPacket: any) => {
    res.write(`data: ${JSON.stringify({
      type: 'media_generated',
      timestamp: Date.now(),
      mediaPacket,
      fccEntity: '20130314143016'
    })}\n\n`);
  };

  const onBroadcastSent = (broadcast: any) => {
    res.write(`data: ${JSON.stringify({
      type: 'broadcast_sent',
      timestamp: Date.now(),
      broadcast,
      fccEntity: '20130314143016'
    })}\n\n`);
  };

  liveMediaGenerator.on('media:generated', onMediaGenerated);
  liveMediaGenerator.on('broadcast:sent', onBroadcastSent);

  const interval = setInterval(sendUpdate, 3000);
  sendUpdate();

  req.on('close', () => {
    clearInterval(interval);
    liveMediaGenerator.off('media:generated', onMediaGenerated);
    liveMediaGenerator.off('broadcast:sent', onBroadcastSent);
    res.end();
  });
});

export default router;
