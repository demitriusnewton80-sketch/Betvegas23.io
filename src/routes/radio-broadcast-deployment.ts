
import express, { Request, Response } from 'express';
import { radioBroadcastDeploymentService } from '../services/RadioBroadcastDeploymentService.js';

const router = express.Router();

// Deploy radio to all sportsbooks
router.post('/deploy/all', async (req: Request, res: Response) => {
  try {
    const summary = await radioBroadcastDeploymentService.deployToAllSportsbooks();

    res.json({
      success: true,
      summary,
      message: `Radio broadcast deployed to ${summary.successfulDeployments} sportsbooks`,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Deployment failed'
    });
  }
});

// Deploy radio by league
router.post('/deploy/league/:league', async (req: Request, res: Response) => {
  try {
    const { league } = req.params;
    const summary = await radioBroadcastDeploymentService.deployByLeague(league.toUpperCase());

    res.json({
      success: true,
      league: league.toUpperCase(),
      summary,
      message: `${league.toUpperCase()} radio streams deployed successfully`,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Deployment failed'
    });
  }
});

// Deploy to specific sportsbook
router.post('/deploy/sportsbook/:sportsbookId', async (req: Request, res: Response) => {
  try {
    const { sportsbookId } = req.params;
    const deploymentId = await radioBroadcastDeploymentService.deployToSportsbook(sportsbookId);

    if (!deploymentId) {
      return res.status(400).json({
        success: false,
        error: 'Failed to create deployment'
      });
    }

    res.json({
      success: true,
      deploymentId,
      message: 'Radio broadcast deployed to sportsbook',
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Deployment failed'
    });
  }
});

// Get deployment status
router.get('/status', (req: Request, res: Response) => {
  const status = radioBroadcastDeploymentService.getDeploymentStatus();

  res.json({
    success: true,
    ...status,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Get specific deployment
router.get('/deployment/:deploymentId', (req: Request, res: Response) => {
  const { deploymentId } = req.params;
  const deployment = radioBroadcastDeploymentService.getDeployment(deploymentId);

  if (!deployment) {
    return res.status(404).json({
      success: false,
      error: 'Deployment not found'
    });
  }

  res.json({
    success: true,
    deployment,
    fccEntity: '20130314143016'
  });
});

// Get all deployments
router.get('/deployments', (req: Request, res: Response) => {
  const deployments = radioBroadcastDeploymentService.getAllDeployments();

  res.json({
    success: true,
    deployments,
    total: deployments.length,
    fccEntity: '20130314143016'
  });
});

// Real-time deployment updates (SSE)
router.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const sendUpdate = () => {
    const status = radioBroadcastDeploymentService.getDeploymentStatus();
    res.write(`data: ${JSON.stringify({
      type: 'status_update',
      timestamp: Date.now(),
      status,
      fccEntity: '20130314143016'
    })}\n\n`);
  };

  const interval = setInterval(sendUpdate, 3000);
  sendUpdate();

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

export default router;
