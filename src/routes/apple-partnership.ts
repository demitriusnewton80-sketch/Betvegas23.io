import express, { Request, Response } from 'express';
import { applePartnershipService } from '../services/ApplePartnershipService.js';
import { remoteStreamingControlCore } from '../core/RemoteStreamingControlCore.js';

const router = express.Router();

// Get Apple partnership status
router.get('/status', (req: Request, res: Response) => {
  const status = applePartnershipService.getStatus();

  res.json({
    success: true,
    ...status,
    timestamp: new Date().toISOString()
  });
});

// Pull partnership data from AWS GitHub
router.post('/pull-from-github', async (req: Request, res: Response) => {
  const { userId, repository, contentPath } = req.body;

  if (!userId || !repository || !contentPath) {
    return res.status(400).json({
      success: false,
      error: 'userId, repository, and contentPath are required'
    });
  }

  const result = await applePartnershipService.pullFromGitHub(userId, repository, contentPath);

  if (!result.success) {
    return res.status(500).json(result);
  }

  res.json({
    success: true,
    message: 'Successfully pulled Apple partnership from GitHub',
    content: result.content,
    fccEntity: '20130314143016'
  });
});

// Test partnership endpoints
router.post('/test-endpoints/:partnershipId', async (req: Request, res: Response) => {
  const { partnershipId } = req.params;

  const result = await applePartnershipService.testPartnershipEndpoints(partnershipId);

  res.json({
    success: result.success,
    partnershipId,
    endpointTests: result.results,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Load partnership into remote control system
router.post('/load-to-remote/:partnershipId', async (req: Request, res: Response) => {
  const { partnershipId } = req.params;

  try {
    // Get partnership data
    const partnership = applePartnershipService.getPartnershipForRemote(partnershipId);

    if (!partnership) {
      return res.status(404).json({
        success: false,
        error: 'Partnership not found'
      });
    }

    // Create streaming tunnel for Apple content
    const tunnelId = remoteStreamingControlCore.createStreamingTunnel(
      5000,
      6000,
      'fcc-sports-live'
    );

    // Sync to remote control
    const syncResult = applePartnershipService.syncToRemoteControl(partnershipId);

    res.json({
      success: true,
      message: 'Apple partnership loaded to remote control system',
      partnershipId,
      tunnelId,
      remoteEndpoint: syncResult.remoteEndpoint,
      partnership: {
        type: partnership.partnershipType,
        status: partnership.status,
        endpoints: partnership.endpoints
      },
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load to remote control'
    });
  }
});

// Get all partnerships
router.get('/partnerships', (req: Request, res: Response) => {
  const partnerships = applePartnershipService.getAllPartnerships();

  res.json({
    success: true,
    partnerships,
    count: partnerships.length,
    fccEntity: '20130314143016'
  });
});

// Get specific partnership
router.get('/partnerships/:partnershipId', (req: Request, res: Response) => {
  const { partnershipId } = req.params;
  const partnership = applePartnershipService.getPartnershipForRemote(partnershipId);

  if (!partnership) {
    return res.status(404).json({
      success: false,
      error: 'Partnership not found'
    });
  }

  res.json({
    success: true,
    partnership,
    fccEntity: '20130314143016'
  });
});

// Get GitHub content
router.get('/github-content/:repository', (req: Request, res: Response) => {
  const repository = decodeURIComponent(req.params.repository);
  const content = applePartnershipService.getGitHubContent(repository);

  if (!content) {
    return res.status(404).json({
      success: false,
      error: 'GitHub content not found'
    });
  }

  res.json({
    success: true,
    content,
    fccEntity: '20130314143016'
  });
});

export default router;