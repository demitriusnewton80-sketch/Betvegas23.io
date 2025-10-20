
import express, { Request, Response } from 'express';
import { contentIntegrityService } from '../services/ContentIntegrityService.js';

const router = express.Router();

// Get integrity report
router.get('/report', (req: Request, res: Response) => {
  try {
    const report = contentIntegrityService.getIntegrityReport();
    res.json({
      success: true,
      ...report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate report'
    });
  }
});

// Get portal details
router.get('/portal/:portalId', (req: Request, res: Response) => {
  try {
    const { portalId } = req.params;
    const details = contentIntegrityService.getPortalDetails(portalId);

    if (!details) {
      return res.status(404).json({
        success: false,
        error: 'Portal not found'
      });
    }

    res.json({
      success: true,
      ...details,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get portal details'
    });
  }
});

// Get connection details
router.get('/connection/:connectionId', (req: Request, res: Response) => {
  try {
    const { connectionId } = req.params;
    const details = contentIntegrityService.getConnectionDetails(connectionId);

    if (!details.connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      });
    }

    res.json({
      success: true,
      ...details,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get connection details'
    });
  }
});

// Get integrity status
router.get('/status', (req: Request, res: Response) => {
  try {
    const report = contentIntegrityService.getIntegrityReport();
    
    res.json({
      success: true,
      overall: {
        healthy: report.integrityChecks.passed > report.integrityChecks.failed,
        portalsActive: report.portals.filter(p => p.status === 'active').length,
        averageIntegrity: Math.round(
          report.portals.reduce((sum, p) => sum + p.integrityScore, 0) / report.portals.length
        )
      },
      ...report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get status'
    });
  }
});

export default router;
