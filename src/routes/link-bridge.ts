
import express, { Request, Response } from 'express';
import { linkBridgeService } from '../services/LinkBridgeService.js';

const router = express.Router();

// Get all route mappings
router.get('/routes', (req: Request, res: Response) => {
  const routes = linkBridgeService.getAllRouteMappings();
  
  res.json({
    success: true,
    routes,
    count: routes.length,
    fccEntity: '20130314143016'
  });
});

// Validate all routes
router.get('/validate', (req: Request, res: Response) => {
  const validation = linkBridgeService.validateRoutes();
  
  res.json({
    success: true,
    validation,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Get broken links
router.get('/broken-links', (req: Request, res: Response) => {
  const brokenLinks = linkBridgeService.getBrokenLinks();
  
  res.json({
    success: true,
    brokenLinks,
    count: brokenLinks.length,
    fccEntity: '20130314143016'
  });
});

// Health check for link bridge
router.get('/health', (req: Request, res: Response) => {
  const health = linkBridgeService.healthCheck();
  
  res.json({
    success: true,
    health,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Report a broken link
router.post('/report-broken', (req: Request, res: Response) => {
  const { link } = req.body;
  
  if (!link) {
    return res.status(400).json({ error: 'Link is required' });
  }
  
  linkBridgeService.reportBrokenLink(link);
  
  res.json({
    success: true,
    message: 'Broken link reported',
    link,
    fccEntity: '20130314143016'
  });
});

export default router;
