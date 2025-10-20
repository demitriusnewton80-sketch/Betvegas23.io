
import express, { Request, Response } from 'express';
import { workflowErrorLandscape } from '../core/WorkflowErrorLandscape.js';

const router = express.Router();

// Get landscape status
router.get('/status', (req: Request, res: Response) => {
  const status = workflowErrorLandscape.getLandscapeStatus();
  
  res.json({
    success: true,
    ...status,
    timestamp: new Date().toISOString()
  });
});

// Get all errors
router.get('/errors', (req: Request, res: Response) => {
  const errors = workflowErrorLandscape.getErrors();
  
  res.json({
    success: true,
    errors,
    count: errors.length,
    unrecovered: errors.filter(e => !e.recovered).length
  });
});

// Get errors by workflow
router.get('/errors/:workflowName', (req: Request, res: Response) => {
  const { workflowName } = req.params;
  const errors = workflowErrorLandscape.getErrorsByWorkflow(workflowName);
  
  res.json({
    success: true,
    workflow: workflowName,
    errors,
    count: errors.length
  });
});

// Manually trigger error detection
router.post('/detect-error', (req: Request, res: Response) => {
  const { workflowName, stage, errorType, message } = req.body;
  
  if (!workflowName || !stage || !errorType || !message) {
    return res.status(400).json({
      success: false,
      error: 'workflowName, stage, errorType, and message are required'
    });
  }
  
  const errorId = workflowErrorLandscape.detectError(
    workflowName,
    stage,
    errorType,
    message
  );
  
  res.json({
    success: true,
    errorId,
    message: 'Error detected and queued for recovery'
  });
});

// Execute recovery strategy
router.post('/execute-strategy', (req: Request, res: Response) => {
  const { zoneId, strategyName } = req.body;
  
  if (!zoneId || !strategyName) {
    return res.status(400).json({
      success: false,
      error: 'zoneId and strategyName are required'
    });
  }
  
  const result = workflowErrorLandscape.executeRecoveryStrategy(zoneId, strategyName);
  
  res.json({
    success: true,
    ...result
  });
});

export default router;
