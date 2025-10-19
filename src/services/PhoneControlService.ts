
import { EventEmitter } from 'events';

interface PhoneSession {
  id: string;
  userId: string;
  email: string;
  phoneNumber?: string;
  activePlugins: string[];
  permissions: string[];
  networkStatus: string;
  createdAt: string;
}

interface NetworkPlugin {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive';
  host: boolean;
  connectedUsers: string[];
  benefitShare: number;
  distributionEnabled: boolean;
}

class PhoneControlService extends EventEmitter {
  private sessions: Map<string, PhoneSession> = new Map();
  private plugins: Map<string, NetworkPlugin> = new Map();

  constructor() {
    super();
    this.initializePlugins();
  }

  private initializePlugins(): void {
    const defaultPlugins: NetworkPlugin[] = [
      {
        id: 'live-sportsbook',
        name: 'Live Sportsbook',
        type: 'betting',
        status: 'active',
        host: true,
        connectedUsers: [],
        benefitShare: 35,
        distributionEnabled: true
      },
      {
        id: 'ps5-betting',
        name: 'PlayStation 5 Betting',
        type: 'gaming',
        status: 'active',
        host: true,
        connectedUsers: [],
        benefitShare: 25,
        distributionEnabled: true
      },
      {
        id: 'streaming-hub',
        name: 'Amazon Prime Streaming',
        type: 'streaming',
        status: 'active',
        host: false,
        connectedUsers: [],
        benefitShare: 15,
        distributionEnabled: true
      },
      {
        id: 'content-control',
        name: 'Content Distribution',
        type: 'content',
        status: 'active',
        host: false,
        connectedUsers: [],
        benefitShare: 10,
        distributionEnabled: true
      },
      {
        id: 'wifi-core',
        name: 'WiFi Core Fuse',
        type: 'networking',
        status: 'active',
        host: true,
        connectedUsers: [],
        benefitShare: 10,
        distributionEnabled: true
      },
      {
        id: 'winner-payout',
        name: 'Winner Cash Payout',
        type: 'payment',
        status: 'active',
        host: false,
        connectedUsers: [],
        benefitShare: 5,
        distributionEnabled: true
      }
    ];

    defaultPlugins.forEach(plugin => {
      this.plugins.set(plugin.id, plugin);
    });
  }

  createSession(email: string, phoneNumber?: string): PhoneSession {
    const userId = `user-${email.split('@')[0]}-${Date.now()}`;
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const session: PhoneSession = {
      id: sessionId,
      userId,
      email,
      phoneNumber,
      activePlugins: Array.from(this.plugins.keys()),
      permissions: ['read', 'write', 'execute', 'distribute'],
      networkStatus: 'connected',
      createdAt: new Date().toISOString()
    };

    this.sessions.set(sessionId, session);

    // Connect user to all active plugins
    this.plugins.forEach((plugin, id) => {
      if (plugin.status === 'active') {
        plugin.connectedUsers.push(userId);
      }
    });

    this.emit('sessionCreated', session);
    return session;
  }

  getAllPlugins(): NetworkPlugin[] {
    return Array.from(this.plugins.values());
  }

  executeCommand(sessionId: string, command: string): any {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    switch (command) {
      case 'activate_all_plugins':
        this.plugins.forEach(plugin => {
          plugin.status = 'active';
        });
        return { message: 'All plugins activated', count: this.plugins.size };

      case 'enable_distribution':
        this.plugins.forEach(plugin => {
          plugin.distributionEnabled = true;
        });
        return { message: 'Distribution enabled for all plugins', count: this.plugins.size };

      case 'sync_network':
        return { 
          message: 'Network synchronized',
          plugins: this.plugins.size,
          sessions: this.sessions.size,
          timestamp: new Date().toISOString()
        };

      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }

  connectUserToPlugin(userId: string, pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    
    if (!plugin) {
      throw new Error('Plugin not found');
    }

    if (!plugin.connectedUsers.includes(userId)) {
      plugin.connectedUsers.push(userId);
      this.emit('userConnected', { userId, pluginId });
    }

    return true;
  }

  setDistribution(pluginId: string, enabled: boolean): boolean {
    const plugin = this.plugins.get(pluginId);
    
    if (!plugin) {
      throw new Error('Plugin not found');
    }

    plugin.distributionEnabled = enabled;
    this.emit('distributionChanged', { pluginId, enabled });
    
    return enabled;
  }

  getNetworkStats(): any {
    const totalUsers = new Set(
      Array.from(this.plugins.values())
        .flatMap(p => p.connectedUsers)
    ).size;

    const totalBenefits = Array.from(this.plugins.values())
      .reduce((sum, p) => sum + (p.benefitShare * p.connectedUsers.length * 10), 0);

    return {
      totalPlugins: this.plugins.size,
      hostPlugins: Array.from(this.plugins.values()).filter(p => p.host).length,
      connectedUsers: totalUsers,
      totalBenefitsDistributed: totalBenefits,
      activeSessions: this.sessions.size
    };
  }
}

export const phoneControlService = new PhoneControlService();
