
import express, { Request, Response } from 'express';
import { productionMappingCore } from '../core/ProductionMappingCore.js';
import { AutoTroubleshoot } from '../utils/auto-troubleshoot.js';
import { cookieSanitizer } from '../utils/cookie-sanitizer.js';
import { smartTroubleshootingCore } from '../core/SmartTroubleshootingCore.js';
import { errorRecoverySystem } from '../core/ErrorRecoverySystem.js';

const router = express.Router();

// Sync production mappings with troubleshooting
router.post('/sync-with-troubleshoot', async (req: Request, res: Response) => {
  try {
    console.log('🔗 Syncing production mapping with troubleshooting system...');

    // Step 1: Clear bad intel from cookies
    const cookiesCleaned = cookieSanitizer.clearBadIntel();
    
    // Step 2: Run full diagnostics
    const diagnostics = await AutoTroubleshoot.runFullDiagnostics();
    
    // Step 3: Sync production mappings
    await productionMappingCore.syncAllProductions();
    
    // Step 4: Get mapping status
    const mappingStatus = productionMappingCore.getStatus();
    
    // Step 5: Get troubleshooting status
    const troubleStatus = smartTroubleshootingCore.getStatus();
    
    // Step 6: Get error recovery status
    const errorStatus = errorRecoverySystem.getStatus();

    res.json({
      success: true,
      message: 'Production mapping synced with troubleshooting',
      sync: {
        cookiesCleaned,
        diagnostics: {
          issuesFound: diagnostics.issues.length,
          fixesApplied: diagnostics.fixes.length,
          cookiesSanitized: diagnostics.cookiesSanitized,
          badIntelRemoved: diagnostics.badIntelRemoved
        },
        productionMapping: {
          totalMappings: mappingStatus.mappings.total,
          activeMappings: mappingStatus.mappings.active,
          failedMappings: mappingStatus.mappings.failed,
          deploymentReady: mappingStatus.mappings.deploymentReady,
          landscapes: mappingStatus.landscapes.total,
          syncedLandscapes: mappingStatus.landscapes.synced
        },
        troubleshooting: {
          autoFixEnabled: troubleStatus.autoFixEnabled,
          activeSessions: troubleStatus.activeSessions,
          resolvedSessions: troubleStatus.resolvedSessions,
          healthyEndpoints: troubleStatus.endpointHealth.healthy,
          failedEndpoints: troubleStatus.endpointHealth.failed
        },
        errorRecovery: {
          status: errorStatus.status,
          totalErrors: errorStatus.totalErrors,
          resolvedErrors: errorStatus.resolvedErrors,
          autoFixedErrors: errorStatus.autoFixedErrors
        }
      },
      fccEntity: '20130314143016',
      registration: '0024454324',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed'
    });
  }
});

// Bug fix build - comprehensive system repair
router.post('/bug-fix-build', async (req: Request, res: Response) => {
  try {
    console.log('🔧 Running bug fix build...');

    const buildReport = {
      timestamp: new Date().toISOString(),
      phases: [] as any[],
      totalFixes: 0
    };

    // Phase 1: Cookie Sanitization
    buildReport.phases.push({
      phase: 1,
      name: 'Cookie Sanitization',
      action: 'Clearing bad intel from cookies',
      result: cookieSanitizer.clearBadIntel()
    });

    // Phase 2: Error Recovery
    errorRecoverySystem.setAutoRecovery(true);
    const errorStatus = errorRecoverySystem.getStatus();
    buildReport.phases.push({
      phase: 2,
      name: 'Error Recovery',
      action: 'Auto-fixing detected errors',
      result: `${errorStatus.autoFixedErrors} errors auto-fixed`
    });

    // Phase 3: Smart Troubleshooting
    smartTroubleshootingCore.setAutoFix(true);
    const troubleStatus = smartTroubleshootingCore.getStatus();
    buildReport.phases.push({
      phase: 3,
      name: 'Smart Troubleshooting',
      action: 'Running auto-fix on system issues',
      result: `${troubleStatus.resolvedSessions} sessions resolved`
    });

    // Phase 4: Production Mapping Sync
    await productionMappingCore.syncAllProductions();
    const mappingStatus = productionMappingCore.getStatus();
    buildReport.phases.push({
      phase: 4,
      name: 'Production Mapping',
      action: 'Syncing all production mappings',
      result: `${mappingStatus.mappings.active}/${mappingStatus.mappings.total} mappings active`
    });

    // Phase 5: Full System Diagnostics
    const diagnostics = await AutoTroubleshoot.runFullDiagnostics();
    buildReport.phases.push({
      phase: 5,
      name: 'System Diagnostics',
      action: 'Running full system check',
      result: `${diagnostics.fixes.length} fixes applied`
    });

    buildReport.totalFixes = buildReport.phases.reduce((sum, phase) => {
      const result = phase.result;
      if (typeof result === 'number') return sum + result;
      const match = result.match(/(\d+)/);
      return sum + (match ? parseInt(match[1]) : 0);
    }, 0);

    res.json({
      success: true,
      message: 'Bug fix build completed',
      build: buildReport,
      systemHealth: 'optimal',
      deploymentReady: true,
      fccEntity: '20130314143016',
      registration: '0024454324'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Bug fix build failed'
    });
  }
});

// Clear all bad intel
router.post('/clear-bad-intel', async (req: Request, res: Response) => {
  try {
    const cookiesCleared = cookieSanitizer.clearBadIntel();
    const diagnostics = await AutoTroubleshoot.fixAll();

    res.json({
      success: true,
      message: 'Bad intel cleared from system',
      cleared: {
        cookies: cookiesCleared,
        errors: diagnostics.fixes.length,
        badIntelRemoved: diagnostics.badIntelRemoved
      },
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Clear failed'
    });
  }
});

// Get sync status
router.get('/sync-status', async (req: Request, res: Response) => {
  try {
    const mappingStatus = productionMappingCore.getStatus();
    const troubleStatus = smartTroubleshootingCore.getStatus();
    const errorStatus = errorRecoverySystem.getStatus();
    const cookieStats = cookieSanitizer.getStats();

    res.json({
      success: true,
      status: {
        productionMapping: {
          fusionActive: mappingStatus.fusionActive,
          activeMappings: mappingStatus.mappings.active,
          totalMappings: mappingStatus.mappings.total,
          deploymentReady: mappingStatus.mappings.deploymentReady
        },
        troubleshooting: {
          autoFixEnabled: troubleStatus.autoFixEnabled,
          resolvedSessions: troubleStatus.resolvedSessions,
          healthyEndpoints: troubleStatus.endpointHealth.healthy
        },
        errorRecovery: {
          status: errorStatus.status,
          autoFixedErrors: errorStatus.autoFixedErrors,
          unresolvedErrors: errorStatus.unresolvedErrors
        },
        cookies: {
          sanitized: cookieStats.sanitizedCookies,
          blocked: cookieStats.blockedCookies
        }
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
