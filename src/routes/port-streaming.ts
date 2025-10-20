
import express, { Request, Response } from 'express';
import { portManagementCore } from '../core/PortManagementCore.js';
import { functionalStructures } from '../core/FunctionalStructures.js';
import { streamingService } from '../services/StreamingService.js';

const router = express.Router();

// Get streaming portal data
router.get('/portal/data', (req: Request, res: Response) => {
  const landscape = portManagementCore.getPortLandscape();
  const structures = functionalStructures.getStructureStatus();
  const streams = streamingService.getActiveStreams();

  res.json({
    success: true,
    portal: {
      ports: landscape.ports,
      mappings: landscape.ports.filter(p => p.boundStructure).map(p => ({
        port: p.port,
        structure: p.boundStructure,
        status: p.status,
        responseTime: p.responseTime
      })),
      coreStructures: structures.structures,
      activeStreams: streams.length,
      streamData: streams.map(s => ({
        id: s.id,
        name: s.name,
        sport: s.sport,
        status: s.status
      }))
    },
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Stream port data in real-time
router.get('/stream/:port', (req: Request, res: Response) => {
  const port = parseInt(req.params.port);
  const portStatus = portManagementCore.getPortStatus(port);

  if (!portStatus) {
    return res.status(404).json({
      success: false,
      error: 'Port not found'
    });
  }

  res.json({
    success: true,
    stream: {
      port: portStatus.port,
      status: portStatus.status,
      boundStructure: portStatus.boundStructure,
      responseTime: portStatus.responseTime,
      errorCount: portStatus.errorCount,
      lastChecked: portStatus.lastChecked,
      streaming: portStatus.status === 'active'
    },
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Get core mapping visualization
router.get('/core-map', (req: Request, res: Response) => {
  const landscape = portManagementCore.getPortLandscape();
  const structures = functionalStructures.getAllStructures();

  const mappings = landscape.ports
    .filter(p => p.boundStructure)
    .map(port => {
      const structure = structures.find(s => s.id === port.boundStructure);
      return {
        port: port.port,
        structureId: port.boundStructure,
        structureName: structure?.name || 'Unknown',
        powerLevel: structure?.powerLevel || 0,
        operational: structure?.operational || false,
        status: port.status
      };
    });

  res.json({
    success: true,
    coreMap: {
      totalMappings: mappings.length,
      mappings,
      unmappedPorts: landscape.ports.filter(p => !p.boundStructure).length
    },
    fccEntity: '20130314143016'
  });
});

// Create new port mapping
router.post('/map', (req: Request, res: Response) => {
  const { structureId, port } = req.body;

  if (!structureId || !port) {
    return res.status(400).json({
      success: false,
      error: 'structureId and port required'
    });
  }

  const result = portManagementCore.bindStructureToPort(structureId, parseInt(port));

  res.json({
    ...result,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

export default router;
