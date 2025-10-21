
import { smartTroubleshootingCore } from '../core/SmartTroubleshootingCore.js';
import { errorRecoverySystem } from '../core/ErrorRecoverySystem.js';
import { productionMappingCore } from '../core/ProductionMappingCore.js';
import { appCore } from '../core/AppCore.js';
import { cookieSanitizer } from './cookie-sanitizer.js';

export class AutoTroubleshoot {
  static async runFullDiagnostics() {
    console.log('🔍 Running full system diagnostics...');
    
    const results = {
      timestamp: new Date().toISOString(),
      issues: [] as string[],
      fixes: [] as string[],
      errors: [] as any[],
      cookiesSanitized: 0,
      badIntelRemoved: 0
    };

    // 0. Sanitize cookies and remove bad intel
    const cookieStats = cookieSanitizer.getStats();
    if (cookieStats.blockedCookies > 0) {
      results.issues.push(`${cookieStats.blockedCookies} bad intel cookie(s) detected`);
      const cleared = cookieSanitizer.clearBadIntel();
      results.fixes.push(`Removed ${cleared} bad intel cookie(s)`);
      results.badIntelRemoved = cleared;
    }
    results.cookiesSanitized = cookieStats.sanitizedCookies;

    // 1. Check Smart Troubleshooting status
    const troubleStatus = smartTroubleshootingCore.getStatus();
    if (!troubleStatus.autoFixEnabled) {
      smartTroubleshootingCore.setAutoFix(true);
      results.fixes.push('Enabled auto-fix for Smart Troubleshooting');
    }

    // 2. Check endpoint health
    const endpoints = smartTroubleshootingCore.getEndpointHealth();
    const failedEndpoints = endpoints.filter(e => e.status === 'failed');
    
    if (failedEndpoints.length > 0) {
      results.issues.push(`${failedEndpoints.length} endpoint(s) failing`);
      failedEndpoints.forEach(ep => {
        results.issues.push(`- ${ep.endpoint}: ${ep.consecutiveFailures} failures`);
      });
    }

    // 3. Check error recovery
    const errorStatus = errorRecoverySystem.getStatus();
    if (!errorStatus.autoRecoveryEnabled) {
      errorRecoverySystem.setAutoRecovery(true);
      results.fixes.push('Enabled auto-recovery for Error Recovery System');
    }

    if (errorStatus.unresolvedErrors > 0) {
      results.issues.push(`${errorStatus.unresolvedErrors} unresolved error(s)`);
      
      // Get and attempt to fix errors
      const errors = errorRecoverySystem.getErrors();
      const unresolved = errors.filter(e => !e.resolved);
      
      unresolved.forEach(error => {
        errorRecoverySystem.handleError({
          type: error.type,
          severity: 'low',
          message: `Auto-fix retry: ${error.message}`,
          source: 'AutoTroubleshoot'
        });
      });
      
      results.fixes.push(`Queued ${unresolved.length} error(s) for recovery`);
    }

    // 4. Check production mapping
    const mappingStatus = productionMappingCore.getStatus();
    if (mappingStatus.mappings.failed > 0) {
      results.issues.push(`${mappingStatus.mappings.failed} production mapping(s) failed`);
      
      // Trigger resync
      await productionMappingCore.syncAllProductions();
      results.fixes.push('Re-synced production mappings');
    }

    // 5. Check app core health
    const appHealth = appCore.getSystemHealth();
    if (appHealth.errorConnections > 0) {
      results.issues.push(`${appHealth.errorConnections} connection(s) in error state`);
      
      // Reset connections
      appCore.broadcastMessage('connection:reset', {
        timestamp: Date.now(),
        source: 'AutoTroubleshoot'
      });
      results.fixes.push('Reset error connections');
    }

    // 6. Check environment conditions
    const conditions = productionMappingCore.getAllConditions();
    const degraded = conditions.filter(c => c.status === 'degraded' || c.status === 'critical');
    
    if (degraded.length > 0) {
      results.issues.push(`${degraded.length} environment condition(s) degraded`);
      degraded.forEach(c => {
        results.issues.push(`- ${c.parameter}: ${c.status}`);
      });
    }

    console.log('✅ Diagnostics complete');
    console.log(`Issues found: ${results.issues.length}`);
    console.log(`Fixes applied: ${results.fixes.length}`);

    return results;
  }

  static async fixAll() {
    console.log('🛠️ Running auto-fix for all systems...');
    
    // Clear bad intel cookies first
    console.log('🧹 Clearing bad intel from cookies...');
    cookieSanitizer.clearBadIntel();
    
    // Enable all auto-recovery
    smartTroubleshootingCore.setAutoFix(true);
    errorRecoverySystem.setAutoRecovery(true);

    // Run diagnostics
    const diagnostics = await this.runFullDiagnostics();

    // Fuse production mappings
    await productionMappingCore.fuseAllProductionsToEntity();

    // Broadcast system recovery
    appCore.broadcastMessage('system:recovery', {
      timestamp: Date.now(),
      source: 'AutoTroubleshoot',
      diagnostics
    });

    console.log('✅ Auto-fix complete');
    return diagnostics;
  }
}
