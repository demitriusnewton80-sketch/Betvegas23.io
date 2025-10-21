
import express, { Request, Response } from 'express';
import { streamingService } from '../services/StreamingService.js';
import { productionMappingCore } from '../core/ProductionMappingCore.js';
import { smartTunnelCore } from '../core/SmartTunnelCore.js';

const router = express.Router();

// Get all streaming partners
router.get('/partners', (req: Request, res: Response) => {
  try {
    const partners = streamingService.getStreamingPartners();
    const status = streamingService.getStatus();
    
    res.json({
      success: true,
      partners,
      status,
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get partners'
    });
  }
});

// Get active streams
router.get('/streams', (req: Request, res: Response) => {
  try {
    const streams = streamingService.getActiveStreams();
    
    res.json({
      success: true,
      streams,
      count: streams.length,
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get streams'
    });
  }
});

// Get streaming events (for troubleshooting)
router.get('/events', (req: Request, res: Response) => {
  try {
    const streams = streamingService.getActiveStreams();
    const status = streamingService.getStatus();
    
    res.json({
      success: true,
      events: streams.map(s => ({
        id: s.id,
        name: s.name,
        sport: s.sport,
        status: s.status,
        viewers: s.viewers
      })),
      status,
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get events'
    });
  }
});

// Deploy to all partners
router.post('/deploy-all', async (req: Request, res: Response) => {
  try {
    const partners = streamingService.getStreamingPartners();
    const activePartners = partners.filter(p => p.active);
    
    // Sync with production mapping
    await productionMappingCore.syncAllProductions();
    
    res.json({
      success: true,
      deployedCount: activePartners.length,
      message: `Deployed to ${activePartners.length} active partners`,
      partners: activePartners,
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Deployment failed'
    });
  }
});

// Sync all sportsbooks
router.post('/sync-all', async (req: Request, res: Response) => {
  try {
    const partners = streamingService.getStreamingPartners();
    
    // Create tunnel connections for each partner
    const tunnelIds = partners
      .filter(p => p.active)
      .map(p => smartTunnelCore.createTunnelConnection(`/streaming/partner/${p.id}`, 'network'));
    
    // Sync with production mapping
    await productionMappingCore.syncAllProductions();
    
    res.json({
      success: true,
      message: 'All sportsbooks synchronized',
      syncedCount: partners.length,
      tunnelsCreated: tunnelIds.length,
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed'
    });
  }
});

// Get fusion status
router.get('/fusion/status', (req: Request, res: Response) => {
  try {
    const streamingStatus = streamingService.getStatus();
    const tunnelStats = smartTunnelCore.getStats();
    const mappingStatus = productionMappingCore.getStatus();
    
    res.json({
      success: true,
      streaming: streamingStatus,
      tunnels: tunnelStats,
      productionMapping: {
        fusionActive: mappingStatus.fusionActive,
        activeMappings: mappingStatus.mappings.active,
        totalMappings: mappingStatus.mappings.total
      },
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

export default router;
