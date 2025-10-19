
import express, { Request, Response } from 'express';
import { winnerPayoutService } from '../services/WinnerPayoutService.js';

const router = express.Router();

// Connect device to WiFi network
router.post('/device/connect', (req: Request, res: Response) => {
  const { deviceId, userId, wifiStrength, connectionType, location } = req.body;

  if (!deviceId || !userId) {
    return res.status(400).json({ error: 'deviceId and userId are required' });
  }

  const deviceData = {
    deviceId,
    userId,
    ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
    wifiStrength: wifiStrength || 100,
    connectionType: connectionType || 'wifi',
    location,
    connectedAt: new Date().toISOString()
  };

  const success = winnerPayoutService.connectDevice(deviceData);

  res.json({
    success,
    deviceData,
    message: 'Device connected to WiFi plugin network',
    networkPlugins: ['live-sportsbook', 'ps5-betting', 'streaming-hub', 'content-control']
  });
});

// Get device connection data
router.get('/device/:deviceId', (req: Request, res: Response) => {
  const { deviceId } = req.params;
  const deviceData = winnerPayoutService.getDeviceData(deviceId);

  if (!deviceData) {
    return res.status(404).json({ error: 'Device not found' });
  }

  res.json({
    deviceData,
    networkStatus: 'connected'
  });
});

// Record game winner
router.post('/winner/record', (req: Request, res: Response) => {
  const { gameId, userId, betId, winAmount, gameType, deviceId } = req.body;

  if (!gameId || !userId || !betId || !winAmount || !deviceId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const winner = winnerPayoutService.recordWinner(
      gameId,
      userId,
      betId,
      parseFloat(winAmount),
      gameType || 'sports',
      deviceId
    );

    res.json({
      success: true,
      winner,
      message: 'Winner recorded - eligible for cash payout',
      revivalCashEligible: true
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to record winner'
    });
  }
});

// Process cash payment for winner
router.post('/cashout', (req: Request, res: Response) => {
  const { userId, winnerId, paymentMethod, deviceId } = req.body;

  if (!userId || !winnerId || !paymentMethod || !deviceId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const payment = winnerPayoutService.processCashPayment(
      userId,
      winnerId,
      paymentMethod,
      deviceId
    );

    res.json({
      success: true,
      payment,
      message: 'Cash payment processing',
      estimatedCompletion: '3-5 seconds'
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to process payment'
    });
  }
});

// Process revival cash payment (winner bonus)
router.post('/revival-cash', (req: Request, res: Response) => {
  const { userId, deviceId } = req.body;

  if (!userId || !deviceId) {
    return res.status(400).json({ error: 'userId and deviceId are required' });
  }

  const payment = winnerPayoutService.processRevivalCash(userId, deviceId);

  if (!payment) {
    return res.status(403).json({
      error: 'Not eligible for revival cash',
      reason: 'No winning history found'
    });
  }

  res.json({
    success: true,
    payment,
    message: 'Revival cash bonus processing - 10% of total winnings',
    estimatedCompletion: '3-5 seconds'
  });
});

// Get user's winning history
router.get('/user/:userId/winnings', (req: Request, res: Response) => {
  const { userId } = req.params;
  const winnings = winnerPayoutService.getUserWinnings(userId);
  const totalWinnings = winnings.reduce((sum, w) => sum + w.winAmount, 0);

  res.json({
    userId,
    winnings,
    totalWinnings,
    totalGamesWon: winnings.length,
    revivalCashEligible: winnerPayoutService.isEligibleForRevivalCash(userId)
  });
});

// Get user's payment history
router.get('/user/:userId/payments', (req: Request, res: Response) => {
  const { userId } = req.params;
  const payments = winnerPayoutService.getUserPayments(userId);
  const totalPaid = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

  res.json({
    userId,
    payments,
    totalPayments: payments.length,
    totalPaidOut: totalPaid,
    pendingPayments: payments.filter(p => p.status === 'processing').length
  });
});

// Get all connected devices
router.get('/devices', (req: Request, res: Response) => {
  const devices = winnerPayoutService.getConnectedDevices();

  res.json({
    devices,
    totalDevices: devices.length,
    fccEntity: '20130314143016'
  });
});

// Get network statistics
router.get('/stats', (req: Request, res: Response) => {
  const stats = winnerPayoutService.getNetworkStats();

  res.json({
    ...stats,
    timestamp: new Date().toISOString()
  });
});

export default router;
