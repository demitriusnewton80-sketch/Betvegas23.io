
import { EventEmitter } from 'events';
import { appCore } from './AppCore.js';
import { smartTroubleshootingCore } from './SmartTroubleshootingCore.js';
import { errorRecoverySystem } from './ErrorRecoverySystem.js';

interface SyncData {
  id: string;
  source: string;
  payload: any;
  timestamp: number;
  synced: boolean;
}

interface Signal {
  id: string;
  syncId: string;
  type: 'wifi' | 'web3' | 'app' | 'system';
  data: any;
  processed: boolean;
  timestamp: number;
}

interface Assembly {
  id: string;
  signalIds: string[];
  components: any[];
  status: 'pending' | 'assembling' | 'completed' | 'failed';
  result: any;
  timestamp: number;
}

export class FusionAssemblyCore extends EventEmitter {
  private static instance: FusionAssemblyCore;
  private syncQueue: Map<string, SyncData> = new Map();
  private signalQueue: Map<string, Signal> = new Map();
  private assemblyQueue: Map<string, Assembly> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.initializeFusion();
  }

  static getInstance(): FusionAssemblyCore {
    if (!FusionAssemblyCore.instance) {
      FusionAssemblyCore.instance = new FusionAssemblyCore();
    }
    return FusionAssemblyCore.instance;
  }

  private initializeFusion() {
    console.log('🔗 Initializing Fusion Assembly Core...');

    // Process pipeline every 2 seconds
    this.processingInterval = setInterval(() => {
      this.processSync();
      this.processSignals();
      this.processAssembly();
    }, 2000);

    // Listen to app core events
    appCore.on('broadcast:fusion:sync', (data) => {
      this.handleIncomingSync(data);
    });

    console.log('✅ Fusion Assembly Core initialized');
  }

  // Step 1: Sync - Accept and validate incoming data
  async sync(source: string, payload: any): Promise<string> {
    const syncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const syncData: SyncData = {
      id: syncId,
      source,
      payload,
      timestamp: Date.now(),
      synced: false
    };

    this.syncQueue.set(syncId, syncData);
    console.log(`📥 Sync queued: ${syncId} from ${source}`);
    this.emit('sync:queued', syncData);

    return syncId;
  }

  // Process sync queue - validate and prepare for signal conversion
  private processSync() {
    this.syncQueue.forEach((sync, syncId) => {
      if (!sync.synced) {
        try {
          // Validate sync data
          if (this.validateSync(sync)) {
            sync.synced = true;
            
            // Convert to signal
            this.convertToSignal(sync);
            
            this.emit('sync:completed', sync);
            console.log(`✅ Sync completed: ${syncId}`);
          }
        } catch (error) {
          console.error(`❌ Sync failed: ${syncId}`, error);
          errorRecoverySystem.handleError({
            type: 'system',
            severity: 'medium',
            message: `Sync failed: ${syncId}`,
            source: 'FusionAssembly'
          });
        }
      }
    });
  }

  // Step 2: Signal - Convert synced data to processable signals
  private convertToSignal(sync: SyncData) {
    const signalId = `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Determine signal type based on source
    let signalType: Signal['type'] = 'system';
    if (sync.source.includes('wifi')) signalType = 'wifi';
    else if (sync.source.includes('web3')) signalType = 'web3';
    else if (sync.source.includes('app')) signalType = 'app';

    const signal: Signal = {
      id: signalId,
      syncId: sync.id,
      type: signalType,
      data: sync.payload,
      processed: false,
      timestamp: Date.now()
    };

    this.signalQueue.set(signalId, signal);
    console.log(`📡 Signal created: ${signalId} (${signalType})`);
    this.emit('signal:created', signal);
  }

  // Process signal queue - prepare signals for assembly
  private processSignals() {
    const unprocessedSignals: Signal[] = [];

    this.signalQueue.forEach((signal) => {
      if (!signal.processed) {
        unprocessedSignals.push(signal);
      }
    });

    // Group signals for assembly (batch by type or time window)
    if (unprocessedSignals.length >= 1) {
      this.createAssembly(unprocessedSignals);
    }
  }

  // Step 3: Assembly - Combine signals into operational units
  private createAssembly(signals: Signal[]) {
    const assemblyId = `assembly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const assembly: Assembly = {
      id: assemblyId,
      signalIds: signals.map(s => s.id),
      components: [],
      status: 'pending',
      result: null,
      timestamp: Date.now()
    };

    this.assemblyQueue.set(assemblyId, assembly);
    
    // Mark signals as processed
    signals.forEach(signal => {
      signal.processed = true;
    });

    console.log(`🔧 Assembly created: ${assemblyId} with ${signals.length} signal(s)`);
    this.emit('assembly:created', assembly);
  }

  // Process assembly queue - execute assembly operations
  private async processAssembly() {
    for (const [assemblyId, assembly] of this.assemblyQueue.entries()) {
      if (assembly.status === 'pending') {
        assembly.status = 'assembling';
        
        try {
          // Collect signal data
          const signalData = assembly.signalIds
            .map(id => this.signalQueue.get(id))
            .filter(s => s !== undefined)
            .map(s => s!.data);

          // Assemble components
          const components = await this.assembleComponents(signalData);
          assembly.components = components;

          // Generate result
          const result = await this.executeAssembly(assembly);
          assembly.result = result;
          assembly.status = 'completed';

          console.log(`✅ Assembly completed: ${assemblyId}`);
          this.emit('assembly:completed', assembly);

          // Broadcast to system
          appCore.broadcastMessage('assembly:ready', {
            assemblyId,
            components: assembly.components.length,
            result
          });

        } catch (error) {
          assembly.status = 'failed';
          console.error(`❌ Assembly failed: ${assemblyId}`, error);
          
          errorRecoverySystem.handleError({
            type: 'system',
            severity: 'high',
            message: `Assembly failed: ${assemblyId}`,
            source: 'FusionAssembly'
          });
        }
      }
    }
  }

  // Assemble components from signal data
  private async assembleComponents(signalData: any[]): Promise<any[]> {
    const components: any[] = [];

    for (const data of signalData) {
      // Create component from data
      const component = {
        id: `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        data,
        type: this.detectComponentType(data),
        assembled: true,
        timestamp: Date.now()
      };

      components.push(component);
    }

    return components;
  }

  // Execute assembly operation
  private async executeAssembly(assembly: Assembly): Promise<any> {
    const systemHealth = appCore.getSystemHealth();
    const troubleStatus = smartTroubleshootingCore.getStatus();

    return {
      assemblyId: assembly.id,
      totalComponents: assembly.components.length,
      componentTypes: this.getComponentTypes(assembly.components),
      systemIntegration: {
        health: systemHealth.overall,
        activeConnections: systemHealth.activeConnections,
        troubleshootingActive: troubleStatus.autoFixEnabled
      },
      operationalStatus: 'ready',
      timestamp: new Date().toISOString(),
      fccEntity: '20130314143016'
    };
  }

  // Helper methods
  private validateSync(sync: SyncData): boolean {
    return sync.source && sync.payload !== null && sync.payload !== undefined;
  }

  private detectComponentType(data: any): string {
    if (typeof data === 'object') {
      if (data.walletAddress) return 'web3';
      if (data.ssid) return 'wifi';
      if (data.endpoint) return 'api';
    }
    return 'generic';
  }

  private getComponentTypes(components: any[]): Record<string, number> {
    const types: Record<string, number> = {};
    components.forEach(c => {
      types[c.type] = (types[c.type] || 0) + 1;
    });
    return types;
  }

  private handleIncomingSync(data: any) {
    if (data.message) {
      this.sync(data.source || 'broadcast', data.message);
    }
  }

  // Public API
  getStatus() {
    return {
      sync: {
        total: this.syncQueue.size,
        synced: Array.from(this.syncQueue.values()).filter(s => s.synced).length,
        pending: Array.from(this.syncQueue.values()).filter(s => !s.synced).length
      },
      signals: {
        total: this.signalQueue.size,
        processed: Array.from(this.signalQueue.values()).filter(s => s.processed).length,
        pending: Array.from(this.signalQueue.values()).filter(s => !s.processed).length
      },
      assemblies: {
        total: this.assemblyQueue.size,
        completed: Array.from(this.assemblyQueue.values()).filter(a => a.status === 'completed').length,
        assembling: Array.from(this.assemblyQueue.values()).filter(a => a.status === 'assembling').length,
        failed: Array.from(this.assemblyQueue.values()).filter(a => a.status === 'failed').length
      },
      fccEntity: '20130314143016'
    };
  }

  getSyncQueue() {
    return Array.from(this.syncQueue.values());
  }

  getSignalQueue() {
    return Array.from(this.signalQueue.values());
  }

  getAssemblyQueue() {
    return Array.from(this.assemblyQueue.values());
  }

  shutdown() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    console.log('🛑 Fusion Assembly Core shutdown');
  }
}

export const fusionAssemblyCore = FusionAssemblyCore.getInstance();
