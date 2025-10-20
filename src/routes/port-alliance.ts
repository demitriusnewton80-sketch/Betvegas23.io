
import express, { Request, Response } from 'express';
import { portManagementCore } from '../core/PortManagementCore.js';
import { smartTroubleshootingCore } from '../core/SmartTroubleshootingCore.js';

const router = express.Router();

interface AllianceConnection {
  id: string;
  appName: string;
  port: number;
  serverAddress: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastPing: number;
  throughput: number;
}

const alliances = new Map<string, AllianceConnection>();

// Launch alliance connection
router.post('/launch', async (req: Request, res: Response) => {
  const { appName, targetPort, serverAddress } = req.body;

  if (!appName || !targetPort) {
    return res.status(400).json({ error: 'appName and targetPort required' });
  }

  const allianceId = `alliance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const port = targetPort || 5000;
  const address = serverAddress || '0.0.0.0';

  try {
    // Check port status using port management core
    const portStatus = portManagementCore.getPortStatus(port);
    
    if (!portStatus) {
      return res.status(400).json({ error: 'Invalid port' });
    }

    // Use troubleshooting core to ensure port is operational
    if (portStatus.status !== 'active') {
      console.log(`🔧 Port ${port} not active, using troubleshooting core to recover...`);
      smartTroubleshootingCore.setAutoFix(true);
      
      // Trigger port recovery
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const alliance: AllianceConnection = {
      id: allianceId,
      appName,
      port,
      serverAddress: `${address}:${port}`,
      status: 'connected',
      lastPing: Date.now(),
      throughput: 0
    };

    alliances.set(allianceId, alliance);

    res.json({
      success: true,
      alliance,
      connectionUrl: `http://${address}:${port}`,
      streamUrl: `/port-alliance/stream/${allianceId}`,
      portLandscape: portManagementCore.getPortLandscape(),
      fccEntity: '20130314143016'
    });
  } catch (error) {
    console.error('Alliance launch error:', error);
    res.status(500).json({ error: 'Failed to launch alliance' });
  }
});

// Stream alliance status
router.get('/stream/:allianceId', (req: Request, res: Response) => {
  const { allianceId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const sendUpdate = () => {
    const alliance = alliances.get(allianceId);
    if (!alliance) return;

    const portLandscape = portManagementCore.getPortLandscape();
    const portStatus = portManagementCore.getPortStatus(alliance.port);
    const troubleshootingStatus = smartTroubleshootingCore.getStatus();

    res.write(`data: ${JSON.stringify({
      type: 'alliance_update',
      timestamp: new Date().toISOString(),
      alliance: {
        id: alliance.id,
        appName: alliance.appName,
        port: alliance.port,
        status: alliance.status,
        serverAddress: alliance.serverAddress
      },
      portStatus: portStatus ? {
        port: portStatus.port,
        status: portStatus.status,
        responseTime: portStatus.responseTime,
        errorCount: portStatus.errorCount
      } : null,
      portLandscape: {
        activePorts: portLandscape.activePorts,
        bypassedPorts: portLandscape.bypassedPorts,
        errorPorts: portLandscape.errorPorts
      },
      troubleshooting: {
        autoFixEnabled: troubleshootingStatus.autoFix,
        sessionActive: troubleshootingStatus.sessionActive,
        issuesDetected: troubleshootingStatus.issuesDetected
      }
    })}\n\n`);

    // Update ping time
    alliance.lastPing = Date.now();
  };

  const interval = setInterval(sendUpdate, 2000);
  sendUpdate();

  req.on('close', () => {
    clearInterval(interval);
  });
});

// Get all alliances
router.get('/list', (req: Request, res: Response) => {
  const allianceList = Array.from(alliances.values());

  res.json({
    success: true,
    alliances: allianceList,
    count: allianceList.length,
    portLandscape: portManagementCore.getPortLandscape(),
    fccEntity: '20130314143016'
  });
});

// Test alliance connection
router.post('/test/:allianceId', async (req: Request, res: Response) => {
  const { allianceId } = req.params;
  const alliance = alliances.get(allianceId);

  if (!alliance) {
    return res.status(404).json({ error: 'Alliance not found' });
  }

  try {
    const response = await fetch(`http://${alliance.serverAddress}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });

    const success = response.ok;
    alliance.status = success ? 'connected' : 'error';
    alliance.lastPing = Date.now();

    res.json({
      success,
      alliance,
      responseStatus: response.status,
      latency: Date.now() - alliance.lastPing
    });
  } catch (error) {
    alliance.status = 'error';
    
    // Use troubleshooting core to diagnose
    const diagnosis = smartTroubleshootingCore.getStatus();
    
    res.status(500).json({
      success: false,
      error: 'Connection test failed',
      alliance,
      troubleshooting: diagnosis
    });
  }
});

// Disconnect alliance
router.delete('/:allianceId', (req: Request, res: Response) => {
  const { allianceId } = req.params;
  const alliance = alliances.get(allianceId);

  if (!alliance) {
    return res.status(404).json({ error: 'Alliance not found' });
  }

  alliance.status = 'disconnected';
  alliances.delete(allianceId);

  res.json({
    success: true,
    message: 'Alliance disconnected',
    allianceId
  });
});

export default router;
