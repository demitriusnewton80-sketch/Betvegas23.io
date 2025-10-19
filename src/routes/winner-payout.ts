
import express, { Request, Response } from 'express';
import { winnerPayoutService } from '../services/WinnerPayoutService.js';

const router = express.Router();

// Connect device to WiFi network
router.post('/device/connect', (req: Request, res: Response) => {
  try {
    const { deviceId, userId, wifiStrength, connectionType, location } = req.body;

    if (!deviceId || !userId) {
      return res.status(400).json({ 
        success: false,
        error: 'deviceId and userId are required' 
      });
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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect device'
    });
  }
});

// Get device connection data
router.get('/device/:deviceId', (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const deviceData = winnerPayoutService.getDeviceData(deviceId);

    if (!deviceData) {
      return res.status(404).json({ 
        success: false,
        error: 'Device not found' 
      });
    }

    res.json({
      success: true,
      deviceData,
      networkStatus: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get device data'
    });
  }
});

// Record game winner
router.post('/winner/record', (req: Request, res: Response) => {
  try {
    const { gameId, userId, betId, winAmount, gameType, deviceId } = req.body;

    if (!gameId || !userId || !betId || !winAmount || !deviceId) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }

    const winner = winnerPayoutService.recordWinner(
      gameId,
      userId,
      betId,
      winAmount,
      gameType || 'sports',
      deviceId
    );

    res.json({
      success: true,
      winner,
      message: 'Winner recorded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record winner'
    });
  }
});

// Get user winnings
router.get('/user/:userId/winnings', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const winnings = winnerPayoutService.getUserWinnings(userId);

    res.json({
      success: true,
      winnings,
      totalGamesWon: winnings.length,
      totalWinnings: winnings.reduce((sum, w) => sum + w.winAmount, 0),
      revivalCashEligible: winnings.length >= 3
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get winnings'
    });
  }
});

// Process cash payout
router.post('/cashout', (req: Request, res: Response) => {
  try {
    const { userId, winnerId, paymentMethod, deviceId } = req.body;

    if (!userId || !winnerId || !deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const payment = winnerPayoutService.processCashout(
      userId,
      winnerId,
      paymentMethod || 'direct_deposit',
      deviceId
    );

    res.json({
      success: true,
      payment,
      estimatedCompletion: '2-3 business days',
      message: 'Cash payout processing'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Cashout failed'
    });
  }
});

// Get revival cash bonus
router.post('/revival-cash', (req: Request, res: Response) => {
  try {
    const { userId, deviceId } = req.body;

    if (!userId || !deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const result = winnerPayoutService.processRevivalCash(userId, deviceId);

    if (!result.eligible) {
      return res.json({
        success: false,
        message: result.message || 'Not eligible for revival cash',
        requirement: 'Win 3 games to qualify for revival cash bonus'
      });
    }

    res.json({
      success: true,
      payment: result.payment,
      message: result.message,
      bonusAmount: result.payment?.amount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Revival cash request failed'
    });
  }
});

// Get payout history
router.get('/user/:userId/payouts', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const payouts = winnerPayoutService.getPayoutHistory(userId);

    res.json({
      success: true,
      payouts,
      total: payouts.length,
      totalPaid: payouts
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get payout history'
    });
  }
});

export default router;
