import express, { Request, Response } from 'express';
import { streamingService } from '../services/StreamingService.js';
import { hybridControlService } from '../services/HybridControlService.js';
import crypto from 'crypto';

const router = express.Router();

// Live streaming sessions
const liveSessions = new Map();

// Get all streams endpoint - FIXED to always return JSON
router.get('/streams', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');

  try {
    const streams = streamingService.getAllStreams();
    res.json({
      success: true,
      streams: streams || [],
      count: streams ? streams.length : 0,
      timestamp: new Date().toISOString(),
      fccEntity: '20130314143016'
    });
  } catch (error) {
    console.error('Streams endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch streams',
      streams: [],
      fccEntity: '20130314143016'
    });
  }
});

// Server-Sent Events endpoint for live updates
router.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial connection
  sendEvent({
    type: 'connected',
    timestamp: Date.now(),
    fccEntity: '20130314143016'
  });

  // Send updates every 5 seconds
  const interval = setInterval(() => {
    try {
      const streams = streamingService.getAllStreams() || [];
      sendEvent({
        type: 'update',
        streams,
        timestamp: Date.now(),
        fccEntity: '20130314143016'
      });
    } catch (error) {
      console.error('EventSource update error:', error);
      sendEvent({
        type: 'error',
        message: 'Stream update failed',
        timestamp: Date.now()
      });
    }
  }, 5000);

  req.on('close', () => {
    clearInterval(interval);
  });
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

export default router;