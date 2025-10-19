
import express, { Request, Response } from 'express';
import { serviceContainer } from '../core/ServiceContainer.js';
import { appCore } from '../core/AppCore.js';

const router = express.Router();

// Microsoft-style health endpoint
router.get('/health', async (req: Request, res: Response) => {
  const health = await serviceContainer.healthCheck();
  const coreStatus = appCore.getConnectionStatus();
  
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    fccEntity: '20130314143016',
    fccRegistration: '0024454324',
    architecture: 'Microsoft Enterprise Pattern',
    services: {
      total: serviceContainer.getServices().length,
      registered: Array.from(health.entries()).map(([name, healthy]) => ({
        name,
        status: healthy ? 'healthy' : 'unhealthy'
      }))
    },
    core: {
      connections: coreStatus.total,
      active: coreStatus.active,
      healthPercentage: Math.round((coreStatus.active / coreStatus.total) * 100)
    },
    environment: {
      node: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    }
  };

  res.json(healthData);
});

// Service container status
router.get('/services', async (req: Request, res: Response) => {
  const services = serviceContainer.getServices();
  const health = await serviceContainer.healthCheck();

  res.json({
    totalServices: services.length,
    services: services.map(name => ({
      name,
      healthy: health.get(name) ?? false
    })),
    architecture: 'Microsoft Dependency Injection',
    fccEntity: '20130314143016'
  });
});

// Core connections status
router.get('/core/connections', (req: Request, res: Response) => {
  const status = appCore.getConnectionStatus();
  
  res.json({
    ...status,
    architecture: 'Microsoft Enterprise Pattern',
    fccEntity: '20130314143016',
    fccRegistration: '0024454324'
  });
});

// Application metrics
router.get('/metrics', (req: Request, res: Response) => {
  const coreStatus = appCore.getConnectionStatus();
  
  res.json({
    timestamp: new Date().toISOString(),
    fccEntity: '20130314143016',
    architecture: 'Microsoft-Style',
    metrics: {
      uptime: Math.floor(process.uptime()),
      connections: coreStatus.active,
      services: serviceContainer.getServices().length,
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      cpu: process.cpuUsage()
    }
  });
});

// Radio station diagnostics
router.get('/radio/diagnostics', async (req: Request, res: Response) => {
  const { sportsRadioService } = await import('../services/SportsRadioService.js');
  const health = sportsRadioService.getMicrosoftHealthStatus();
  const links = sportsRadioService.validateAllLinks();
  
  res.json({
    timestamp: new Date().toISOString(),
    fccEntity: '20130314143016',
    architecture: 'Microsoft Enterprise Pattern',
    radioHealth: health,
    linkValidation: {
      valid: links.valid.length,
      broken: links.broken.length,
      brokenUrls: links.broken
    },
    recommendations: links.broken.length > 0 
      ? ['Fix broken links', 'Consider rollback if issues persist']
      : ['All systems operational']
  });
});

// Fix broken radio links
router.post('/radio/fix-links', async (req: Request, res: Response) => {
  const { sportsRadioService } = await import('../services/SportsRadioService.js');
  
  sportsRadioService.createBackup();
  const links = sportsRadioService.validateAllLinks();
  
  res.json({
    success: true,
    message: 'Radio links validated and backup created',
    fixed: 0,
    broken: links.broken.length,
    backupCreated: true,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Rollback radio configuration
router.post('/radio/rollback', async (req: Request, res: Response) => {
  const { sportsRadioService } = await import('../services/SportsRadioService.js');
  
  const success = sportsRadioService.rollbackStreams();
  
  res.json({
    success,
    message: success 
      ? 'Radio streams rolled back successfully' 
      : 'No backup available',
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

export default router;
