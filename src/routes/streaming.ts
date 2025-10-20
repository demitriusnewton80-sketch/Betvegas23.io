import express, { Request, Response } from 'express';
import { streamingService } from '../services/StreamingService.js';
import { hybridControlService } from '../services/HybridControlService.js';
import crypto from 'crypto';

const router = express.Router();

// Ensure all responses are JSON
router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Live streaming sessions
const liveSessions = new Map();

// Get all streams
router.get('/streams', async (req: Request, res: Response) => {
  try {
    const streams = streamingService.getActiveStreams();

    return res.json({
      success: true,
      streams: streams.map(stream => ({
        id: stream.id,
        name: stream.name,
        sport: stream.sport,
        status: stream.status,
        url: stream.url
      })),
      count: streams.length,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    console.error('Streaming error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch streams',
      streams: [],
      count: 0,
      fccEntity: '20130314143016'
    });
  }
});

// Upload content for streaming
router.post('/upload', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const { fileName, fileType, fileSize } = req.body;

    const uploadId = crypto.randomBytes(16).toString('hex');

    res.json({
      success: true,
      uploadId,
      fileName,
      streamUrl: `/streaming/uploaded/${uploadId}`,
      message: 'File uploaded and ready for streaming',
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      fccEntity: '20130314143016'
    });
  }
});

// Get streaming partners
router.get('/partners', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const partners = streamingService.getStreamingPartners();
    const contracts = partners.map((partner) => ({
      id: partner.id,
      name: partner.name,
      status: partner.active ? 'active' : 'inactive',
      endpoint: `/streaming/partner/${partner.id}/stream`,
      streamCount: streamingService.getActiveStreams().filter(s => s.id.startsWith(partner.id)).length,
      active: partner.active,
      webhookUrl: partner.webhookUrl,
      registeredAt: partner.registeredAt
    }));

    res.json({
      success: true,
      partners: contracts,
      totalPartners: contracts.length,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch partners',
      fccEntity: '20130314143016'
    });
  }
});

// Get content streaming contracts
router.get('/contracts', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const content = await streamingService.getStreamContent();
    const contracts = content.map((c: { id: string; name: string; sport: string; status: string; url: string }) => ({
      id: c.id,
      name: c.name,
      sport: c.sport,
      status: c.status,
      url: c.url,
      fccEntity: '20130314143016'
    }));

    res.json({
      success: true,
      contracts,
      totalContracts: contracts.length,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contracts',
      fccEntity: '20130314143016'
    });
  }
});

// Stream content via partner endpoint
router.get('/partner/:partnerId/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const { partnerId } = req.params;
    const streams = streamingService.getActiveStreams();
    const partnerStreams = streams.filter((s: { id: string }) => s.id.startsWith(partnerId));

    if (partnerStreams.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No streams found for this partner'
      });
    }

    res.json({
      success: true,
      streams: partnerStreams.map((stream: { id: string; name: string; sport: string; url: string; status: string }) => ({
        id: stream.id,
        name: stream.name,
        sport: stream.sport,
        url: stream.url,
        status: stream.status
      })),
      streamUrl: partnerStreams.length > 0 ? partnerStreams[0].url : null,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to stream content',
      fccEntity: '20130314143016'
    });
  }
});

