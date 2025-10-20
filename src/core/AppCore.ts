import { EventEmitter } from 'events';

interface CoreConfig {
  port: number;
  host: string;
  environment: string;
  fccEntity: string;
}

interface ConnectionState {
  id: string;
  type: 'sportsbook' | 'streaming' | 'ps5' | 'wifi' | 'backup' | 'sso';
  status: 'connected' | 'disconnected' | 'error';
  lastHeartbeat: number;
  metadata: Record<string, any>;
}

export class AppCore extends EventEmitter {
  private static instance: AppCore;
  private connections: Map<string, ConnectionState>;
  private heartbeatInterval: NodeJS.Timeout | null;
  private config: CoreConfig;

  private constructor() {
    super();
    this.connections = new Map();
    this.heartbeatInterval = null;
    this.config = {
      port: parseInt(process.env.PORT || '5000'),
      host: '0.0.0.0',
      environment: process.env.NODE_ENV || 'development',
      fccEntity: '20130314143016'
    };
  }

  static getInstance(): AppCore {
    if (!AppCore.instance) {
      AppCore.instance = new AppCore();
    }
    return AppCore.instance;
  }

  initialize() {
    console.log('🚀 Initializing App Core...');
    this.startHeartbeat();
    this.registerCoreConnections();
    this.setupEventHandlers();
    console.log('✅ App Core initialized successfully');
  }

  private registerCoreConnections() {
    const coreConnections: ConnectionState[] = [
      {
        id: 'sportsbook-core',
        type: 'sportsbook',
        status: 'connected',
        lastHeartbeat: Date.now(),
        metadata: { endpoint: '/sportsbook/games' }
      },
      {
        id: 'streaming-core',
        type: 'streaming',
        status: 'connected',
        lastHeartbeat: Date.now(),
        metadata: { endpoint: '/streaming/partners' }
      },
      {
        id: 'ps5-core',
        type: 'ps5',
        status: 'connected',
        lastHeartbeat: Date.now(),
        metadata: { endpoint: '/ps5/games' }
      },
      {
        id: 'wifi-core',
        type: 'wifi',
        status: 'connected',
        lastHeartbeat: Date.now(),
        metadata: { endpoint: '/wifi-infusion/status' }
      },
      {
        id: 'backup-core',
        type: 'backup',
        status: 'connected',
        lastHeartbeat: Date.now(),
        metadata: { endpoint: '/backup/status' }
      },
      {
        id: 'sso-core',
        type: 'sso',
        status: 'connected',
        lastHeartbeat: Date.now(),
        metadata: { endpoint: '/sso-plugin/plugins' }
      },
      {
        id: 'transformer-bridge',
        type: 'wifi',
        status: 'connected',
        lastHeartbeat: Date.now(),
        metadata: { endpoint: '/transformer/status', bridgeType: 'web3-delivery' }
      },
      {
        id: 'ai-core',
        type: 'sportsbook',
        status: 'connected',
        lastHeartbeat: Date.now(),
        metadata: { endpoint: '/ai/status', service: 'core-ai' }
      }
    ];

    coreConnections.forEach(conn => {
      this.connections.set(conn.id, conn);
    });
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      let recoveredCount = 0;

      this.connections.forEach((conn, connId) => {
        const timeSinceLastBeat = Date.now() - conn.lastHeartbeat;

        if (timeSinceLastBeat > 30000) {
          if (conn.status !== 'error') {
            conn.status = 'error';
            this.emit('connection:error', { id: connId, connection: conn });
          }
        } else {
          if (conn.status === 'error') {
            recoveredCount++;
          }
          conn.status = 'connected';
          conn.lastHeartbeat = Date.now();
          this.emit('connection:updated', {
            id: connId,
            connection: conn
          });
        }
      });

      const activeCount = this.getActiveConnectionCount();

      if (recoveredCount > 0) {
        console.log(`✅ Recovered ${recoveredCount} connection(s)`);
      }

      this.emit('heartbeat', {
        timestamp: Date.now(),
        activeConnections: activeCount,
        totalConnections: this.connections.size,
        healthPercentage: Math.round((activeCount / this.connections.size) * 100)
      });
    }, 5000);
  }

  private setupEventHandlers() {
    this.on('connection:error', ({ id, connection }) => {
      console.error(`❌ Connection error: ${id}`);
      this.reconnect(id);
    });

    this.on('heartbeat', ({ activeConnections }) => {
      if (activeConnections < this.connections.size) {
        console.warn(`⚠️  Some connections inactive: ${activeConnections}/${this.connections.size}`);
      }
    });
  }

  private reconnect(connectionId: string) {
    const conn = this.connections.get(connectionId);
    if (conn) {
      conn.status = 'connected';
      conn.lastHeartbeat = Date.now();
      console.log(`🔄 Reconnected: ${connectionId}`);
      this.emit('connection:restored', { id: connectionId, connection: conn });
    }
  }

  getActiveConnectionCount(): number {
    return Array.from(this.connections.values()).filter(c => c.status === 'connected').length;
  }

  getConnectionStatus() {
    return {
      total: this.connections.size,
      active: this.getActiveConnectionCount(),
      connections: Array.from(this.connections.entries()).map(([connId, conn]) => ({
        ...conn,
        id: connId
      })),
      config: this.config
    };
  }

  updateConnection(id: string, metadata: Record<string, any>) {
    const conn = this.connections.get(id);
    if (conn) {
      conn.metadata = { ...conn.metadata, ...metadata };
      conn.lastHeartbeat = Date.now();
      this.emit('connection:updated', { id, connection: conn });
    }
  }

  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.connections.clear();
    console.log('🛑 App Core shutdown complete');
  }

  // Smart background management
  getSystemHealth() {
    const connections = Array.from(this.connections.values());
    const activeCount = connections.filter(c => c.status === 'connected').length;
    const errorCount = connections.filter(c => c.status === 'error').length;
    
    return {
      overall: activeCount === this.connections.size ? 'healthy' : errorCount > 0 ? 'degraded' : 'partial',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      activeConnections: activeCount,
      errorConnections: errorCount,
      totalConnections: this.connections.size,
      healthScore: Math.round((activeCount / this.connections.size) * 100)
    };
  }

  // Background task management
  async executeBackgroundTask(taskName: string, task: () => Promise<any>) {
    console.log(`📋 Starting background task: ${taskName}`);
    try {
      const result = await task();
      this.emit('background:task:complete', { taskName, success: true });
      console.log(`✅ Background task completed: ${taskName}`);
      return { success: true, result };
    } catch (error) {
      this.emit('background:task:error', { taskName, error });
      console.error(`❌ Background task failed: ${taskName}`, error);
      return { success: false, error };
    }
  }

  // Smart communication hub
  broadcastMessage(channel: string, message: any) {
    this.emit(`broadcast:${channel}`, {
      timestamp: Date.now(),
      message,
      source: 'AppCore'
    });
  }

  // Register background service
  registerBackgroundService(serviceId: string, type: ConnectionState['type']) {
    if (!this.connections.has(serviceId)) {
      this.connections.set(serviceId, {
        id: serviceId,
        type,
        status: 'connected',
        lastHeartbeat: Date.now(),
        metadata: { registered: new Date().toISOString() }
      });
      console.log(`🔌 Registered background service: ${serviceId}`);
    }
  }
}

export const appCore = AppCore.getInstance();