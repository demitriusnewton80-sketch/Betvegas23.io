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

// Smart output to multiple destinations
router.post('/output', async (req: Request, res: Response) => {
  try {
    const { data, destinations } = req.body;

    if (!data || !destinations || !Array.isArray(destinations)) {
      return res.status(400).json({
        success: false,
        error: 'data and destinations array required'
      });
    }

    const outputs = await smartSystemService.outputToDestinations(data, destinations);

    res.json({
      success: true,
      outputs: Array.from(outputs.entries()).map(([dest, output]) => ({
        destination: dest,
        outputId: output.id,
        status: output.status
      })),
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Output failed'
    });
  }
});

// Connect external sportsbook
router.post('/connect-sportsbook', async (req: Request, res: Response) => {
  try {
    const { sportsbookId, webhookUrl, apiKey } = req.body;

    if (!sportsbookId || !webhookUrl || !apiKey) {
      return res.status(400).json({
        success: false,
        error: 'sportsbookId, webhookUrl, and apiKey required'
      });
    }

    const result = await smartSystemService.connectSportsbook(sportsbookId, webhookUrl, apiKey);

    res.json({
      success: true,
      ...result,
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    });
  }
});

// Get cloud outputs
router.get('/outputs', (req: Request, res: Response) => {
  const outputs = smartSystemService.getCloudOutputs();

  res.json({
    success: true,
    outputs,
    count: outputs.length,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Get connected sportsbooks
router.get('/sportsbooks', (req: Request, res: Response) => {
  const sportsbooks = smartSystemService.getConnectedSportsbooks();

  res.json({
    success: true,
    sportsbooks,
    count: sportsbooks.length,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Get output endpoints
router.get('/endpoints', (req: Request, res: Response) => {
  const endpoints = smartSystemService.getOutputEndpoints();

  res.json({
    success: true,
    endpoints,
    count: endpoints.length,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

export default router;