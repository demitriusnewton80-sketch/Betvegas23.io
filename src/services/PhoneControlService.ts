
import { EventEmitter } from 'events';

export interface PhoneControlSession {
  id: string;
  email: string;
  phoneNumber?: string;
  userId: string;
  connectedAt: string;
  permissions: string[];
  activePlugins: string[];
  networkStatus: 'connected' | 'disconnected';
}

export interface NetworkPlugin {
  id: string;
  name: string;
  type: 'betting' | 'streaming' | 'gaming' | 'content';
  status: 'active' | 'inactive';
  host: boolean; // Is this plugin a host
  distributionEnabled: boolean;
  connectedUsers: string[];
  benefitShare: number; // Percentage of benefits distributed
}

export interface ContentDistribution {
  id: string;
  contentId: string;
  pluginId: string;
  userId: string;
  benefitAmount: number;
  distributedAt: string;
  gameType: 'sports' | 'ps5' | 'live';
}

class PhoneControlService extends EventEmitter {
  private sessions: Map<string, PhoneControlSession> = new Map();
  private plugins: Map<string, NetworkPlugin> = new Map();
  private distributions: Map<string, ContentDistribution[]> = new Map();
  private authorizedEmails = ['gbemeaat@gmail.com', 'meeatupt215@gmail.com'];

  constructor() {
    super();
    this.initializeNetworkPlugins();
  }

  private initializeNetworkPlugins() {
    // Initialize core network plugins
    this.plugins.set('live-sportsbook', {
      id: 'live-sportsbook',
      name: 'Live Sportsbook',
      type: 'betting',
      status: 'active',
      host: true, // Primary host
      distributionEnabled: true,
      connectedUsers: [],
      benefitShare: 40 // 40% of benefits
    });

    this.plugins.set('ps5-betting', {
      id: 'ps5-betting',
      name: 'PS5 Sports Betting',
      type: 'gaming',
      status: 'active',
      host: true,
      distributionEnabled: true,
      connectedUsers: [],
      benefitShare: 30
    });

    this.plugins.set('streaming-hub', {
      id: 'streaming-hub',
      name: 'Streaming Hub',
      type: 'streaming',
      status: 'active',
      host: false,
      distributionEnabled: true,
      connectedUsers: [],
      benefitShare: 20
    });

    this.plugins.set('content-control', {
      id: 'content-control',
      name: 'Content Control System',
      type: 'content',
      status: 'active',
      host: true, // Host for content distribution
      distributionEnabled: true,
      connectedUsers: [],
      benefitShare: 10
    });
  }

  // Validate Betting Zone access
  validatePhoneAccess(email: string): boolean {
    return this.authorizedEmails.includes(email.toLowerCase());
  }

  // Create Betting Zone session
  createSession(email: string, phoneNumber?: string): PhoneControlSession {
    const sessionId = `phone-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const session: PhoneControlSession = {
      id: sessionId,
      email,
      phoneNumber,
      userId: `user-${email.split('@')[0]}`,
      connectedAt: new Date().toISOString(),
      permissions: ['control_plugins', 'distribute_benefits', 'manage_content'],
      activePlugins: Array.from(this.plugins.keys()),
      networkStatus: 'connected'
    };

    this.sessions.set(sessionId, session);
    this.emit('sessionCreated', session);
    
    return session;
  }

  // Get all network plugins
  getAllPlugins(): NetworkPlugin[] {
    return Array.from(this.plugins.values());
  }

  // Get host plugins (core network hosts)
  getHostPlugins(): NetworkPlugin[] {
    return Array.from(this.plugins.values()).filter(p => p.host);
  }

  // Connect user to network plugin
  connectUserToPlugin(userId: string, pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    if (!plugin.connectedUsers.includes(userId)) {
      plugin.connectedUsers.push(userId);
      this.emit('userConnected', { userId, pluginId });
    }

    return true;
  }

  // Distribute benefits from betting to network users
  distributeBenefits(
    contentId: string,
    totalAmount: number,
    gameType: 'sports' | 'ps5' | 'live'
  ): ContentDistribution[] {
    const distributions: ContentDistribution[] = [];
    const hostPlugins = this.getHostPlugins();

    hostPlugins.forEach(plugin => {
      if (!plugin.distributionEnabled) return;

      const benefitAmount = totalAmount * (plugin.benefitShare / 100);
      
      // Distribute to connected users
      plugin.connectedUsers.forEach(userId => {
        const distribution: ContentDistribution = {
          id: `dist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          contentId,
          pluginId: plugin.id,
          userId,
          benefitAmount: benefitAmount / plugin.connectedUsers.length,
          distributedAt: new Date().toISOString(),
          gameType
        };

        distributions.push(distribution);

        // Store distribution
        if (!this.distributions.has(userId)) {
          this.distributions.set(userId, []);
        }
        this.distributions.get(userId)!.push(distribution);
      });
    });

    this.emit('benefitsDistributed', { contentId, distributions });
    return distributions;
  }

  // Get user distributions
  getUserDistributions(userId: string): ContentDistribution[] {
    return this.distributions.get(userId) || [];
  }

  // Send Betting Zone command
  sendPhoneCommand(sessionId: string, command: string, pluginId?: string): any {
    const session = this.sessions.get(sessionId);
    if (!session || session.networkStatus !== 'connected') {
      return { success: false, error: 'Invalid or disconnected session' };
    }

    const commandResult = {
      sessionId,
      command,
      pluginId,
      executedAt: new Date().toISOString(),
      success: true,
      result: {}
    };

    switch (command) {
      case 'activate_all_plugins':
        this.plugins.forEach(p => { p.status = 'active'; });
        commandResult.result = { activatedPlugins: this.plugins.size };
        break;

      case 'enable_distribution':
        if (pluginId) {
          const plugin = this.plugins.get(pluginId);
          if (plugin) {
            plugin.distributionEnabled = true;
            commandResult.result = { pluginId, distributionEnabled: true };
          }
        }
        break;

      case 'sync_network':
        commandResult.result = {
          totalPlugins: this.plugins.size,
          hostPlugins: this.getHostPlugins().length,
          connectedSessions: this.sessions.size
        };
        break;

      default:
        commandResult.result = { message: 'Command executed' };
    }

    this.emit('phoneCommandExecuted', commandResult);
    return commandResult;
  }

  // Get network statistics
  getNetworkStats(): any {
    const totalUsers = new Set<string>();
    this.plugins.forEach(p => {
      p.connectedUsers.forEach(u => totalUsers.add(u));
    });

    const totalDistributions = Array.from(this.distributions.values())
      .reduce((sum, dists) => sum + dists.length, 0);

    const totalBenefits = Array.from(this.distributions.values())
      .flat()
      .reduce((sum, dist) => sum + dist.benefitAmount, 0);

    return {
      totalPlugins: this.plugins.size,
      hostPlugins: this.getHostPlugins().length,
      connectedUsers: totalUsers.size,
      activeSessions: this.sessions.size,
      totalDistributions,
      totalBenefitsDistributed: totalBenefits,
      fccEntity: '20130314143016'
    };
  }
}

export const phoneControlService = new PhoneControlService();
