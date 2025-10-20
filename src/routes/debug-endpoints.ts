
import express, { Request, Response } from 'express';
import { errorRecoverySystem } from '../core/ErrorRecoverySystem.js';
import { smartTroubleshootingCore } from '../core/SmartTroubleshootingCore.js';

const router = express.Router();

// Debug: Check all endpoint responses
router.get('/check-endpoints', async (req: Request, res: Response) => {
  const endpoints = [
    '/health',
    '/api/core/status',
    '/streaming/streams',
    '/streaming/events',
    '/error-recovery/status',
    '/smart-troubleshooting/status'
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://0.0.0.0:5000${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });

      const contentType = response.headers.get('content-type');
      let data = null;
      let error = null;

      try {
        data = await response.json();
      } catch (e) {
        error = 'Invalid JSON response';
      }

      results.push({
        endpoint,
        status: response.status,
        contentType,
        hasValidJSON: error === null,
        error,
        data: error ? null : data
      });
    } catch (error) {
      results.push({
        endpoint,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      passing: results.filter(r => r.status === 200 && r.hasValidJSON).length,
      failing: results.filter(r => r.status !== 200 || !r.hasValidJSON).length
    }
  });
});

// Debug: Get all active errors
router.get('/active-errors', (req: Request, res: Response) => {
  const errors = errorRecoverySystem.getErrors();
  const activeErrors = errors.filter(e => !e.resolved);

  res.json({
    success: true,
    activeErrors,
    count: activeErrors.length,
    byType: {
      duplicate: activeErrors.filter(e => e.type === 'duplicate').length,
      bug: activeErrors.filter(e => e.type === 'bug').length,
      upload: activeErrors.filter(e => e.type === 'upload').length,
      security: activeErrors.filter(e => e.type === 'security').length,
      system: activeErrors.filter(e => e.type === 'system').length
    }
  });
});

// Debug: Fix specific error types
router.post('/fix-error-type', async (req: Request, res: Response) => {
  const { errorType } = req.body;
  const errors = errorRecoverySystem.getErrors();
  const targetErrors = errors.filter(e => e.type === errorType && !e.resolved);

  const fixes = [];

  for (const error of targetErrors) {
    try {
      // Trigger recovery
      errorRecoverySystem.handleError({
        type: error.type,
        severity: 'low',
        message: `Manual fix for ${error.id}`,
        source: 'DebugEndpoint'
      });
      fixes.push(error.id);
    } catch (e) {
      console.error(`Failed to fix error ${error.id}`);
    }
  }

  res.json({
    success: true,
    errorType,
    fixedCount: fixes.length,
    fixedErrors: fixes
  });
});

// Debug: Get troubleshooting sessions
router.get('/troubleshooting-sessions', (req: Request, res: Response) => {
  const sessions = smartTroubleshootingCore.getSessions();

  res.json({
    success: true,
    sessions,
    count: sessions.length,
    byStatus: {
      detecting: sessions.filter(s => s.status === 'detecting').length,
      diagnosing: sessions.filter(s => s.status === 'diagnosing').length,
      fixing: sessions.filter(s => s.status === 'fixing').length,
      resolved: sessions.filter(s => s.status === 'resolved').length,
      failed: sessions.filter(s => s.status === 'failed').length
    }
  });
});

// Debug: Test specific endpoint
router.post('/test-endpoint', async (req: Request, res: Response) => {
  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({
      success: false,
      error: 'endpoint required'
    });
  }

  try {
    const response = await fetch(`http://0.0.0.0:5000${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });

    const contentType = response.headers.get('content-type');
    const text = await response.text();

    let json = null;
    let jsonError = null;

    try {
      json = JSON.parse(text);
    } catch (e) {
      jsonError = 'Invalid JSON';
    }

    res.json({
      success: true,
      endpoint,
      status: response.status,
      contentType,
      responsePreview: text.substring(0, 200),
      isValidJSON: jsonError === null,
      jsonError,
      parsedData: json
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
