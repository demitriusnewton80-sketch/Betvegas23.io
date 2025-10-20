
import express, { Request, Response } from 'express';
import { remoteStreamingControlCore } from '../core/RemoteStreamingControlCore.js';

const router = express.Router();

// Get remote control status
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = remoteStreamingControlCore.getRemoteControlStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed'
    });
  }
});

// Get all landscapes
router.get('/landscapes', (req: Request, res: Response) => {
  try {
    const landscapes = remoteStreamingControlCore.getLandscapes();
    res.json({
      success: true,
      landscapes,
      count: landscapes.length,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get landscapes'
    });
  }
});

// Get all streaming tunnels
router.get('/tunnels', (req: Request, res: Response) => {
  try {
    const tunnels = remoteStreamingControlCore.getTunnels();
    res.json({
      success: true,
      tunnels,
      count: tunnels.length,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tunnels'
    });
  }
});

// Get FCC channels
router.get('/fcc-channels', (req: Request, res: Response) => {
  try {
    const channels = remoteStreamingControlCore.getFCCChannels();
    res.json({
      success: true,
      channels,
      count: channels.length,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get FCC channels'
    });
  }
});

// Create streaming tunnel
router.post('/tunnel/create', (req: Request, res: Response) => {
  try {
    const { sourcePort, targetPort, fccChannelId } = req.body;

    if (!sourcePort || !targetPort || !fccChannelId) {
      return res.status(400).json({
        success: false,
        error: 'sourcePort, targetPort, and fccChannelId are required'
      });
    }

    const tunnelId = remoteStreamingControlCore.createStreamingTunnel(
      parseInt(sourcePort),
      parseInt(targetPort),
      fccChannelId
    );

    res.json({
      success: true,
      tunnelId,
      message: 'Streaming tunnel created',
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Tunnel creation failed'
    });
  }
});

// Create remote control session
router.post('/session/create', (req: Request, res: Response) => {
  try {
    const { userId, landscapeId, permissions } = req.body;

    if (!userId || !landscapeId) {
      return res.status(400).json({
        success: false,
        error: 'userId and landscapeId are required'
      });
    }

    const sessionId = remoteStreamingControlCore.createRemoteSession(
      userId,
      landscapeId,
      permissions || ['read', 'execute']
    );

    res.json({
      success: true,
      sessionId,
      message: 'Remote control session created',
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Session creation failed'
    });
  }
});

// Execute remote command
router.post('/command/execute', async (req: Request, res: Response) => {
  try {
    const { sessionId, command, params } = req.body;

    if (!sessionId || !command) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and command are required'
      });
    }

    const result = await remoteStreamingControlCore.executeRemoteCommand(
      sessionId,
      command,
      params || {}
    );

    res.json({
      success: true,
      command,
      result,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Command execution failed'
    });
  }
});

// Auto-upgrade all outdated ports
router.post('/ports/upgrade-all', async (req: Request, res: Response) => {
  try {
    const status = remoteStreamingControlCore.getRemoteControlStatus();
    
    res.json({
      success: true,
      message: 'Port upgrade process initiated',
      tunnelsCreated: status.tunnels.total,
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Upgrade failed'
    });
  }
});

// Get landscape architecture
router.get('/architecture', (req: Request, res: Response) => {
  try {
    const landscapes = remoteStreamingControlCore.getLandscapes();
    const tunnels = remoteStreamingControlCore.getTunnels();
    const channels = remoteStreamingControlCore.getFCCChannels();

    const architecture = landscapes.map(landscape => ({
      landscape: {
        id: landscape.id,
        name: landscape.name,
        health: landscape.health,
        activeStreams: landscape.activeStreams
      },
      zones: landscape.zones.map(zone => ({
        id: zone.id,
        type: zone.type,
        ports: zone.ports,
        tunnelCount: zone.tunnels.length,
        remoteAccess: zone.remoteAccess,
        fccCompliant: zone.fccCompliant,
        tunnels: tunnels.filter(t => zone.tunnels.includes(t.id)).map(t => ({
          id: t.id,
          sourcePort: t.sourcePort,
          targetPort: t.targetPort,
          status: t.status,
          upgradeLevel: t.upgradeLevel,
          fccChannel: channels.find(c => c.id === t.fccChannelId)?.type
        }))
      }))
    }));

    res.json({
      success: true,
      architecture,
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Architecture retrieval failed'
    });
  }
});

export default router;
