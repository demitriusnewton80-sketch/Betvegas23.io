
import express, { Request, Response } from 'express';
import { portManagementCore } from '../core/PortManagementCore.js';
import { functionalStructures } from '../core/FunctionalStructures.js';
import { espnTrackerService } from '../services/ESPNSportsTrackerService.js';
import { sportsDataService } from '../services/SportsDataService.js';

const router = express.Router();

// Get portal dashboard data with port mapping
router.get('/dashboard', (req: Request, res: Response) => {
  const portLandscape = portManagementCore.getPortLandscape();
  const structures = functionalStructures.getStructureStatus();
  const liveGames = espnTrackerService.getCurrentLiveGames();
  const allEvents = sportsDataService.getAllEvents();

  res.json({
    success: true,
    portal: {
      ports: portLandscape.ports.map(p => ({
        port: p.port,
        status: p.status,
        structure: p.boundStructure,
        responseTime: p.responseTime,
        streamUrl: `http://0.0.0.0:${p.port}`,
        externalUrl: `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co:${p.port}`
      })),
      coreMappings: structures.structures.map(s => ({
        id: s.id,
        name: s.name,
        powerLevel: s.powerLevel,
        operational: s.operational,
        modules: s.moduleCount
      })),
      liveStreams: liveGames.map(game => ({
        gameId: game.gameId,
        league: game.league,
        matchup: `${game.awayTeam} @ ${game.homeTeam}`,
        status: game.status,
        score: game.score,
        venue: game.venue
      })),
      sportingEvents: allEvents.slice(0, 10).map(event => ({
        id: event.id,
        sport: event.sport,
        teams: `${event.awayTeam} @ ${event.homeTeam}`,
        odds: event.moneyLine
      })),
      systemStats: {
        totalPorts: portLandscape.totalPorts,
        activePorts: portLandscape.activePorts,
        totalStructures: structures.totalStructures,
        averagePower: structures.averagePowerLevel
      }
    },
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Stream specific port data
router.get('/port/:port/stream', (req: Request, res: Response) => {
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
      streamUrl: `http://0.0.0.0:${port}`,
      externalUrl: `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co:${port}`,
      responseTime: portStatus.responseTime,
      health: portStatus.errorCount === 0 ? 'healthy' : 'degraded'
    },
    fccEntity: '20130314143016'
  });
});

// Get core mapping visualization data
router.get('/core-map', (req: Request, res: Response) => {
  const structures = functionalStructures.getAllStructures();
  const portLandscape = portManagementCore.getPortLandscape();

  const coreMap = structures.map(structure => {
    const boundPorts = portLandscape.ports.filter(
      p => p.boundStructure === structure.id
    );

    return {
      structureId: structure.id,
      structureName: structure.name,
      powerLevel: structure.powerLevel,
      operational: structure.operational,
      boundPorts: boundPorts.map(p => ({
        port: p.port,
        status: p.status,
        responseTime: p.responseTime
      })),
      modules: structure.modules.map(m => ({
        id: m.id,
        name: m.name,
        type: m.type,
        status: m.status
      }))
    };
  });

  res.json({
    success: true,
    coreMap,
    totalStructures: coreMap.length,
    fccEntity: '20130314143016'
  });
});

// Apply port mapping to structure
router.post('/apply-mapping', (req: Request, res: Response) => {
  const { structureId, port } = req.body;

  if (!structureId || !port) {
    return res.status(400).json({
      success: false,
      error: 'structureId and port are required'
    });
  }

  const result = portManagementCore.bindStructureToPort(structureId, parseInt(port));

  res.json({
    ...result,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Live streaming events (SSE)
router.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const sendUpdate = () => {
    const portLandscape = portManagementCore.getPortLandscape();
    const liveGames = espnTrackerService.getCurrentLiveGames();

    res.write(`data: ${JSON.stringify({
      timestamp: Date.now(),
      ports: portLandscape.activePorts,
      bypasses: portLandscape.activeBypassRoutes,
      liveGames: liveGames.length,
      fccEntity: '20130314143016'
    })}\n\n`);
  };

  sendUpdate();
  const interval = setInterval(sendUpdate, 5000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

export default router;
