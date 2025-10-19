import express, { Request, Response } from 'express';
import { smartSystemService } from '../services/SmartSystemService.js';

const router = express.Router();

// Upload content via phone plugin
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const { userId, contentData, contentType } = req.body;

    if (!userId || !contentData) {
      return res.status(400).json({
        success: false,
        error: 'userId and contentData required'
      });
    }

    const upload = await smartSystemService.uploadContent(
      userId,
      contentData,
      contentType || 'generic'
    );

    res.json({
      success: true,
      upload,
      message: 'Content uploaded and deployed to cloud',
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    });
  }
});

// Get system status
router.get('/status', (req: Request, res: Response) => {
  const status = smartSystemService.getSystemStatus();

  res.json({
    success: true,
    status,
    timestamp: new Date().toISOString()
  });
});

// Get all errors including loading errors
router.get('/errors', (req: Request, res: Response) => {
  const errors = smartSystemService.getErrors();

  res.json({
    success: true,
    errors: Array.from(errors.values()),
    totalErrors: errors.size,
    unresolvedErrors: Array.from(errors.values()).filter(e => !e.resolved).length,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Get loading errors specifically
router.get('/errors/loading', (req: Request, res: Response) => {
  const errors = smartSystemService.getErrors();
  const loadingErrors = Array.from(errors.values()).filter(
    e => e.type === 'loading' || e.source.includes('load') || e.message.toLowerCase().includes('load')
  );

  res.json({
    success: true,
    loadingErrors,
    count: loadingErrors.length,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Get traffic data
router.get('/traffic', (req: Request, res: Response) => {
  const traffic = smartSystemService.getTrafficData();

  res.json({
    success: true,
    traffic,
    count: traffic.length
  });
});

// Get content uploads
router.get('/uploads/:userId?', (req: Request, res: Response) => {
  const { userId } = req.params;
  const uploads = smartSystemService.getContentUploads(userId);

  res.json({
    success: true,
    uploads,
    count: uploads.length
  });
});

// Force error scan and auto-fix
router.post('/fix-errors', (req: Request, res: Response) => {
  smartSystemService.emit('forceScan');

  res.json({
    success: true,
    message: 'Error scan initiated'
  });
});

// Get system health
router.get('/health', (req: Request, res: Response) => {
  const health = smartSystemService.getSystemHealth();

  res.json({
    success: true,
    ...health,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

export default router;