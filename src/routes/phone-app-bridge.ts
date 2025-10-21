
import express, { Request, Response } from 'express';
import { phoneAppBridgeService } from '../services/PhoneAppBridgeService.js';

const router = express.Router();

// Get all connected phone apps
router.get('/apps', (req: Request, res: Response) => {
  try {
    const apps = phoneAppBridgeService.getConnectedApps();
    
    res.json({
      success: true,
      apps,
      total: apps.length,
      background: phoneAppBridgeService.getBackgroundApps().length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get apps'
    });
  }
});

// Get background apps
router.get('/apps/background', (req: Request, res: Response) => {
  try {
    const apps = phoneAppBridgeService.getBackgroundApps();
    
    res.json({
      success: true,
      apps,
      count: apps.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get background apps'
    });
  }
});

// Get Vibe Studio sessions
router.get('/vibe-studio/sessions', (req: Request, res: Response) => {
  try {
    const sessions = phoneAppBridgeService.getVibeStudioSessions();
    
    res.json({
      success: true,
      sessions,
      count: sessions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get sessions'
    });
  }
});

// Build from Vibe Studio
router.post('/vibe-studio/build', async (req: Request, res: Response) => {
  try {
    const { sessionId, projectName, assets, outputFormat, exportToCloud } = req.body;

    if (!sessionId || !projectName || !assets) {
      return res.status(400).json({
        success: false,
        error: 'sessionId, projectName, and assets are required'
      });
    }

    const result = await phoneAppBridgeService.buildFromVibeStudio(sessionId, {
      projectName,
      assets,
      outputFormat: outputFormat || 'mp3',
      exportToCloud: exportToCloud || false
    });

    res.json({
      success: true,
      build: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Build failed'
    });
  }
});

// Export to Replit
router.post('/vibe-studio/export', async (req: Request, res: Response) => {
  try {
    const { sessionId, targetPath } = req.body;

    if (!sessionId || !targetPath) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and targetPath are required'
      });
    }

    const result = await phoneAppBridgeService.exportToReplit(sessionId, targetPath);

    res.json({
      success: true,
      exported: result,
      targetPath
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Export failed'
    });
  }
});

// Disconnect session
router.delete('/vibe-studio/session/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const disconnected = phoneAppBridgeService.disconnect(sessionId);

    res.json({
      success: disconnected,
      message: disconnected ? 'Session disconnected' : 'Session not found'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disconnect'
    });
  }
});

export default router;
