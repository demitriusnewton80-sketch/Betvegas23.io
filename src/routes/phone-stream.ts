
import express, { Request, Response } from 'express';
import { phoneStreamSyncService } from '../services/PhoneStreamSyncService.js';
import { espnTrackerService } from '../services/ESPNSportsTrackerService.js';

const router = express.Router();

// Subscribe phone to sports stream
router.post('/subscribe', (req: Request, res: Response) => {
  const { phoneId, phoneNumber, sports, teams, notificationPreferences, signalConnected } = req.body;

  if (!phoneId || !phoneNumber) {
    return res.status(400).json({
      success: false,
      error: 'phoneId and phoneNumber are required'
    });
  }

  const subscription = {
    phoneId,
    phoneNumber,
    sports: sports || [],
    teams: teams || [],
    notificationPreferences: notificationPreferences || {
      scoreUpdates: true,
      gameStart: true,
      gameEnd: true,
      breakingNews: true
    },
    signalConnected: signalConnected || false,
    lastSync: new Date().toISOString()
  };

  const success = phoneStreamSyncService.subscribePhone(subscription);

  res.json({
    success,
    subscription,
    message: 'Phone subscribed to sports stream',
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Unsubscribe phone
router.post('/unsubscribe/:phoneId', (req: Request, res: Response) => {
  const { phoneId } = req.params;
  const success = phoneStreamSyncService.unsubscribePhone(phoneId);

  res.json({
    success,
    message: success ? 'Phone unsubscribed' : 'Phone not found',
    timestamp: new Date().toISOString()
  });
});

// Get subscription status
router.get('/subscription/:phoneId', (req: Request, res: Response) => {
  const { phoneId } = req.params;
  const subscription = phoneStreamSyncService.getSubscription(phoneId);

  if (!subscription) {
    return res.status(404).json({
      success: false,
      error: 'Subscription not found'
    });
  }

  res.json({
    success: true,
    subscription,
    timestamp: new Date().toISOString()
  });
});

// Get all subscriptions
router.get('/subscriptions', (req: Request, res: Response) => {
  const subscriptions = phoneStreamSyncService.getAllSubscriptions();

  res.json({
    success: true,
    subscriptions,
    count: subscriptions.length,
    signalConnections: Array.from(phoneStreamSyncService.getSignalConnections().entries()),
    timestamp: new Date().toISOString()
  });
});

// SSE stream endpoint for real-time updates
router.get('/stream/:phoneId', (req: Request, res: Response) => {
  const { phoneId } = req.params;
  const subscription = phoneStreamSyncService.getSubscription(phoneId);

  if (!subscription) {
    return res.status(404).json({
      success: false,
      error: 'Phone not subscribed'
    });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Send initial connection message
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    phoneId,
    subscription,
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Listen for updates
  const updateHandler = (data: any) => {
    if (data.phoneId === phoneId) {
      res.write(`data: ${JSON.stringify({
        type: 'updates',
        updates: data.updates,
        timestamp: data.timestamp
      })}\n\n`);
    }
  };

  const signalHandler = (data: any) => {
    if (data.phoneNumber === subscription.phoneNumber) {
      res.write(`data: ${JSON.stringify({
        type: 'signal_sync',
        message: data.message,
        updateCount: data.updateCount,
        timestamp: data.timestamp
      })}\n\n`);
    }
  };

  phoneStreamSyncService.on('phoneUpdate', updateHandler);
  phoneStreamSyncService.on('signalSync', signalHandler);

  // Send periodic heartbeat
  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({
      type: 'heartbeat',
      timestamp: new Date().toISOString()
    })}\n\n`);
  }, 30000);

  req.on('close', () => {
    phoneStreamSyncService.off('phoneUpdate', updateHandler);
    phoneStreamSyncService.off('signalSync', signalHandler);
    clearInterval(heartbeat);
    res.end();
  });
});

// Get current live games (for phone display)
router.get('/live-games', (req: Request, res: Response) => {
  const liveGames = espnTrackerService.getCurrentLiveGames();
  const upcomingGames = espnTrackerService.getUpcomingGames(5);

  res.json({
    success: true,
    liveGames,
    upcomingGames,
    count: liveGames.length,
    timestamp: new Date().toISOString()
  });
});

// Manual trigger sync to Signal
router.post('/sync-signal/:phoneId', (req: Request, res: Response) => {
  const { phoneId } = req.params;
  const subscription = phoneStreamSyncService.getSubscription(phoneId);

  if (!subscription) {
    return res.status(404).json({
      success: false,
      error: 'Phone not subscribed'
    });
  }

  const queuedUpdates = phoneStreamSyncService.getQueuedUpdates();

  res.json({
    success: true,
    message: 'Signal sync triggered',
    phoneNumber: subscription.phoneNumber,
    queuedUpdates: queuedUpdates.length,
    signalConnected: subscription.signalConnected,
    timestamp: new Date().toISOString()
  });
});

export default router;
