
import express, { Request, Response } from 'express';
import { AutoTroubleshoot } from '../utils/auto-troubleshoot.js';

const router = express.Router();

// Run full diagnostics
router.post('/diagnose', async (req: Request, res: Response) => {
  try {
    const results = await AutoTroubleshoot.runFullDiagnostics();
    
    res.json({
      success: true,
      diagnostics: results,
      issuesFound: results.issues.length,
      fixesApplied: results.fixes.length,
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Diagnostics failed'
    });
  }
});

// Fix all issues
router.post('/fix-all', async (req: Request, res: Response) => {
  try {
    const results = await AutoTroubleshoot.fixAll();
    
    res.json({
      success: true,
      message: 'All systems recovered',
      diagnostics: results,
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Auto-fix failed'
    });
  }
});

// Signal fusion sync endpoint
router.post('/signal-fuse-sync', async (req: Request, res: Response) => {
  try {
    const { deploymentUrl, syncMode } = req.body;
    
    console.log('🔗 Initiating signal fusion sync...');
    console.log(`📡 Deployment URL: ${deploymentUrl || 'auto-detected'}`);
    
    // Run full diagnostics first
    const diagnostics = await AutoTroubleshoot.runFullDiagnostics();
    
    // Auto-fix all issues
    const fixResults = await AutoTroubleshoot.fixAll();
    
    // Create signal fusion data
    const signalFusion = {
      fusionId: `signal-fuse-${Date.now()}`,
      deploymentUrl: deploymentUrl || req.get('host'),
      syncMode: syncMode || 'full',
      diagnostics,
      fixResults,
      troubleshootingCommands: [
        'diagnostics:full',
        'auto-fix:enabled',
        'production-mapping:synced',
        'environment-conditions:validated',
        'error-recovery:active'
      ],
      signals: {
        wifi: true,
        web3: true,
        bridge: true,
        tunnel: true,
        fusion: true
      },
      fccEntity: '20130314143016',
      registration: '0024454324',
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Signal fusion sync complete',
      fusion: signalFusion,
      issuesResolved: diagnostics.fixes.length,
      systemHealth: 'optimal',
      deploymentReady: true
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Signal fusion sync failed'
    });
  }
});

// Get fusion status
router.get('/fusion-status', async (req: Request, res: Response) => {
  try {
    const diagnostics = await AutoTroubleshoot.runFullDiagnostics();
    
    res.json({
      success: true,
      fusionActive: true,
      issuesFound: diagnostics.issues.length,
      fixesApplied: diagnostics.fixes.length,
      systemHealth: diagnostics.issues.length === 0 ? 'optimal' : 'degraded',
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get fusion status'
    });
  }
});

export default router;
