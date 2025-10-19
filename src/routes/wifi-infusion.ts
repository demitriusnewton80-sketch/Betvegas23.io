
import express, { Request, Response } from 'express';

const router = express.Router();

interface WiFiConnection {
  ip: string;
  clientIP: string;
  port: number;
  protocol: string;
  signalStrength: number;
  bandwidth: string;
  latency: string;
  connectedDevices: number;
  connectedAt: string;
}

const activeConnections = new Map<string, WiFiConnection>();

router.get('/status', (req: Request, res: Response) => {
  try {
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const portNum = parseInt(process.env.PORT || '5000');
    
    res.json({
      success: true,
      wifiInfusion: {
        enabled: true,
        serverIP: '0.0.0.0',
        clientIP: String(clientIP),
        port: portNum,
        protocol: 'TCP/IP over HTTPS',
        signalStrength: 100,
        bandwidth: 'unlimited',
        latency: '<50ms',
        encryption: 'WPA3-Enterprise',
        fccEntity: '20130314143016'
      },
      networkInfo: {
        totalConnections: activeConnections.size,
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get WiFi infusion status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/connect', (req: Request, res: Response) => {
  try {
    const { deviceId, deviceType } = req.body;
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const connectionKey = deviceId || `device-${clientIP.toString()}-${Date.now()}`;
    
    const connection: WiFiConnection = {
      ip: '0.0.0.0',
      clientIP: clientIP.toString(),
      port: parseInt(process.env.PORT || '5000'),
      protocol: 'TCP/IP over HTTPS',
      signalStrength: 100,
      bandwidth: 'unlimited',
      latency: '<50ms',
      connectedDevices: activeConnections.size + 1,
      connectedAt: new Date().toISOString()
    };
    
    activeConnections.set(connectionKey, connection);
    
    res.json({
      success: true,
      deviceId: connectionKey,
      deviceType: deviceType || 'unknown',
      connection,
      message: 'Device connected to WiFi infusion network',
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to connect device',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/connections', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      activeConnections: Array.from(activeConnections.entries()).map(([id, conn]) => ({
        deviceId: id,
        ...conn
      })),
      total: activeConnections.size,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get connections',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/disconnect/:deviceId', (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Device ID is required'
      });
    }
    
    const removed = activeConnections.delete(deviceId);
    
    res.json({
      success: removed,
      deviceId,
      message: removed ? 'Device disconnected from WiFi infusion network' : 'Device not found',
      remainingConnections: activeConnections.size,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect device',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
