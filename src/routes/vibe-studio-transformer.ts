
import express, { Request, Response } from 'express';
import { vibeStudioTransformerService } from '../services/VibeStudioTransformerService.js';

const router = express.Router();

// Get status
router.get('/status', (req: Request, res: Response) => {
  const status = vibeStudioTransformerService.getStatus();
  res.json(status);
});

// Connect Vibe Studio session
router.post('/connect', async (req: Request, res: Response) => {
  try {
    const { userId, vibeStudioId, projectName } = req.body;

    if (!userId || !vibeStudioId) {
      return res.status(400).json({
        success: false,
        error: 'userId and vibeStudioId are required'
      });
    }

    const sessionId = await vibeStudioTransformerService.connectVibeStudioSession(
      userId,
      vibeStudioId,
      projectName || 'Untitled Project'
    );

    res.json({
      success: true,
      sessionId,
      message: 'Vibe Studio session connected',
      timestamp: new Date().toISOString(),
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    });
  }
});

// Import content from URL
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { sessionId, sourceUrl, contentData } = req.body;

    if (!sessionId || !sourceUrl) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and sourceUrl are required'
      });
    }

    const contentId = await vibeStudioTransformerService.importContentFromURL(
      sessionId,
      sourceUrl,
      contentData
    );

    res.json({
      success: true,
      contentId,
      message: 'Content imported and delivered to core',
      timestamp: new Date().toISOString(),
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Import failed'
    });
  }
});

// Get core context
router.get('/core-context', (req: Request, res: Response) => {
  const context = vibeStudioTransformerService.getCoreContext();
  res.json({
    success: true,
    context,
    timestamp: new Date().toISOString(),
    fccEntity: '20130314143016'
  });
});

// Get sessions
router.get('/sessions', (req: Request, res: Response) => {
  const sessions = vibeStudioTransformerService.getSessions();
  res.json({
    success: true,
    sessions,
    count: sessions.length
  });
});

// Get session by ID
router.get('/sessions/:id', (req: Request, res: Response) => {
  const session = vibeStudioTransformerService.getSession(req.params.id);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }
  
  res.json({
    success: true,
    session
  });
});

// Get all content
router.get('/content', (req: Request, res: Response) => {
  const content = vibeStudioTransformerService.getAllContent();
  res.json({
    success: true,
    content,
    count: content.length
  });
});

// Disconnect session
router.delete('/sessions/:id', async (req: Request, res: Response) => {
  try {
    await vibeStudioTransformerService.disconnectSession(req.params.id);
    res.json({
      success: true,
      message: 'Session disconnected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect session'
    });
  }
});

export default router;
