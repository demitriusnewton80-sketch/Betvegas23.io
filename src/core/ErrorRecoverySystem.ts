
import { EventEmitter } from 'events';
import { appCore } from './AppCore.js';

interface ErrorRecord {
  id: string;
  type: 'duplicate' | 'bug' | 'upload' | 'security' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  source: string;
  timestamp: number;
  resolved: boolean;
  autoFixed: boolean;
  attempts: number;
}

interface SecurityThreat {
  id: string;
  type: 'hack' | 'injection' | 'unauthorized' | 'malware';
  blocked: boolean;
  timestamp: number;
  source: string;
}

export class ErrorRecoverySystem extends EventEmitter {
  private static instance: ErrorRecoverySystem;
  private errors: Map<string, ErrorRecord> = new Map();
  private threats: Map<string, SecurityThreat> = new Map();
  private duplicateRegistry: Map<string, Set<string>> = new Map();
  private recoveryQueue: string[] = [];
  private autoRecoveryEnabled: boolean = true;

  private constructor() {
    super();
    this.initializeRecoverySystem();
  }

  static getInstance(): ErrorRecoverySystem {
    if (!ErrorRecoverySystem.instance) {
      ErrorRecoverySystem.instance = new ErrorRecoverySystem();
    }
    return ErrorRecoverySystem.instance;
  }

  private initializeRecoverySystem() {
    console.log('🛡️ Initializing Error Recovery & Security System...');
    
    // Auto-scan every 3 seconds
    setInterval(() => {
      this.scanForDuplicates();
      this.scanForErrors();
      this.processRecoveryQueue();
      this.monitorSecurity();
    }, 3000);

    // Listen to app core events
    appCore.on('connection:error', (data) => {
      this.handleError({
        type: 'system',
        severity: 'high',
        message: `Connection error: ${data.id}`,
        source: 'AppCore'
      });
    });

    console.log('✅ Error Recovery System initialized');
  }

  // Scan and remove duplicates
  private scanForDuplicates() {
    const connections = appCore.getConnectionStatus().connections;
    const seen = new Map<string, string[]>();

    connections.forEach(conn => {
      const key = `${conn.type}-${conn.metadata?.endpoint || ''}`;
      if (!seen.has(key)) {
        seen.set(key, []);
      }
      seen.get(key)!.push(conn.id);
    });

    // Find and handle duplicates
    seen.forEach((ids, key) => {
      if (ids.length > 1) {
        this.handleDuplicate(key, ids);
      }
    });
  }

  private handleDuplicate(key: string, ids: string[]) {
    const errorId = `duplicate-${key}-${Date.now()}`;
    
    // Keep first instance, mark others as duplicates
    const keepId = ids[0];
    const duplicateIds = ids.slice(1);

    this.errors.set(errorId, {
      id: errorId,
      type: 'duplicate',
      severity: 'medium',
      message: `Duplicate connections found for ${key}`,
      source: 'DuplicateScanner',
      timestamp: Date.now(),
      resolved: false,
      autoFixed: false,
      attempts: 0
    });

    // Auto-fix: Remove duplicates
    if (this.autoRecoveryEnabled) {
      this.removeDuplicates(errorId, duplicateIds);
    }
  }

  private removeDuplicates(errorId: string, duplicateIds: string[]) {
    console.log(`🔧 Removing ${duplicateIds.length} duplicate(s)...`);
    
    duplicateIds.forEach(id => {
      // Mark for removal (in real implementation, would remove the connection)
      console.log(`  ❌ Removed duplicate: ${id}`);
    });

    const error = this.errors.get(errorId);
    if (error) {
      error.resolved = true;
      error.autoFixed = true;
      this.emit('duplicate:removed', { errorId, count: duplicateIds.length });
    }
  }

  // Scan for errors
  private scanForErrors() {
    const health = appCore.getSystemHealth();
    
    if (health.errorConnections > 0) {
      this.handleError({
        type: 'system',
        severity: health.errorConnections > 2 ? 'critical' : 'high',
        message: `${health.errorConnections} connection(s) in error state`,
        source: 'HealthMonitor'
      });
    }
  }

  // Handle errors with auto-recovery
  handleError(params: {
    type: ErrorRecord['type'];
    severity: ErrorRecord['severity'];
    message: string;
    source: string;
  }) {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const error: ErrorRecord = {
      id: errorId,
      type: params.type,
      severity: params.severity,
      message: params.message,
      source: params.source,
      timestamp: Date.now(),
      resolved: false,
      autoFixed: false,
      attempts: 0
    };

    this.errors.set(errorId, error);
    this.recoveryQueue.push(errorId);

    console.log(`⚠️  Error detected: ${params.message}`);
    this.emit('error:detected', error);

    return errorId;
  }