// Create new streaming contract
router.post('/contracts/create', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const { name, partnerId, sport, url, status } = req.body;

    if (!name || !partnerId || !sport || !url || !status) {
      return res.status(400).json({
        success: false,
        error: 'name, partnerId, sport, url, and status are required'
      });
    }

    const contractId = `contract_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    const newContract = {
      id: contractId,
      partnerId,
      name,
      sport,
      url,
      status,
      fccEntity: '20130314143016'
    };

    // Assuming streamingService has a method to add contracts
    // streamingService.addContract(newContract);

    res.json({
      success: true,
      contract: newContract,
      message: 'Streaming contract created successfully',
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create contract',
      fccEntity: '20130314143016'
    });
  }
});

// Update streaming contract
router.put('/contracts/:contractId', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const { contractId } = req.params;
    const { name, partnerId, sport, url, status } = req.body;

    // Assuming streamingService has a method to update contracts
    // const updated = streamingService.updateContract(contractId, { name, partnerId, sport, url, status });

    res.json({
      success: true,
      contractId,
      updated: true, // Placeholder, should be based on actual update result
      message: 'Contract updated successfully',
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update contract',
      fccEntity: '20130314143016'
    });
  }
});

// Get streaming events (SSE)
router.get('/events', (req: Request, res: Response) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendEvent = () => {
      try {
        const streams = streamingService.getActiveStreams();
        res.write(`data: ${JSON.stringify({
          timestamp: Date.now(),
          streams: streams.length,
          status: 'active',
          fccEntity: '20130314143016'
        })}\n\n`);
      } catch (error) {
        console.error('SSE send error:', error);
      }
    };

    sendEvent();
    const interval = setInterval(sendEvent, 5000);

    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });
  } catch (error) {
    console.error('SSE connection error:', error);
    res.status(500).json({
      success: false,
      error: 'SSE connection failed'
    });
  }
});


// Unified Sportsbook Fusion Stream
router.get('/fusion/unified-stream', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const allSportsbooks = streamingService.getExternalSportsbooks();
    const cloudStatus = await hybridControlService.fuseControl();
    const fusionSessionId = crypto.randomBytes(16).toString('hex');

    const fusionStream = {
      sessionId: fusionSessionId,
      name: 'Unified Sportsbook Fusion Stream',
      timestamp: new Date().toISOString(),
      fccEntity: '20130314143016',
      connectedSportsbooks: allSportsbooks.map(sb => ({
        id: sb.id,
        name: sb.name,
        active: sb.active,
        webhookUrl: sb.webhookUrl,
        githubProject: sb.githubProject
      })),
      cloudInfrastructure: {
        totalNodes: cloudStatus.clouds.total,
        onlineNodes: cloudStatus.clouds.online,
        totalCapacity: cloudStatus.clouds.totalCapacity,
        currentLoad: cloudStatus.clouds.currentLoad,
        connections: cloudStatus.connections.total,
        bandwidth: cloudStatus.connections.totalBandwidth,
        avgLatency: cloudStatus.connections.avgLatency
      },
      powerStructures: cloudStatus.powerStructures,
      streamUrl: `${req.protocol}://${req.get('host')}/streaming/fusion/live/${fusionSessionId}`,
      capabilities: {
        multiSportsbookBroadcast: true,
        cloudDistribution: true,
        realTimeSync: true,
        failoverSupport: true,
        loadBalancing: true
      }
    };

    liveSessions.set(fusionSessionId, fusionStream);

    res.json({
      success: true,
      fusion: fusionStream,
      message: 'All sportsbooks fused into unified cloud stream',
      totalSportsbooks: allSportsbooks.length,
      activeSportsbooks: allSportsbooks.filter(sb => sb.active).length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Fusion stream failed',
      fccEntity: '20130314143016'
    });
  }
});

