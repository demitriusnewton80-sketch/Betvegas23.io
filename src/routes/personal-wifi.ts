
import express, { Request, Response } from 'express';
import { personalWiFiService } from '../services/PersonalWiFiService.js';

const router = express.Router();

// Get WiFi status
router.get('/status', (req: Request, res: Response) => {
  try {
    const stats = personalWiFiService.getStats();

    res.json({
      success: true,
      status: 'operational',
      stats,
      fccEntity: '20130314143016',
      fccCompliant: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed'
    });
  }
});

// Connect to WiFi network
router.post('/connect', (req: Request, res: Response) => {
  try {
    const { email, phoneNumber, networkId } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const user = personalWiFiService.connectUser(email, phoneNumber, networkId);

    res.json({
      success: true,
      message: 'Connected to WiFi network',
      user: {
        userId: user.userId,
        email: user.email,
        ssid: user.ssid,
        password: user.password,
        ipAddress: user.ipAddress,
        bandwidth: user.bandwidth,
        signalStrength: user.signalStrength
      },
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    });
  }
});

// Create personal WiFi
router.post('/create-personal', (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const wifiInfo = personalWiFiService.createPersonalWiFi(email, phoneNumber);

    res.json({
      success: true,
      message: 'Personal WiFi network created',
      wifi: wifiInfo,
      instructions: {
        step1: 'Connect your device to WiFi',
        step2: `Search for network: ${wifiInfo.ssid}`,
        step3: `Enter password: ${wifiInfo.password}`,
        step4: 'You are now connected to your personal WiFi'
      },
      fccEntity: '20130314143016',
      fccCompliant: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create personal WiFi'
    });
  }
});

// Disconnect from WiFi
router.post('/disconnect/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const success = personalWiFiService.disconnectUser(userId);

    res.json({
      success,
      message: success ? 'Disconnected from WiFi' : 'User not found',
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

// Get user WiFi info
router.get('/user/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = personalWiFiService.getUserWiFi(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        userId: user.userId,
        email: user.email,
        ssid: user.ssid,
        ipAddress: user.ipAddress,
        bandwidth: user.bandwidth,
        signalStrength: user.signalStrength,
        dataUsed: user.dataUsed,
        status: user.status,
        connectedAt: user.connectedAt
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lookup failed'
    });
  }
});

// Get all networks
router.get('/networks', (req: Request, res: Response) => {
  try {
    const networks = personalWiFiService.getAllNetworks();

    res.json({
      success: true,
      networks: networks.map(n => ({
        id: n.id,
        name: n.name,
        ssid: n.ssid,
        frequency: n.frequency,
        security: n.security,
        currentUsers: n.currentUsers,
        maxUsers: n.maxUsers,
        utilization: Math.round((n.currentUsers / n.maxUsers) * 100),
        fccCompliant: n.fccCompliant
      })),
      count: networks.length,
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get networks'
    });
  }
});

// Get connected users
router.get('/users', (req: Request, res: Response) => {
  try {
    const users = personalWiFiService.getConnectedUsers();

    res.json({
      success: true,
      users: users.map(u => ({
        userId: u.userId,
        email: u.email,
        ssid: u.ssid,
        ipAddress: u.ipAddress,
        signalStrength: u.signalStrength,
        dataUsed: u.dataUsed,
        connectedAt: u.connectedAt
      })),
      count: users.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get users'
    });
  }
});

export default router;
