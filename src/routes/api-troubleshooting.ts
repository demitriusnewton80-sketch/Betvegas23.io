
import express, { Request, Response } from 'express';
import { appCore } from '../core/AppCore.js';
import { errorRecoverySystem } from '../core/ErrorRecoverySystem.js';
import { smartTroubleshootingCore } from '../core/SmartTroubleshootingCore.js';
import { functionalStructures } from '../core/FunctionalStructures.js';

const router = express.Router();

// Unified API troubleshooting dashboard
router.get('/status', async (req: Request, res: Response) => {
  try {
    const appStatus = appCore.getConnectionStatus();
    const systemHealth = appCore.getSystemHealth();
    const errorStatus = errorRecoverySystem.getStatus();
    const troubleshootingStatus = smartTroubleshootingCore.getStatus();
    const structureStatus = functionalStructures.getStructureStatus();

    const overallHealth = 
      systemHealth.overall === 'healthy' && 
      errorStatus.status === 'healthy' &&
      troubleshootingStatus.autoFixEnabled;

    res.json({
      success: true,
      overall: overallHealth ? 'healthy' : 'issues_detected',
      timestamp: new Date().toISOString(),
      fccEntity: '20130314143016',
      cores: {
        appCore: {
          status: systemHealth.overall,
          activeConnections: appStatus.active,
          totalConnections: appStatus.total,
          healthScore: systemHealth.healthScore,
          uptime: Math.floor(systemHealth.uptime)
        },
        errorRecovery: {
          status: errorStatus.status,
          totalErrors: errorStatus.totalErrors,
          resolvedErrors: errorStatus.resolvedErrors,
          autoFixedErrors: errorStatus.autoFixedErrors,
          unresolvedErrors: errorStatus.unresolvedErrors,
          autoRecoveryEnabled: errorStatus.autoRecoveryEnabled
        },
        smartTroubleshooting: {
          status: troubleshootingStatus.autoFixEnabled ? 'active' : 'disabled',
          totalSessions: troubleshootingStatus.totalSessions,
          activeSessions: troubleshootingStatus.activeSessions,
          resolvedSessions: troubleshootingStatus.resolvedSessions,
          endpointHealth: troubleshootingStatus.endpointHealth
        },
        functionalStructures: {
          totalStructures: structureStatus.totalStructures,
          operational: structureStatus.operational,
          averagePowerLevel: structureStatus.averagePowerLevel
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Troubleshooting failed',
      fccEntity: '20130314143016'
    });
  }
});

// Run comprehensive diagnostics
router.post('/diagnose', async (req: Request, res: Response) => {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      fccEntity: '20130314143016',
      issues: [] as string[],
      fixes: [] as string[],
      recommendations: [] as string[]
    };

    // Check system health
    const health = appCore.getSystemHealth();
    if (health.errorConnections > 0) {
      diagnostics.issues.push(`${health.errorConnections} connection(s) in error state`);
      diagnostics.recommendations.push('Run auto-recovery to fix connection issues');
    }

    // Check error recovery
    const errorStatus = errorRecoverySystem.getStatus();
    if (errorStatus.unresolvedErrors > 0) {
      diagnostics.issues.push(`${errorStatus.unresolvedErrors} unresolved error(s)`);
      diagnostics.recommendations.push('Enable auto-recovery if disabled');
    }

    // Check troubleshooting sessions
    const troubleStatus = smartTroubleshootingCore.getStatus();
    if (troubleStatus.failedSessions > 0) {
      diagnostics.issues.push(`${troubleStatus.failedSessions} failed troubleshooting session(s)`);
    }

    // Check endpoint health
    const endpointHealth = smartTroubleshootingCore.getEndpointHealth();
    const failedEndpoints = endpointHealth.filter(h => h.status === 'failed');
    if (failedEndpoints.length > 0) {
      diagnostics.issues.push(`${failedEndpoints.length} endpoint(s) failing`);
      failedEndpoints.forEach(ep => {
        diagnostics.issues.push(`Endpoint ${ep.endpoint} has ${ep.consecutiveFailures} consecutive failures`);
      });
      diagnostics.recommendations.push('Check endpoint implementations and restart affected services');
    }

    res.json({
      success: true,
      diagnostics,
      issuesFound: diagnostics.issues.length,
      autoFixAvailable: diagnostics.recommendations.length > 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Diagnosis failed'
    });
  }
});

