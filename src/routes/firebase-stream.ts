
import express, { Request, Response } from 'express';
import { firebaseStudioBridge } from '../services/FirebaseStudioBridge.js';
import { streamingService } from '../services/StreamingService.js';

const router = express.Router();

// Stream data to Firebase Studio
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { streamId, sport, teams } = req.body;

    // Connect to Firebase Studio
    const connection = await firebaseStudioBridge.connectToStudio(
      'Young Meaat Sportsbook Stream',
      ['live-streaming', 'real-time-betting', 'sports-data']
    );

    // Prepare streaming data
    const streamData = {
      streamId: streamId || `stream-${Date.now()}`,
      sport,
      teams,
      timestamp: Date.now(),
      fccEntity: '20130314143016',
      status: 'active'
    };

    // Sync to Firebase
    const syncResult = await firebaseStudioBridge.syncStreamingData(streamData);

    res.json({
      success: true,
      connection,
      stream: streamData,
      syncResult,
      message: 'Stream connected to Firebase Studio'
    });
  } catch (error) {
    console.error('Firebase stream error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Stream failed'
    });
  }
});

// Get active Firebase streams
router.get('/active', (req: Request, res: Response) => {
  const connections = firebaseStudioBridge.getActiveConnections();
  
  res.json({
    success: true,
    streams: connections,
    count: connections.length,
    studioUrl: 'https://6000-firebase-studio-1761154163858.cluster-4unnw5epovarsrg6rdhhbr2n4s.cloudworkstations.dev'
  });
});

// Stop a Firebase stream
router.post('/stop/:connectionId', (req: Request, res: Response) => {
  const { connectionId } = req.params;
  
  const stopped = firebaseStudioBridge.disconnect(connectionId);
  
  res.json({
    success: stopped,
    message: stopped ? 'Stream stopped' : 'Stream not found'
  });
});

export default router;
