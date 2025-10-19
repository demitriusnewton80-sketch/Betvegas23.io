
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

export default router;
