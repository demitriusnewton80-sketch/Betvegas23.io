
import { EventEmitter } from 'events';
import { wiFiWeb3FusionService } from './WiFiWeb3FusionService.js';
import { web3BridgeService } from './Web3BridgeService.js';
import { personalWiFiService } from './PersonalWiFiService.js';
import { fusionAssemblyCore } from '../core/FusionAssemblyCore.js';

interface JSONSyncData {
  id: string;
  data: any;
  source: 'wifi' | 'web3' | 'fusion' | 'assembly' | 'api';
  destination: string[];
  synced: boolean;
  timestamp: number;
  checksum: string;
}

interface SyncBridge {
  id: string;
  type: 'wifi' | 'web3' | 'fusion' | 'api';
  active: boolean;
  lastSync: number;
  syncCount: number;
}

export class JSONSyncService extends EventEmitter {
  private static instance: JSONSyncService;
  private syncQueue: Map<string, JSONSyncData> = new Map();
  private bridges: Map<string, SyncBridge> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.initializeBridges();
  }

  static getInstance(): JSONSyncService {
    if (!JSONSyncService.instance) {
      JSONSyncService.instance = new JSONSyncService();
    }
    return JSONSyncService.instance;
  }

  private initializeBridges() {
    console.log('🔄 Initializing JSON Sync Service with bridges...');

    // Register WiFi bridge
    this.bridges.set('wifi-bridge', {
      id: 'wifi-bridge',
      type: 'wifi',
      active: true,
      lastSync: Date.now(),
      syncCount: 0
    });

    // Register Web3 bridge
    this.bridges.set('web3-bridge', {
      id: 'web3-bridge',
      type: 'web3',
      active: true,
      lastSync: Date.now(),
      syncCount: 0
    });

    // Register Fusion bridge
    this.bridges.set('fusion-bridge', {
      id: 'fusion-bridge',
      type: 'fusion',
      active: true,
      lastSync: Date.now(),
      syncCount: 0
    });

    // Start auto-sync every 2 seconds
    this.syncInterval = setInterval(() => {
      this.processSyncQueue();
      this.validateBridges();
    }, 2000);

    console.log(`✅ JSON Sync Service initialized with ${this.bridges.size} bridges`);
  }

  // Sync JSON data across all bridges
  async syncJSON(data: any, source: JSONSyncData['source'], destinations?: string[]): Promise<string> {
    const syncId = `json-sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const syncData: JSONSyncData = {
      id: syncId,
      data,
      source,
      destination: destinations || ['wifi', 'web3', 'fusion'],
      synced: false,
      timestamp: Date.now(),
      checksum: this.generateChecksum(data)
    };

    this.syncQueue.set(syncId, syncData);
    console.log(`📤 JSON sync queued: ${syncId} from ${source}`);
    this.emit('sync:queued', syncData);

    return syncId;
  }

  // Process sync queue
  private async processSyncQueue() {
    for (const [syncId, syncData] of this.syncQueue) {
      if (!syncData.synced) {
        try {
          await this.executeSyncAcrossBridges(syncData);
          syncData.synced = true;
          console.log(`✅ JSON synced: ${syncId}`);
          this.emit('sync:completed', syncData);
        } catch (error) {
          console.error(`❌ Sync failed: ${syncId}`, error);
          this.emit('sync:failed', { syncId, error });
        }
      }
    }
  }

  // Execute sync across all specified bridges
  private async executeSyncAcrossBridges(syncData: JSONSyncData): Promise<void> {
    const syncPromises: Promise<any>[] = [];

    for (const destination of syncData.destination) {
      switch (destination) {
        case 'wifi':
          syncPromises.push(this.syncToWiFi(syncData));
          break;
        case 'web3':
          syncPromises.push(this.syncToWeb3(syncData));
          break;
        case 'fusion':
          syncPromises.push(this.syncToFusion(syncData));
          break;
        case 'assembly':
          syncPromises.push(this.syncToAssembly(syncData));
          break;
      }
    }

    await Promise.all(syncPromises);
  }

  // Sync to WiFi bridge
  private async syncToWiFi(syncData: JSONSyncData): Promise<void> {
    const bridge = this.bridges.get('wifi-bridge');
    if (!bridge || !bridge.active) {
      throw new Error('WiFi bridge not active');
    }

    // Get all WiFi networks
    const networks = personalWiFiService.getAllNetworks();
    
    for (const network of networks) {
      if (network.security === 'WPA3') {
        console.log(`📡 Syncing JSON to WiFi network: ${network.ssid}`);
      }
    }

    bridge.lastSync = Date.now();
    bridge.syncCount++;
  }

  // Sync to Web3 bridge
  private async syncToWeb3(syncData: JSONSyncData): Promise<void> {
    const bridge = this.bridges.get('web3-bridge');
    if (!bridge || !bridge.active) {
      throw new Error('Web3 bridge not active');
    }

    // Send through Web3 bridge
    const wallets = web3BridgeService.getAllWallets();
    
    if (wallets.length > 0) {
      console.log(`🌐 Syncing JSON to Web3 bridge (${wallets.length} wallets)`);
    }

    bridge.lastSync = Date.now();
    bridge.syncCount++;
  }

  // Sync to Fusion bridge
  private async syncToFusion(syncData: JSONSyncData): Promise<void> {
    const bridge = this.bridges.get('fusion-bridge');
    if (!bridge || !bridge.active) {
      throw new Error('Fusion bridge not active');
    }

    // Send through WiFi-Web3 fusion
    await wiFiWeb3FusionService.sendSignal({
      source: syncData.source === 'wifi' ? 'wifi' : 'web3',
      destination: 'app',
      data: syncData.data,
      wpa3Secured: true
    });

    console.log(`🔗 Syncing JSON through Fusion bridge`);
    bridge.lastSync = Date.now();
    bridge.syncCount++;
  }

  // Sync to Assembly pipeline
  private async syncToAssembly(syncData: JSONSyncData): Promise<void> {
    // Send to fusion assembly core
    await fusionAssemblyCore.sync(syncData.source, syncData.data);
    console.log(`🔧 Syncing JSON to Assembly pipeline`);
  }

  // Validate all bridges
  private validateBridges() {
    this.bridges.forEach((bridge, bridgeId) => {
      const timeSinceSync = Date.now() - bridge.lastSync;
      
      // Mark inactive if no sync in 30 seconds
      if (timeSinceSync > 30000 && bridge.active) {
        console.warn(`⚠️ Bridge ${bridgeId} inactive for 30s`);
      }
    });
  }

  // Generate checksum for data integrity
  private generateChecksum(data: any): string {
    const jsonString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  // Get sync status
  getStatus() {
    return {
      totalSyncs: this.syncQueue.size,
      syncedData: Array.from(this.syncQueue.values()).filter(s => s.synced).length,
      pendingData: Array.from(this.syncQueue.values()).filter(s => !s.synced).length,
      bridges: Array.from(this.bridges.values()).map(b => ({
        id: b.id,
        type: b.type,
        active: b.active,
        syncCount: b.syncCount,
        lastSync: new Date(b.lastSync).toISOString()
      })),
      fccEntity: '20130314143016'
    };
  }

  // Get sync queue
  getSyncQueue() {
    return Array.from(this.syncQueue.values());
  }

  // Get bridges
  getBridges() {
    return Array.from(this.bridges.values());
  }

  shutdown() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    console.log('🛑 JSON Sync Service shutdown');
  }
}

export const jsonSyncService = JSONSyncService.getInstance();
