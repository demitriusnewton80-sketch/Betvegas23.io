
import { EventEmitter } from 'events';
import { smartCommunication } from '../utils/smart-communication.js';
import { appCore } from './AppCore.js';
import { smartTroubleshootingCore } from './SmartTroubleshootingCore.js';

interface TunnelConnection {
  id: string;
  type: 'network' | 'remote' | 'hosted';
  status: 'connected' | 'disconnected' | 'error' | 'recovering';
  endpoint: string;
  lastActive: number;
  retryCount: number;
  health: 'healthy' | 'degraded' | 'failed';
}

interface TunnelStats {
  totalConnections: number;
  activeConnections: number;
  failedConnections: number;
  bytesTransferred: number;
  uptime: number;
}

export class SmartTunnelCore extends EventEmitter {
  private static instance: SmartTunnelCore;
  private tunnelConnections: Map<string, TunnelConnection> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private startTime: number = Date.now();
  private bytesTransferred: number = 0;
  private autoRecoveryEnabled: boolean = true;

  private constructor() {
    super();
    this.initializeTunnel();
  }

  static getInstance(): SmartTunnelCore {
    if (!SmartTunnelCore.instance) {
      SmartTunnelCore.instance = new SmartTunnelCore();
    }
    return SmartTunnelCore.instance;
  }

  private initializeTunnel() {
    console.log('🌐 Initializing Smart Tunnel Core...');

    // Monitor tunnel health every 3 seconds
    this.monitoringInterval = setInterval(() => {
      this.monitorTunnelHealth();
      this.recoverNonResponsive();
      this.optimizeConnections();
    }, 3000);

    // Listen to communication events
    smartCommunication.on('message:failed', (message) => {
      this.handleFailedMessage(message);
    });

    // Listen to app core events
    appCore.on('connection:error', (data) => {
      this.handleConnectionError(data);
    });

    console.log('✅ Smart Tunnel Core initialized');
  }