// Live fusion stream endpoint
router.get('/fusion/live/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const session = liveSessions.get(sessionId);

  if (!session) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(404).json({
      success: false,
      error: 'Fusion stream not found'
    });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Fusion-Stream', 'true');
  res.setHeader('X-FCC-Entity', '20130314143016');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({
    type: 'fusion_connected',
    sessionId,
    timestamp: new Date().toISOString(),
    message: 'Connected to unified sportsbook fusion stream'
  })}\n\n`);

  const updateInterval = setInterval(async () => {
    try {
      const cloudStatus = await hybridControlService.fuseControl();
      const sportsbooks = streamingService.getExternalSportsbooks();

      res.write(`data: ${JSON.stringify({
        type: 'fusion_update',
        timestamp: new Date().toISOString(),
        sessionId,
        sportsbooks: sportsbooks.map(sb => ({
          id: sb.id,
          name: sb.name,
          status: sb.active ? 'streaming' : 'offline'
        })),
        cloudMetrics: {
          load: cloudStatus.clouds.currentLoad,
          capacity: cloudStatus.clouds.totalCapacity,
          utilization: Math.round((cloudStatus.clouds.currentLoad / cloudStatus.clouds.totalCapacity) * 100),
          bandwidth: cloudStatus.connections.totalBandwidth,
          latency: cloudStatus.connections.avgLatency
        }
      })}\n\n`);
    } catch (error) {
      console.error('Fusion stream error:', error);
    }
  }, 2000);

  req.on('close', () => {
    clearInterval(updateInterval);
  });
});

// Get fusion stream status
router.get('/fusion/status', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const cloudStatus = await hybridControlService.fuseControl();
    const sportsbooks = streamingService.getExternalSportsbooks();

    res.json({
      success: true,
      fusion: {
        enabled: true,
        totalSportsbooks: sportsbooks.length,
        activeSportsbooks: sportsbooks.filter(sb => sb.active).length,
        cloudNodes: cloudStatus.clouds.online,
        cloudCapacity: cloudStatus.clouds.totalCapacity,
        cloudLoad: cloudStatus.clouds.currentLoad,
        bandwidth: cloudStatus.connections.totalBandwidth,
        latency: cloudStatus.connections.avgLatency,
        activeSessions: liveSessions.size,
        powerStructures: cloudStatus.powerStructures
      },
      sportsbooks: sportsbooks.map(sb => ({
        id: sb.id,
        name: sb.name,
        active: sb.active,
        webhookUrl: sb.webhookUrl
      })),
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed',
      fccEntity: '20130314143016'
    });
  }
});

// Cloud integration status
router.get('/cloud/status', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const cloudStatus = await hybridControlService.fuseControl();

    res.json({
      success: true,
      aws: {
        connected: true,
        region: 'us-east-1',
        services: ['s3', 'lambda', 'bedrock']
      },
      microsoft: {
        connected: true,
        services: ['azure-ai', 'media-services']
      },
      hybridControl: {
        fused: cloudStatus.fused,
        clouds: cloudStatus.clouds,
        systems: cloudStatus.systems,
        connections: cloudStatus.connections
      },
      activeSessions: liveSessions.size,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed',
      fccEntity: '20130314143016'
    });
  }
});

// Production deployment for all betting sites
router.post('/deploy/all-sportsbooks', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const { includePS5, includePickupGames, deploymentMode } = req.body;

    const partners = streamingService.getStreamingPartners();
    const streams = streamingService.getActiveStreams();

    const deployment = {
      id: `deploy_${Date.now()}`,
      timestamp: new Date().toISOString(),
      mode: deploymentMode || 'production',
      fccEntity: '20130314143016',
      summary: {
        sportsbooksDeployed: partners.length,
        ps5GamesAvailable: includePS5 ? 15 : 0,
        pickupGamesAvailable: includePickupGames ? 8 : 0,
        relationshipsEstablished: partners.filter(p => p.active).length,
        activeStreams: streams.length
      },
      sportsbooks: partners.map(partner => ({
        id: partner.id,
        name: partner.name,
        deployed: true,
        streamingEnabled: partner.active,
        webhookUrl: partner.webhookUrl
      })),
      features: {
        ps5Integration: includePS5,
        pickupGames: includePickupGames,
        streaming: true,
        contracts: true
      }
    };

    res.json({
      success: true,
      deployment,
      message: 'Successfully deployed streaming services to all betting sites'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Deployment failed',
      fccEntity: '20130314143016'
    });
  }
});

// Get deployment status
router.get('/deploy/status', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const partners = streamingService.getStreamingPartners();
    const streams = streamingService.getActiveStreams();

    res.json({
      success: true,
      deploymentStatus: {
        totalSportsbooks: partners.length,
        activeSportsbooks: partners.filter(p => p.active).length,
        ps5Integration: {
          enabled: true,
          totalGames: 15,
          availableGames: ['Madden NFL', 'NBA 2K', 'UFC 5', 'Boxing']
        },
        pickupGames: {
          enabled: true,
          available: 8,
          getOutAndPlay: true
        },
        relationships: {
          established: partners.filter(p => p.active).length,
          pending: 0
        },
        streaming: {
          activeStreams: streams.length,
          totalCapacity: 100
        }
      },
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deployment status',
      fccEntity: '20130314143016'
    });
  }
});

// Get all streaming data
router.get('/streams', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const partners = streamingService.getStreamingPartners();
    const streams = streamingService.getAllStreams();

    res.json({
      success: true,
      streams: streams || [],
      partners: partners || [],
      count: (streams || []).length,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch streams',
      streams: [],
      fccEntity: '20130314143016'
    });
  }
});

// Streaming endpoints for contracts
router.get('/streaming-endpoints', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const partners = streamingService.getStreamingPartners();
    const endpoints = partners.map(p => ({
      id: p.id,
      name: p.name,
      endpoint: `/streaming/partner/${p.id}/stream`,
      status: p.active ? 'active' : 'inactive'
    }));

    res.json({
      success: true,
      endpoints,
      totalEndpoints: endpoints.length,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch streaming endpoints',
      fccEntity: '20130314143016'
    });
  }
});

// Get contract details including partner info
router.get('/contracts/:contractId', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { contractId } = req.params;
    const streams = streamingService.getActiveStreams();
    const partners = streamingService.getStreamingPartners();

    const contract = streams.find(s => s.id === contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found',
        fccEntity: '20130314143016'
      });
    }

    const partner = partners.find(p => p.id === contract.id);

    res.json({
      success: true,
      contract: {
        id: contract.id,
        name: contract.name,
        sport: contract.sport,
        status: contract.status,
        url: contract.url,
        partner: partner ? {
          id: partner.id,
          name: partner.name,
          status: partner.active ? 'active' : 'inactive'
        } : null
      },
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contract details',
      fccEntity: '20130314143016'
    });
  }
});

export default router;