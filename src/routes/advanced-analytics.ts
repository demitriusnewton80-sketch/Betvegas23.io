
import express, { Request, Response } from 'express';
import { advancedAnalyticsService } from '../services/AdvancedAnalyticsService.js';

const router = express.Router();

// Get platform-wide metrics
router.get('/platform', (req: Request, res: Response) => {
  const metrics = advancedAnalyticsService.getPlatformMetrics();
  
  res.json({
    success: true,
    metrics,
    timestamp: new Date().toISOString(),
    fccEntity: '20130314143016'
  });
});

// Get user behavior metrics
router.get('/user/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const metrics = advancedAnalyticsService.getUserMetrics(userId);
  
  if (!metrics) {
    return res.status(404).json({
      success: false,
      error: 'User metrics not found'
    });
  }
  
  res.json({
    success: true,
    metrics,
    fccEntity: '20130314143016'
  });
});

// Generate analytics report
router.get('/report/:type', (req: Request, res: Response) => {
  const { type } = req.params;
  
  if (!['daily', 'weekly', 'monthly'].includes(type)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid report type. Use daily, weekly, or monthly.'
    });
  }
  
  const report = advancedAnalyticsService.generateReport(type as 'daily' | 'weekly' | 'monthly');
  
  res.json({
    success: true,
    report,
    fccEntity: '20130314143016'
  });
});

// Get trend predictions
router.get('/trends', (req: Request, res: Response) => {
  const trends = advancedAnalyticsService.predictTrends();
  
  res.json({
    success: true,
    trends,
    fccEntity: '20130314143016'
  });
});

export default router;
