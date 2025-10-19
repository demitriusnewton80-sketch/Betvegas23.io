
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
}

const activeConnections = new Map<string, WiFiConnection>();

router.get('/status', (req: Request, res: Response) => {
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  
  res.json({
    wifiInfusion: {
      enabled: true,
      serverIP: '0.0.0.0',
      clientIP: clientIP,
      port: process.env.PORT || 5000,
      protocol: 'TCP/IP over HTTPS',
      signalStrength: 100,
      bandwidth: 'unlimited',
      latency: '<50ms',
      encryption: 'WPA3-Enterprise',
      fccEntity: '20130314143016'
    },
    networkInfo: {
      totalConnections: activeConnections.size,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
});

router.post('/connect', (req: Request, res: Response) => {
  const { deviceId, deviceType } = req.body;
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  
  const connection: WiFiConnection = {
    ip: '0.0.0.0',
    clientIP: clientIP.toString(),
    port: parseInt(process.env.PORT || '5000'),
    protocol: 'TCP/IP',
    signalStrength: 100,
    bandwidth: 'unlimited',
    latency: '<50ms',
    connectedDevices: activeConnections.size + 1
  };
  
  activeConnections.set(deviceId || clientIP.toString(), connection);
  
  res.json({
    success: true,
    connection,
    message: 'Device connected to WiFi infusion network',
    fccEntity: '20130314143016'
  });
});

router.get('/connections', (req: Request, res: Response) => {
  res.json({
    activeConnections: Array.from(activeConnections.entries()).map(([id, conn]) => ({
      deviceId: id,
      ...conn
    })),
    total: activeConnections.size
  });
});

router.post('/disconnect/:deviceId', (req: Request, res: Response) => {
  const { deviceId } = req.params;
  const removed = activeConnections.delete(deviceId);
  
  res.json({
    success: removed,
    message: removed ? 'Device disconnected' : 'Device not found'
  });
});

export default router;
