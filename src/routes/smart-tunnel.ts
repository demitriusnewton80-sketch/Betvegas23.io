
import express, { Request, Response } from 'express';
import { smartTunnelCore } from '../core/SmartTunnelCore.js';
import { smartCommunication } from '../utils/smart-communication.js';
import { appCore } from '../core/AppCore.js';

const router = express.Router();

// Get tunnel status
router.get('/status', (req: Request, res: Response) => {
  try {
    const stats = smartTunnelCore.getStats();
    const connections = smartTunnelCore.getConnections();

    res.json({
      success: true,
      tunnel: {
        operational: stats.activeConnections > 0,
        autoRecoveryEnabled: true,
        uptime: Math.floor(stats.uptime / 1000),
        stats
      },
      connections: connections.map(conn => ({
        id: conn.id,
        type: conn.type,
        endpoint: conn.endpoint,
        status: conn.status,
        health: conn.health,
        lastActive: new Date(conn.lastActive).toISOString()
      })),
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed'
    });
  }
});

// Create new tunnel connection
router.post('/connect', (req: Request, res: Response) => {
  try {
    const { endpoint, type } = req.body;

    if (!endpoint || !type) {
      return res.status(400).json({
        success: false,
        error: 'endpoint and type are required'
      });
    }

    const connectionId = smartTunnelCore.createTunnelConnection(endpoint, type);

    res.json({
      success: true,
      connectionId,
      message: 'Tunnel connection established',
      endpoint,
      type,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    });
  }
});

// Host all network aspects
router.post('/host-all', (req: Request, res: Response) => {
  try {
    const connectionIds = smartTunnelCore.hostAllAspects();

    res.json({
      success: true,
      message: 'All network aspects hosted through smart tunnel',
      connections: connectionIds.length,
      connectionIds,
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Hosting failed'
    });
  }
});

// Get specific connection
router.get('/connection/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const connection = smartTunnelCore.getConnection(id);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      });
    }

    res.json({
      success: true,
      connection: {
        id: connection.id,
        type: connection.type,
        endpoint: connection.endpoint,
        status: connection.status,
        health: connection.health,
        lastActive: new Date(connection.lastActive).toISOString(),
        retryCount: connection.retryCount
      },
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lookup failed'
    });
  }
});

// Update connection activity (heartbeat)
router.post('/heartbeat/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { bytesTransferred } = req.body;

    smartTunnelCore.updateActivity(id, bytesTransferred || 0);

    res.json({
      success: true,
      message: 'Activity updated',
      connectionId: id,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Update failed'
    });
  }
});

// Enable/disable auto-recovery
router.post('/auto-recovery', (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    
    smartTunnelCore.setAutoRecovery(enabled);

    res.json({
      success: true,
      autoRecoveryEnabled: enabled,
      message: `Auto-recovery ${enabled ? 'enabled' : 'disabled'}`,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Update failed'
    });
  }
});

// Get tunnel health report
router.get('/health', (req: Request, res: Response) => {
  try {
    const connections = smartTunnelCore.getConnections();
    const stats = smartTunnelCore.getStats();

    const health = {
      overall: stats.activeConnections === stats.totalConnections ? 'healthy' : 'degraded',
      connections: {
        total: stats.totalConnections,
        active: stats.activeConnections,
        failed: stats.failedConnections,
        healthy: connections.filter(c => c.health === 'healthy').length,
        degraded: connections.filter(c => c.health === 'degraded').length
      },
      performance: {
        bytesTransferred: stats.bytesTransferred,
        uptime: Math.floor(stats.uptime / 1000),
        averageHealth: connections.length > 0 
          ? connections.filter(c => c.health === 'healthy').length / connections.length 
          : 0
      }
    };

    res.json({
      success: true,
      health,
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed'
    });
  }
});

// Server-Sent Events for real-time tunnel monitoring
router.get('/monitor', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendUpdate = () => {
    const stats = smartTunnelCore.getStats();
    const connections = smartTunnelCore.getConnections();
    
    res.write(`data: ${JSON.stringify({
      stats,
      activeConnections: connections.filter(c => c.status === 'connected').length,
      timestamp: Date.now()
    })}\n\n`);
  };

  sendUpdate();
  const interval = setInterval(sendUpdate, 3000);

  req.on('close', () => clearInterval(interval));
});

export default router;