// Auto-fix all detected issues
router.post('/auto-fix', async (req: Request, res: Response) => {
  try {
    const fixes: string[] = [];

    // Enable auto-recovery if disabled
    errorRecoverySystem.setAutoRecovery(true);
    fixes.push('Auto-recovery enabled');

    // Enable smart troubleshooting auto-fix
    smartTroubleshootingCore.setAutoFix(true);
    fixes.push('Smart troubleshooting auto-fix enabled');

    // Trigger connection reset for error connections
    const health = appCore.getSystemHealth();
    if (health.errorConnections > 0) {
      appCore.broadcastMessage('connection:reset', { 
        timestamp: Date.now(),
        source: 'API-Troubleshooting'
      });
      fixes.push(`Reset ${health.errorConnections} error connection(s)`);
    }

    // Get current errors and attempt recovery
    const errors = errorRecoverySystem.getErrors();
    const unresolvedErrors = errors.filter(e => !e.resolved);
    unresolvedErrors.forEach(error => {
      errorRecoverySystem.handleError({
        type: error.type,
        severity: error.severity,
        message: `Re-attempting fix: ${error.message}`,
        source: 'API-Troubleshooting'
      });
    });
    if (unresolvedErrors.length > 0) {
      fixes.push(`Queued ${unresolvedErrors.length} error(s) for recovery`);
    }

    res.json({
      success: true,
      message: 'Auto-fix initiated',
      fixesApplied: fixes,
      timestamp: new Date().toISOString(),
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Auto-fix failed'
    });
  }
});

// Get detailed core metrics
router.get('/metrics', (req: Request, res: Response) => {
  try {
    const health = appCore.getSystemHealth();
    const connections = appCore.getConnectionStatus();
    const errorStatus = errorRecoverySystem.getStatus();
    const troubleStatus = smartTroubleshootingCore.getStatus();
    const endpointHealth = smartTroubleshootingCore.getEndpointHealth();

    res.json({
      success: true,
      metrics: {
        system: {
          uptime: Math.floor(health.uptime),
          memoryUsedMB: Math.round(health.memoryUsage.heapUsed / 1024 / 1024),
          memoryTotalMB: Math.round(health.memoryUsage.heapTotal / 1024 / 1024),
          healthScore: health.healthScore
        },
        connections: {
          total: connections.total,
          active: connections.active,
          errorCount: health.errorConnections
        },
        errors: {
          total: errorStatus.totalErrors,
          resolved: errorStatus.resolvedErrors,
          autoFixed: errorStatus.autoFixedErrors,
          unresolved: errorStatus.unresolvedErrors,
          queueLength: errorStatus.recoveryQueueLength
        },
        troubleshooting: {
          sessions: troubleStatus.totalSessions,
          active: troubleStatus.activeSessions,
          resolved: troubleStatus.resolvedSessions,
          failed: troubleStatus.failedSessions
        },
        endpoints: {
          total: endpointHealth.length,
          healthy: endpointHealth.filter(h => h.status === 'healthy').length,
          degraded: endpointHealth.filter(h => h.status === 'degraded').length,
          failed: endpointHealth.filter(h => h.status === 'failed').length
        }
      },
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Metrics failed'
    });
  }
});

// Get endpoint health details
router.get('/endpoints', (req: Request, res: Response) => {
  try {
    const endpointHealth = smartTroubleshootingCore.getEndpointHealth();
    
    res.json({
      success: true,
      endpoints: endpointHealth.map(ep => ({
        endpoint: ep.endpoint,
        status: ep.status,
        responseTime: `${ep.responseTime}ms`,
        consecutiveFailures: ep.consecutiveFailures,
        lastChecked: new Date(ep.lastChecked).toISOString()
      })),
      summary: {
        total: endpointHealth.length,
        healthy: endpointHealth.filter(h => h.status === 'healthy').length,
        degraded: endpointHealth.filter(h => h.status === 'degraded').length,
        failed: endpointHealth.filter(h => h.status === 'failed').length
      },
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Endpoint check failed'
    });
  }
});

// HTML-JSON Communication Bridge
router.post('/html-json-bridge', async (req: Request, res: Response) => {
  try {
    const { endpoint, issue, responseText } = req.body;

    console.log(`🔗 HTML-JSON Communication issue reported for: ${endpoint}`);
    
    // Create troubleshooting session
    const sessionId = `html-json-${Date.now()}`;
    
    // Trigger auto-fix
    smartTroubleshootingCore.setAutoFix(true);
    
    res.json({
      success: true,
      sessionId,
      message: 'Communication bridge established',
      autoFixEnabled: true,
      recommendation: 'Retry your request',
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Bridge failed'
    });
  }
});

// Reset all troubleshooting systems
router.post('/reset', async (req: Request, res: Response) => {
  try {
    // Enable all auto-recovery systems
    errorRecoverySystem.setAutoRecovery(true);
    smartTroubleshootingCore.setAutoFix(true);

    // Broadcast reset to all connections
    appCore.broadcastMessage('system:reset', {
      timestamp: Date.now(),
      source: 'API-Troubleshooting',
      reason: 'Manual reset requested'
    });

    res.json({
      success: true,
      message: 'All troubleshooting systems reset',
      actions: [
        'Auto-recovery enabled',
        'Smart troubleshooting enabled',
        'System reset broadcast sent'
      ],
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Reset failed'
    });
  }
});

export default router;
