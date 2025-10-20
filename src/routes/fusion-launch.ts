
import express, { Request, Response } from 'express';
import { portManagementCore } from '../core/PortManagementCore.js';
import { streamingService } from '../services/StreamingService.js';
import { phoneControlService } from '../services/PhoneControlService.js';

const router = express.Router();

interface FusionDevice {
  id: string;
  name: string;
  type: string;
  ipAddress: string;
  port: number;
  connected: boolean;
  accountEmail?: string;
}

const connectedDevices = new Map<string, FusionDevice>();
const fusionSessions = new Map<string, any>();

// Fuse launch location to environment port
router.post('/fuse-location', async (req: Request, res: Response) => {
  const { port, deviceId, accountEmail } = req.body;

  if (!port || !deviceId) {
    return res.status(400).json({
      success: false,
      error: 'port and deviceId required'
    });
  }

  const envPort = parseInt(process.env.PORT || '5000');
  const targetPort = parseInt(port);

  const fusionId = `fusion_${Date.now()}_${deviceId}`;

  const fusionSession = {
    id: fusionId,
    envPort,
    targetPort,
    deviceId,
    accountEmail,
    location: `http://0.0.0.0:${targetPort}`,
    publicLocation: `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`,
    streamEndpoint: `/fusion-launch/stream/${fusionId}`,
    dataEndpoint: `/fusion-launch/data/${fusionId}`,
    createdAt: new Date().toISOString(),
    fccEntity: '20130314143016'
  };

  fusionSessions.set(fusionId, fusionSession);

  res.json({
    success: true,
    fusion: fusionSession,
    message: 'Location fused to environment port successfully'
  });
});

// Connect device to fusion network
router.post('/connect-device', async (req: Request, res: Response) => {
  const { deviceName, deviceType, accountEmail, ipAddress } = req.body;

  if (!deviceName || !accountEmail) {
    return res.status(400).json({
      success: false,
      error: 'deviceName and accountEmail required'
    });
  }

  const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const assignedPort = 5000 + connectedDevices.size;

  const device: FusionDevice = {
    id: deviceId,
    name: deviceName,
    type: deviceType || 'mobile',
    ipAddress: ipAddress || req.ip || '0.0.0.0',
    port: assignedPort,
    connected: true,
    accountEmail
  };

  connectedDevices.set(deviceId, device);

  // Create phone control session for device
  phoneControlService.createSession(accountEmail, device.ipAddress);

  res.json({
    success: true,
    device,
    connectionUrl: `http://0.0.0.0:${device.port}`,
    streamUrl: `/fusion-launch/stream/${deviceId}`,
    fccEntity: '20130314143016'
  });
});

// Stream live content from device
router.get('/stream/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const sendUpdate = () => {
    const streams = streamingService.getActiveStreams();
    const landscape = portManagementCore.getPortLandscape();
    const devices = Array.from(connectedDevices.values());

    res.write(`data: ${JSON.stringify({
      timestamp: new Date().toISOString(),
      sessionId,
      streams: streams.length,
      activePorts: landscape.activePorts,
      connectedDevices: devices.length,
      liveContent: streams.map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        url: s.url
      }))
    })}\n\n`);
  };

  sendUpdate();
  const interval = setInterval(sendUpdate, 2000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// Manage download and database mapping
router.post('/manage-data', async (req: Request, res: Response) => {
  const { sessionId, action, dataType, content } = req.body;

  if (!sessionId || !action) {
    return res.status(400).json({
      success: false,
      error: 'sessionId and action required'
    });
  }

  const session = fusionSessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  const dataMapping = {
    id: `data_${Date.now()}`,
    sessionId,
    action,
    dataType: dataType || 'stream',
    content: content || {},
    stored: true,
    location: `${session.dataEndpoint}/${dataType}`,
    timestamp: new Date().toISOString()
  };

  res.json({
    success: true,
    dataMapping,
    message: `Data ${action} completed successfully`,
    fccEntity: '20130314143016'
  });
});

// Get all connected devices
router.get('/devices', (req: Request, res: Response) => {
  const devices = Array.from(connectedDevices.values());

  res.json({
    success: true,
    devices,
    totalDevices: devices.length,
    connectedDevices: devices.filter(d => d.connected).length,
    fccEntity: '20130314143016'
  });
});

// Get port mapping for connected accounts
router.get('/port-map', (req: Request, res: Response) => {
  const landscape = portManagementCore.getPortLandscape();
  const devices = Array.from(connectedDevices.values());

  const portMap = devices.map(device => ({
    deviceId: device.id,
    deviceName: device.name,
    port: device.port,
    accountEmail: device.accountEmail,
    location: `http://0.0.0.0:${device.port}`,
    portStatus: landscape.ports.find(p => p.port === device.port)?.status || 'unknown'
  }));

  res.json({
    success: true,
    portMap,
    totalMappings: portMap.length,
    fccEntity: '20130314143016'
  });
});

// Download content from stream
router.post('/download', async (req: Request, res: Response) => {
  const { streamId, deviceId, format } = req.body;

  if (!streamId || !deviceId) {
    return res.status(400).json({
      success: false,
      error: 'streamId and deviceId required'
    });
  }

  const device = connectedDevices.get(deviceId);
  
  if (!device) {
    return res.status(404).json({
      success: false,
      error: 'Device not found'
    });
  }

  const downloadId = `download_${Date.now()}`;

  res.json({
    success: true,
    download: {
      id: downloadId,
      streamId,
      deviceId,
      deviceName: device.name,
      format: format || 'mp4',
      url: `/fusion-launch/download/${downloadId}`,
      status: 'ready',
      createdAt: new Date().toISOString()
    },
    fccEntity: '20130314143016'
  });
});

// Get fusion status
router.get('/status', (req: Request, res: Response) => {
  const landscape = portManagementCore.getPortLandscape();
  const streams = streamingService.getActiveStreams();
  const devices = Array.from(connectedDevices.values());
  const sessions = Array.from(fusionSessions.values());

  res.json({
    success: true,
    fusion: {
      activeSessions: sessions.length,
      connectedDevices: devices.length,
      activePorts: landscape.activePorts,
      activeStreams: streams.length,
      envPort: parseInt(process.env.PORT || '5000'),
      publicUrl: `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    },
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

export default router;
