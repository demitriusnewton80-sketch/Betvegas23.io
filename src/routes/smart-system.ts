
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

// Get error logs
router.get('/errors', (req: Request, res: Response) => {
  const errors = smartSystemService.getErrorLogs();
  
  res.json({
    success: true,
    errors,
    count: errors.length,
    fccEntity: '20130314143016'
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

export default router;