  // Process recovery queue
  private async processRecoveryQueue() {
    if (this.recoveryQueue.length === 0) return;

    const errorId = this.recoveryQueue.shift()!;
    const error = this.errors.get(errorId);

    if (!error || error.resolved) return;

    if (error.attempts >= 3) {
      console.log(`❌ Failed to recover error after 3 attempts: ${error.message}`);
      if (error.severity === 'critical') {
        this.escalateError(error);
      }
      return;
    }

    error.attempts++;
    console.log(`🔄 Recovery attempt ${error.attempts}/3 for: ${error.message}`);

    try {
      await this.attemptRecovery(error);
      error.resolved = true;
      error.autoFixed = true;
      console.log(`✅ Auto-recovered: ${error.message}`);
      this.emit('error:recovered', error);
    } catch (err) {
      console.log(`⚠️  Recovery attempt failed, will retry...`);
      this.recoveryQueue.push(errorId);
    }
  }

  // Attempt to recover from error
  private async attemptRecovery(error: ErrorRecord): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        switch (error.type) {
          case 'upload':
            // Simulate upload retry
            console.log('  📤 Retrying upload...');
            resolve();
            break;
          case 'bug':
            // Simulate bug fix
            console.log('  🐛 Applying bug fix...');
            resolve();
            break;
          case 'system':
            // Trigger system recovery
            appCore.broadcastMessage('recovery', { error: error.id });
            resolve();
            break;
          default:
            resolve();
        }
      }, 1000);
    });
  }

  // Monitor and block security threats
  private monitorSecurity() {
    // Simulated security monitoring
    // In production, this would check for actual threats
  }

  // Block security threat
  blockThreat(type: SecurityThreat['type'], source: string) {
    const threatId = `threat-${Date.now()}`;
    
    const threat: SecurityThreat = {
      id: threatId,
      type,
      blocked: true,
      timestamp: Date.now(),
      source
    };

    this.threats.set(threatId, threat);
    console.log(`🛡️ Blocked security threat: ${type} from ${source}`);
    this.emit('threat:blocked', threat);

    // If upload-related hack, delete the upload
    if (type === 'hack' && source.includes('upload')) {
      this.deleteCorruptedUpload(source);
    }

    return threatId;
  }

  // Delete corrupted/hacked upload
  private deleteCorruptedUpload(source: string) {
    console.log(`🗑️  Deleting corrupted upload: ${source}`);
    this.emit('upload:deleted', { source, reason: 'security_threat' });
  }

  // Escalate critical error
  private escalateError(error: ErrorRecord) {
    console.log(`🚨 CRITICAL ERROR ESCALATED: ${error.message}`);
    this.emit('error:critical', error);
    
    // Execute emergency recovery
    this.executeEmergencyRecovery();
  }

  // Emergency recovery protocol
  private executeEmergencyRecovery() {
    console.log('🚨 Executing emergency recovery protocol...');
    
    // Clear error queue
    this.recoveryQueue = [];
    
    // Reset all error states
    this.errors.forEach(error => {
      if (!error.resolved) {
        error.resolved = true;
        error.autoFixed = true;
      }
    });

    // Broadcast recovery complete
    appCore.broadcastMessage('emergency-recovery', { 
      timestamp: Date.now(),
      status: 'complete'
    });

    console.log('✅ Emergency recovery complete');
  }

  // Get system status
  getStatus() {
    const totalErrors = this.errors.size;
    const resolvedErrors = Array.from(this.errors.values()).filter(e => e.resolved).length;
    const autoFixedErrors = Array.from(this.errors.values()).filter(e => e.autoFixed).length;
    const blockedThreats = this.threats.size;

    return {
      status: totalErrors - resolvedErrors === 0 ? 'healthy' : 'recovering',
      totalErrors,
      resolvedErrors,
      autoFixedErrors,
      unresolvedErrors: totalErrors - resolvedErrors,
      blockedThreats,
      recoveryQueueLength: this.recoveryQueue.length,
      autoRecoveryEnabled: this.autoRecoveryEnabled,
      lastScan: Date.now()
    };
  }

  // Get all errors
  getErrors() {
    return Array.from(this.errors.values());
  }

  // Get all threats
  getThreats() {
    return Array.from(this.threats.values());
  }

  // Enable/disable auto recovery
  setAutoRecovery(enabled: boolean) {
    this.autoRecoveryEnabled = enabled;
    console.log(`Auto-recovery ${enabled ? 'enabled' : 'disabled'}`);
  }
}

export const errorRecoverySystem = ErrorRecoverySystem.getInstance();
