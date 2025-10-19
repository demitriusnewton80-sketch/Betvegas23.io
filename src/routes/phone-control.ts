
import express, { Request, Response } from 'express';
import { phoneControlService } from '../services/PhoneControlService.js';

const router = express.Router();

// Create phone control session
router.post('/session/create', (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!phoneControlService.validatePhoneAccess(email)) {
    return res.status(403).json({
      error: 'Unauthorized email address',
      fccEntity: '20130314143016'
    });
  }

  const session = phoneControlService.createSession(email, phoneNumber);

  res.json({
    success: true,
    session,
    message: 'Betting Zone session created'
  });
});

// Get all network plugins
router.get('/plugins', (req: Request, res: Response) => {
  const plugins = phoneControlService.getAllPlugins();

  res.json({
    plugins,
    hostPlugins: plugins.filter(p => p.host),
    totalPlugins: plugins.length,
    fccEntity: '20130314143016'
  });
});

// Get host plugins (core network)
router.get('/plugins/hosts', (req: Request, res: Response) => {
  const hostPlugins = phoneControlService.getHostPlugins();

  res.json({
    hostPlugins,
    count: hostPlugins.length,
    message: 'Core network host plugins'
  });
});

// Connect user to plugin
router.post('/plugins/:pluginId/connect', (req: Request, res: Response) => {
  const { pluginId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const success = phoneControlService.connectUserToPlugin(userId, pluginId);

  if (success) {
    res.json({
      success: true,
      userId,
      pluginId,
      message: 'User connected to plugin'
    });
  } else {
    res.status(404).json({ error: 'Plugin not found' });
  }
});

// Distribute benefits from betting content
router.post('/benefits/distribute', (req: Request, res: Response) => {
  const { contentId, totalAmount, gameType } = req.body;

  if (!contentId || !totalAmount) {
    return res.status(400).json({ error: 'contentId and totalAmount are required' });
  }

  const distributions = phoneControlService.distributeBenefits(
    contentId,
    totalAmount,
    gameType || 'sports'
  );

  res.json({
    success: true,
    distributions,
    totalDistributed: distributions.length,
    message: 'Benefits distributed to network users'
  });
});

// Get user benefit distributions
router.get('/benefits/user/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;

  const distributions = phoneControlService.getUserDistributions(userId);
  const totalBenefits = distributions.reduce((sum, d) => sum + d.benefitAmount, 0);

  res.json({
    userId,
    distributions,
    totalDistributions: distributions.length,
    totalBenefits,
    fccEntity: '20130314143016'
  });
});

// Send phone control command
router.post('/command', (req: Request, res: Response) => {
  const { sessionId, command, pluginId } = req.body;

  if (!sessionId || !command) {
    return res.status(400).json({ error: 'sessionId and command are required' });
  }

  const result = phoneControlService.sendPhoneCommand(sessionId, command, pluginId);

  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

// Get network statistics
router.get('/stats', (req: Request, res: Response) => {
  const stats = phoneControlService.getNetworkStats();

  res.json({
    ...stats,
    timestamp: new Date().toISOString()
  });
});

// Get network status for phone
router.get('/status', (req: Request, res: Response) => {
  res.json({
    networkStatus: 'online',
    corePluginsActive: phoneControlService.getHostPlugins().every(p => p.status === 'active'),
    bettingZoneEnabled: true,
    distributionSystem: 'active',
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

export default router;
