
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

export default router;
