
import express, { Request, Response } from 'express';
import { vpnService } from '../services/VPNService.js';

const router = express.Router();

function getClientIP(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
         req.socket.remoteAddress || 
         '0.0.0.0';
}

router.get('/servers', (req: Request, res: Response) => {
  const servers = vpnService.getServers();

  res.json({
    success: true,
    servers,
    count: servers.length,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

router.post('/connect', async (req: Request, res: Response) => {
  const { userId, serverId } = req.body;
  const clientIP = getClientIP(req);

  if (!userId || !serverId) {
    return res.status(400).json({
      success: false,
      error: 'userId and serverId are required'
    });
  }

  try {
    const connection = await vpnService.connect(userId, serverId, clientIP);

    res.json({
      success: true,
      connection,
      message: 'VPN connection established',
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to VPN'
    });
  }
});

router.post('/disconnect/:connectionId', async (req: Request, res: Response) => {
  const { connectionId } = req.params;

  try {
    await vpnService.disconnect(connectionId);

    res.json({
      success: true,
      message: 'VPN connection disconnected',
      connectionId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disconnect from VPN'
    });
  }
});

router.get('/connection/:connectionId', (req: Request, res: Response) => {
  const { connectionId } = req.params;
  const connection = vpnService.getConnection(connectionId);

  if (!connection) {
    return res.status(404).json({
      success: false,
      error: 'Connection not found'
    });
  }

  res.json({
    success: true,
    connection,
    timestamp: new Date().toISOString()
  });
});

router.get('/user/:userId/connections', (req: Request, res: Response) => {
  const { userId } = req.params;
  const connections = vpnService.getUserConnections(userId);

  res.json({
    success: true,
    connections,
    count: connections.length,
    timestamp: new Date().toISOString()
  });
});

router.get('/active', (req: Request, res: Response) => {
  const connections = vpnService.getActiveConnections();

  res.json({
    success: true,
    connections,
    count: connections.length,
    timestamp: new Date().toISOString()
  });
});

router.get('/stats', (req: Request, res: Response) => {
  const stats = vpnService.getStats();

  res.json({
    success: true,
    stats,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

router.get('/status', (req: Request, res: Response) => {
  const clientIP = getClientIP(req);
  const stats = vpnService.getStats();

  res.json({
    success: true,
    vpnService: 'operational',
    clientIP,
    stats,
    fccEntity: '20130314143016',
    fccRegistration: '0024454324',
    encryption: 'ChaCha20-Poly1305',
    protocols: ['WireGuard', 'OpenVPN', 'IKEv2'],
    timestamp: new Date().toISOString()
  });
});

// Get all TV streams
router.get('/tv-streams', (req: Request, res: Response) => {
  const { category } = req.query;
  const streams = vpnService.getTVStreams(category as string);

  res.json({
    success: true,
    streams,
    count: streams.length,
    fccEntity: '20130314143016',
    fccCompliant: true,
    timestamp: new Date().toISOString()
  });
});

// Enable streaming for a connection
router.post('/connection/:connectionId/enable-streaming', (req: Request, res: Response) => {
  const { connectionId } = req.params;
  const { channels } = req.body;

  if (!channels || !Array.isArray(channels)) {
    return res.status(400).json({
      success: false,
      error: 'channels array is required'
    });
  }

  try {
    vpnService.enableStreamingForConnection(connectionId, channels);

    res.json({
      success: true,
      message: 'TV streaming enabled',
      connectionId,
      channels,
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enable streaming'
    });
  }
});

// Get stream URL for a specific channel
router.get('/stream/:streamId/url', (req: Request, res: Response) => {
  const { streamId } = req.params;
  const { connectionId } = req.query;

  if (!connectionId) {
    return res.status(400).json({
      success: false,
      error: 'connectionId is required'
    });
  }

  const streamUrl = vpnService.getStreamUrl(streamId, connectionId as string);

  if (!streamUrl) {
    return res.status(403).json({
      success: false,
      error: 'Stream access denied. Ensure VPN is connected and streaming is enabled.'
    });
  }

  res.json({
    success: true,
    streamId,
    streamUrl,
    fccCompliant: true,
    timestamp: new Date().toISOString()
  });
});

export default router;
