
import express, { Request, Response } from 'express';
import { leedsExportService } from '../services/LeedsExportService.js';

const router = express.Router();

// Export peers to public domain
router.post('/export', (req: Request, res: Response) => {
  try {
    const exportData = leedsExportService.exportPeersToPublicDomain();
    
    res.json({
      success: true,
      message: 'Peers exported to public domain',
      export: exportData,
      publicURL: leedsExportService.generatePublicURL(exportData.exportId)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Export failed'
    });
  }
});

// Get export in specific format
router.get('/export/format/:format', (req: Request, res: Response) => {
  try {
    const { format } = req.params;
    
    if (!['json', 'xml', 'csv'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid format. Use json, xml, or csv'
      });
    }

    const exportData = leedsExportService.exportToFormat(format as any);
    
    // Set appropriate content type
    const contentTypes = {
      json: 'application/json',
      xml: 'application/xml',
      csv: 'text/csv'
    };
    
    res.setHeader('Content-Type', contentTypes[format as keyof typeof contentTypes]);
    res.send(exportData);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Export failed'
    });
  }
});

// Get export history
router.get('/history', (req: Request, res: Response) => {
  try {
    const history = leedsExportService.getExportHistory();
    
    res.json({
      success: true,
      count: history.length,
      exports: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get history'
    });
  }
});

// Get specific export by ID
router.get('/export/:exportId', (req: Request, res: Response) => {
  try {
    const { exportId } = req.params;
    const exportData = leedsExportService.getExportById(exportId);
    
    if (!exportData) {
      return res.status(404).json({
        success: false,
        error: 'Export not found'
      });
    }
    
    res.json({
      success: true,
      export: exportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get export'
    });
  }
});

// Update export configuration
router.put('/config', (req: Request, res: Response) => {
  try {
    const config = req.body;
    leedsExportService.updateConfiguration(config);
    
    res.json({
      success: true,
      message: 'Configuration updated',
      config: leedsExportService.getConfiguration()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update config'
    });
  }
});

// Get current configuration
router.get('/config', (req: Request, res: Response) => {
  try {
    const config = leedsExportService.getConfiguration();
    
    res.json({
      success: true,
      config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get config'
    });
  }
});

export default router;
