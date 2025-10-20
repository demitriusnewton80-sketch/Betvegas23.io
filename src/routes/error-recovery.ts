
import express, { Request, Response } from 'express';
import { errorRecoverySystem } from '../core/ErrorRecoverySystem.js';

const router = express.Router();

// Get recovery status
router.get('/status', (req: Request, res: Response) => {
  const status = errorRecoverySystem.getStatus();
  
  res.json({
    success: true,
    ...status,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Get all errors
router.get('/errors', (req: Request, res: Response) => {
  const errors = errorRecoverySystem.getErrors();
  
  res.json({
    success: true,
    errors,
    count: errors.length,
    unresolved: errors.filter(e => !e.resolved).length
  });
});

// Get security threats
router.get('/threats', (req: Request, res: Response) => {
  const threats = errorRecoverySystem.getThreats();
  
  res.json({
    success: true,
    threats,
    count: threats.length,
    blocked: threats.filter(t => t.blocked).length
  });
});

// Trigger manual recovery
router.post('/recover', (req: Request, res: Response) => {
  const { errorType, source } = req.body;
  
  const errorId = errorRecoverySystem.handleError({
    type: errorType || 'bug',
    severity: 'medium',
    message: 'Manual recovery triggered',
    source: source || 'ManualTrigger'
  });
  
  res.json({
    success: true,
    errorId,
    message: 'Recovery initiated'
  });
});

// Block a threat
router.post('/block-threat', (req: Request, res: Response) => {
  const { type, source } = req.body;
  
  if (!type || !source) {
    return res.status(400).json({
      success: false,
      error: 'type and source required'
    });
  }
  
  const threatId = errorRecoverySystem.blockThreat(type, source);
  
  res.json({
    success: true,
    threatId,
    message: 'Threat blocked and handled'
  });
});

// Toggle auto-recovery
router.post('/auto-recovery', (req: Request, res: Response) => {
  const { enabled } = req.body;
  
  errorRecoverySystem.setAutoRecovery(enabled === true);
  
  res.json({
    success: true,
    autoRecoveryEnabled: enabled === true
  });
});

export default router;