  // Create tunnel connection
  createTunnelConnection(endpoint: string, type: TunnelConnection['type']): string {
    const connectionId = `tunnel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const connection: TunnelConnection = {
      id: connectionId,
      type,
      status: 'connected',
      endpoint,
      lastActive: Date.now(),
      retryCount: 0,
      health: 'healthy'
    };

    this.tunnelConnections.set(connectionId, connection);
    console.log(`🔗 Tunnel connection created: ${endpoint} (${type})`);
    this.emit('tunnel:connected', connection);

    return connectionId;
  }

  // Monitor tunnel health
  private async monitorTunnelHealth() {
    for (const [id, connection] of this.tunnelConnections) {
      const timeSinceActive = Date.now() - connection.lastActive;

      // Check for stale connections (no activity for 30 seconds)
      if (timeSinceActive > 30000) {
        connection.health = 'degraded';
        
        if (timeSinceActive > 60000) {
          connection.health = 'failed';
          connection.status = 'error';
          this.emit('tunnel:failed', connection);
        }
      }

      // Auto-recover failed connections
      if (connection.status === 'error' && this.autoRecoveryEnabled) {
        await this.recoverConnection(id);
      }
    }
  }

  // Recover non-responsive connections
  private async recoverNonResponsive() {
    const nonResponsive = Array.from(this.tunnelConnections.values())
      .filter(conn => conn.health === 'failed' || conn.status === 'error');

    for (const connection of nonResponsive) {
      console.log(`🔄 Recovering non-responsive tunnel: ${connection.endpoint}`);
      await this.recoverConnection(connection.id);
    }
  }

  // Recover specific connection
  private async recoverConnection(connectionId: string): Promise<void> {
    const connection = this.tunnelConnections.get(connectionId);
    if (!connection) return;

    connection.status = 'recovering';
    connection.retryCount++;

    console.log(`🔧 Recovery attempt ${connection.retryCount} for: ${connection.endpoint}`);

    try {
      // Test connection
      const response = await fetch(`http://0.0.0.0:5000${connection.endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        connection.status = 'connected';
        connection.health = 'healthy';
        connection.lastActive = Date.now();
        connection.retryCount = 0;
        console.log(`✅ Tunnel recovered: ${connection.endpoint}`);
        this.emit('tunnel:recovered', connection);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn(`⚠️ Recovery failed for ${connection.endpoint}`);
      
      if (connection.retryCount >= 5) {
        console.error(`❌ Max retries reached for ${connection.endpoint}, removing tunnel`);
        this.tunnelConnections.delete(connectionId);
        this.emit('tunnel:removed', connection);
      }
    }
  }

  // Optimize connections by removing duplicates
  private optimizeConnections() {
    const endpointMap = new Map<string, string[]>();

    // Group connections by endpoint
    this.tunnelConnections.forEach((connection, id) => {
      if (!endpointMap.has(connection.endpoint)) {
        endpointMap.set(connection.endpoint, []);
      }
      endpointMap.get(connection.endpoint)!.push(id);
    });

    // Remove duplicate connections
    endpointMap.forEach((ids, endpoint) => {
      if (ids.length > 1) {
        // Keep the most recently active, remove others
        const sorted = ids.sort((a, b) => {
          const connA = this.tunnelConnections.get(a)!;
          const connB = this.tunnelConnections.get(b)!;
          return connB.lastActive - connA.lastActive;
        });

        sorted.slice(1).forEach(id => {
          console.log(`🧹 Removing duplicate tunnel: ${endpoint}`);
          this.tunnelConnections.delete(id);
        });
      }
    });
  }

  // Handle failed message
  private handleFailedMessage(message: any) {
    console.log(`⚠️ Tunnel detected failed message: ${message.channel}`);
    
    // Create troubleshooting session
    smartTroubleshootingCore.setAutoFix(true);
  }

  // Handle connection error
  private handleConnectionError(data: any) {
    console.log(`⚠️ Tunnel connection error: ${data.id}`);
    
    // Find and recover affected tunnel
    this.tunnelConnections.forEach((connection) => {
      if (connection.id === data.id) {
        connection.status = 'error';
        this.recoverConnection(connection.id);
      }
    });
  }

  // Update connection activity
  updateActivity(connectionId: string, bytesTransferred: number = 0) {
    const connection = this.tunnelConnections.get(connectionId);
    if (connection) {
      connection.lastActive = Date.now();
      connection.health = 'healthy';
      connection.status = 'connected';
      this.bytesTransferred += bytesTransferred;
    }
  }

  // Host all network aspects through tunnel
  hostAllAspects() {
    console.log('🌍 Hosting all network aspects through smart tunnel...');

    const aspects = [
      { endpoint: '/streaming/streams', type: 'network' as const },
      { endpoint: '/sportsbook/games', type: 'hosted' as const },
      { endpoint: '/smart-system/status', type: 'remote' as const },
      { endpoint: '/error-recovery/status', type: 'network' as const },
      { endpoint: '/core/status', type: 'hosted' as const },
      { endpoint: '/api-troubleshooting/status', type: 'remote' as const }
    ];

    const connectionIds = aspects.map(aspect => 
      this.createTunnelConnection(aspect.endpoint, aspect.type)
    );

    console.log(`✅ ${connectionIds.length} network aspects hosted through tunnel`);
    return connectionIds;
  }

  // Get tunnel statistics
  getStats(): TunnelStats {
    const connections = Array.from(this.tunnelConnections.values());

    return {
      totalConnections: connections.length,
      activeConnections: connections.filter(c => c.status === 'connected').length,
      failedConnections: connections.filter(c => c.status === 'error').length,
      bytesTransferred: this.bytesTransferred,
      uptime: Date.now() - this.startTime
    };
  }

  // Get all tunnel connections
  getConnections() {
    return Array.from(this.tunnelConnections.values());
  }

  // Get connection by ID
  getConnection(connectionId: string) {
    return this.tunnelConnections.get(connectionId);
  }

  // Enable/disable auto recovery
  setAutoRecovery(enabled: boolean) {
    this.autoRecoveryEnabled = enabled;
    console.log(`Tunnel auto-recovery ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Shutdown tunnel
  shutdown() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.tunnelConnections.clear();
    console.log('🔌 Smart Tunnel Core shutdown');
  }
}

export const smartTunnelCore = SmartTunnelCore.getInstance();
