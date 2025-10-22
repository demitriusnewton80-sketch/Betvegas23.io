
import express, { Request, Response } from 'express';
import { broadcastExportService } from '../services/BroadcastExportService.js';

const router = express.Router();

// Get export summary
router.get('/summary', (req: Request, res: Response) => {
  try {
    const summary = broadcastExportService.getExportSummary();

    res.json({
      success: true,
      summary,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get summary'
    });
  }
});

// Export full broadcast data
router.post('/export/full', async (req: Request, res: Response) => {
  try {
    const { format = 'json' } = req.body;

    const exportData = await broadcastExportService.exportFullBroadcast(format);

    res.json({
      success: true,
      export: exportData,
      downloadUrl: `/broadcast-export/download/${exportData.exportId}`,
      message: 'Full broadcast export created successfully',
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Export failed'
    });
  }
});

// Export streaming broadcasts
router.post('/export/streaming', async (req: Request, res: Response) => {
  try {
    const { format = 'json' } = req.body;

    const exportData = await broadcastExportService.exportStreamingBroadcasts(format);

    res.json({
      success: true,
      export: exportData,
      downloadUrl: `/broadcast-export/download/${exportData.exportId}`,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Export failed'
    });
  }
});

// Export radio broadcasts
router.post('/export/radio', async (req: Request, res: Response) => {
  try {
    const { format = 'json' } = req.body;

    const exportData = await broadcastExportService.exportRadioBroadcasts(format);

    res.json({
      success: true,
      export: exportData,
      downloadUrl: `/broadcast-export/download/${exportData.exportId}`,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Export failed'
    });
  }
});

// Download export file
router.get('/download/:exportId', (req: Request, res: Response) => {
  try {
    const { exportId } = req.params;
    const exportData = broadcastExportService.getExport(exportId);

    if (!exportData) {
      return res.status(404).json({
        success: false,
        error: 'Export not found'
      });
    }

    const filename = `broadcast_export_${exportId}.${exportData.format}`;
    const contentType = exportData.format === 'json' ? 'application/json' :
                       exportData.format === 'xml' ? 'application/xml' :
                       'text/csv';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (exportData.format === 'json') {
      res.send(JSON.stringify(exportData.data, null, 2));
    } else {
      res.send(exportData.data);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Download failed'
    });
  }
});

// Get all exports
router.get('/exports', (req: Request, res: Response) => {
  try {
    const exports = broadcastExportService.getAllExports();

    res.json({
      success: true,
      exports: exports.map(e => ({
        exportId: e.exportId,
        timestamp: new Date(e.timestamp).toISOString(),
        exportType: e.exportType,
        format: e.format,
        downloadUrl: `/broadcast-export/download/${e.exportId}`
      })),
      total: exports.length,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get exports'
    });
  }
});

export default router;
