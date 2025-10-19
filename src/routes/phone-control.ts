
import express, { Request, Response } from 'express';
import { phoneControlService } from '../services/PhoneControlService.js';
import { ssoService } from '../services/SSOService.js';

const router = express.Router();

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: Function) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const user = ssoService.validateSession(sessionId);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  
  (req as any).user = user;
  next();
};

// Create phone control session with WiFi core integration
router.post('/session/create', (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }

    const session = phoneControlService.createSession(email, phoneNumber);

    res.json({
      success: true,
      session,
      message: 'Phone control session created with WiFi core access',
      wifiCore: {
        status: 'connected',
        plugins: session.activePlugins,
        networkStrength: 100
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create session'
    });
  }
});

// Get all active plugins
router.get('/plugins', (req: Request, res: Response) => {
  try {
    const plugins = phoneControlService.getAllPlugins();
    
    res.json({
      success: true,
      plugins,
      total: plugins.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get plugins'
    });
  }
});

// Execute network command
router.post('/command', (req: Request, res: Response) => {
  try {
    const { sessionId, command } = req.body;

    if (!sessionId || !command) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and command are required'
      });
    }

    const result = phoneControlService.executeCommand(sessionId, command);

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Command execution failed'
    });
  }
});

// Get network statistics
router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = phoneControlService.getNetworkStats();
    
    res.json({
      success: true,
      ...stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats'
    });
  }
});

// Connect user to specific plugin
router.post('/plugin/connect', (req: Request, res: Response) => {
  try {
    const { userId, pluginId } = req.body;

    if (!userId || !pluginId) {
      return res.status(400).json({
        success: false,
        error: 'userId and pluginId are required'
      });
    }

    const result = phoneControlService.connectUserToPlugin(userId, pluginId);

    res.json({
      success: true,
      connected: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    });
  }
});

// Enable distribution for plugin
router.post('/plugin/:pluginId/distribution', (req: Request, res: Response) => {
  try {
    const { pluginId } = req.params;
    const { enabled } = req.body;

    const result = phoneControlService.setDistribution(pluginId, enabled);

    res.json({
      success: true,
      pluginId,
      distributionEnabled: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update distribution'
    });
  }
});

export default router;
