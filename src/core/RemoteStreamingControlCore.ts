
import { EventEmitter } from 'events';
import { smartTunnelCore } from './SmartTunnelCore.js';
import { portManagementCore } from './PortManagementCore.js';
import { streamingService } from '../services/StreamingService.js';

interface StreamingTunnel {
  id: string;
  sourcePort: number;
  targetPort: number;
  protocol: 'http' | 'https' | 'ws' | 'wss';
  status: 'active' | 'upgrading' | 'degraded' | 'failed';
  bandwidth: number;
  latency: number;
  upgradeLevel: number;
  fccChannelId: string;
  lastUpgrade: number;
  contentStreams: string[];
}

interface ContentLandscape {
  id: string;
  name: string;
  zones: LandscapeZone[];
  totalCapacity: number;
  activeStreams: number;
  health: 'optimal' | 'degraded' | 'critical';
}

interface LandscapeZone {
  id: string;
  type: 'streaming' | 'betting' | 'gaming' | 'storage';
  ports: number[];
  tunnels: string[];
  remoteAccess: boolean;
  fccCompliant: boolean;
}

interface RemoteControlSession {
  id: string;
  userId: string;
  landscapeId: string;
  permissions: string[];
  startedAt: number;
  expiresAt: number;
  activeCommands: string[];
}

export class RemoteStreamingControlCore extends EventEmitter {
  private static instance: RemoteStreamingControlCore;
  private streamingTunnels: Map<string, StreamingTunnel> = new Map();
  private contentLandscapes: Map<string, ContentLandscape> = new Map();
  private remoteControlSessions: Map<string, RemoteControlSession> = new Map();
  private upgradeQueue: string[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private fccChannels: Map<string, any> = new Map();

  private constructor() {
    super();
    this.initializeRemoteControl();
  }

  static getInstance(): RemoteStreamingControlCore {
    if (!RemoteStreamingControlCore.instance) {
      RemoteStreamingControlCore.instance = new RemoteStreamingControlCore();
    }
    return RemoteStreamingControlCore.instance;
  }

  private initializeRemoteControl() {
    console.log('🎮 Initializing Remote Streaming Control Core...');

    // Initialize FCC streaming channels
    this.initializeFCCChannels();

    // Create content landscapes
    this.buildContentLandscapes();

    // Start monitoring and auto-upgrade system
    this.monitoringInterval = setInterval(() => {
      this.monitorTunnels();
      this.upgradeOutdatedPorts();
      this.optimizeLandscapes();
      this.validateFCCCompliance();
    }, 5000);

    console.log('✅ Remote Streaming Control Core initialized');
  }

  private initializeFCCChannels() {
    // Create FCC-compliant streaming channels
    const channels = [
      { id: 'fcc-sports-live', type: 'sports', bandwidth: 50000, priority: 'high' },
      { id: 'fcc-betting-data', type: 'betting', bandwidth: 30000, priority: 'high' },
      { id: 'fcc-gaming-stream', type: 'gaming', bandwidth: 40000, priority: 'medium' },
      { id: 'fcc-radio-broadcast', type: 'radio', bandwidth: 20000, priority: 'medium' }
    ];

    channels.forEach(channel => {
      this.fccChannels.set(channel.id, {
        ...channel,
        status: 'active',
        entity: '20130314143016',
        registration: '0024454324',
        compliance: true,
        activeConnections: 0,
        createdAt: Date.now()
      });
    });

    console.log(`✅ Initialized ${this.fccChannels.size} FCC streaming channels`);
  }

  private buildContentLandscapes() {
    // Sportsbook Landscape
    const sportsbookLandscape: ContentLandscape = {
      id: 'landscape-sportsbook',
      name: 'Sportsbook Content Landscape',
      zones: [
        {
          id: 'zone-live-betting',
          type: 'betting',
          ports: [5000, 3000, 3001],
          tunnels: [],
          remoteAccess: true,
          fccCompliant: true
        },
        {
          id: 'zone-live-streams',
          type: 'streaming',
          ports: [8000, 8080, 8081],
          tunnels: [],
          remoteAccess: true,
          fccCompliant: true
        }
      ],
      totalCapacity: 10000,
      activeStreams: 0,
      health: 'optimal'
    };

    // Gaming Landscape
    const gamingLandscape: ContentLandscape = {
      id: 'landscape-gaming',
      name: 'PS5 Gaming Landscape',
      zones: [
        {
          id: 'zone-ps5-gaming',
          type: 'gaming',
          ports: [3002, 3003, 4200],
          tunnels: [],
          remoteAccess: true,
          fccCompliant: true
        },
        {
          id: 'zone-game-storage',
          type: 'storage',
          ports: [6000, 6800],
          tunnels: [],
          remoteAccess: true,
          fccCompliant: true
        }
      ],
      totalCapacity: 8000,
      activeStreams: 0,
      health: 'optimal'
    };

    this.contentLandscapes.set(sportsbookLandscape.id, sportsbookLandscape);
    this.contentLandscapes.set(gamingLandscape.id, gamingLandscape);

    console.log(`✅ Built ${this.contentLandscapes.size} content landscapes`);
  }

  // Create streaming tunnel with automatic upgrade
  createStreamingTunnel(sourcePort: number, targetPort: number, fccChannelId: string): string {
    const tunnelId = `stream-tunnel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const tunnel: StreamingTunnel = {
      id: tunnelId,
      sourcePort,
      targetPort,
      protocol: 'https',
      status: 'active',
      bandwidth: 10000,
      latency: 10,
      upgradeLevel: 1,
      fccChannelId,
      lastUpgrade: Date.now(),
      contentStreams: []
    };

    this.streamingTunnels.set(tunnelId, tunnel);

    // Create underlying smart tunnel connection
    smartTunnelCore.createTunnelConnection(`/stream-port-${sourcePort}`, 'network');

    // Assign to appropriate landscape zone
    this.assignTunnelToLandscape(tunnelId, sourcePort);

    console.log(`🚇 Created streaming tunnel: ${sourcePort} → ${targetPort} (${fccChannelId})`);
    this.emit('tunnel:created', tunnel);

    return tunnelId;
  }

  private assignTunnelToLandscape(tunnelId: string, port: number) {
    for (const [landscapeId, landscape] of this.contentLandscapes) {
      for (const zone of landscape.zones) {
        if (zone.ports.includes(port)) {
          zone.tunnels.push(tunnelId);
          console.log(`📍 Assigned tunnel ${tunnelId} to ${zone.id} in ${landscapeId}`);
          return;
        }
      }
    }
  }

  // Upgrade outdated ports through tunnels
  private async upgradeOutdatedPorts() {
    const portLandscape = portManagementCore.getPortLandscape();

    for (const port of portLandscape.ports) {
      if (port.status === 'inactive' || port.status === 'error' || port.errorCount > 2) {
        console.log(`⬆️ Upgrading outdated port: ${port.port}`);
        await this.upgradePortThroughTunnel(port.port);
      }
    }
  }

  private async upgradePortThroughTunnel(port: number): Promise<void> {
    // Find or create tunnel for this port
    let tunnel = Array.from(this.streamingTunnels.values()).find(t => t.sourcePort === port);

    if (!tunnel) {
      // Create new tunnel with upgraded target port
      const upgradedPort = this.findUpgradedPort(port);
      const fccChannel = this.selectOptimalFCCChannel();
      const tunnelId = this.createStreamingTunnel(port, upgradedPort, fccChannel);
      tunnel = this.streamingTunnels.get(tunnelId)!;
    }

    // Perform upgrade
    tunnel.status = 'upgrading';
    tunnel.upgradeLevel++;
    tunnel.lastUpgrade = Date.now();

    // Increase bandwidth for upgraded port
    tunnel.bandwidth = Math.min(tunnel.bandwidth * 1.5, 100000);

    // Create port bypass in port management
    const bypass = portManagementCore.getPortLandscape().bypasses
      .find(b => b.route.includes(String(port)));

    if (!bypass) {
      // Port management will create bypass automatically
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    tunnel.status = 'active';
    console.log(`✅ Port ${port} upgraded to level ${tunnel.upgradeLevel}`);
    this.emit('port:upgraded', { port, tunnel });
  }

  private findUpgradedPort(originalPort: number): number {
    // Select an available upgraded port
    const availablePorts = [5173, 6000, 6800, 8000, 8008, 8080, 8081];
    const usedPorts = Array.from(this.streamingTunnels.values()).map(t => t.targetPort);
    
    const upgradedPort = availablePorts.find(p => !usedPorts.includes(p));
    return upgradedPort || originalPort + 1000;
  }

  private selectOptimalFCCChannel(): string {
    let optimalChannel = '';
    let minConnections = Infinity;

    for (const [channelId, channel] of this.fccChannels) {
      if (channel.status === 'active' && channel.activeConnections < minConnections) {
        minConnections = channel.activeConnections;
        optimalChannel = channelId;
      }
    }

    return optimalChannel || 'fcc-sports-live';
  }

  // Create remote control session
  createRemoteSession(userId: string, landscapeId: string, permissions: string[]): string {
    const sessionId = `remote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const session: RemoteControlSession = {
      id: sessionId,
      userId,
      landscapeId,
      permissions,
      startedAt: Date.now(),
      expiresAt: Date.now() + 3600000, // 1 hour
      activeCommands: []
    };

    this.remoteControlSessions.set(sessionId, session);
    console.log(`🎮 Created remote control session: ${sessionId} for ${userId}`);
    this.emit('session:created', session);

    return sessionId;
  }

  // Execute remote command on landscape
  async executeRemoteCommand(sessionId: string, command: string, params: any): Promise<any> {
    const session = this.remoteControlSessions.get(sessionId);
    if (!session) {
      throw new Error('Invalid session');
    }

    if (Date.now() > session.expiresAt) {
      throw new Error('Session expired');
    }

    session.activeCommands.push(command);

    let result: any;

    switch (command) {
      case 'start_stream':
        result = await this.startStreamInLandscape(session.landscapeId, params.streamId);
        break;
      case 'upgrade_zone':
        result = await this.upgradeZone(session.landscapeId, params.zoneId);
        break;
      case 'optimize_tunnels':
        result = await this.optimizeTunnelsInLandscape(session.landscapeId);
        break;
      case 'create_tunnel':
        result = this.createStreamingTunnel(params.sourcePort, params.targetPort, params.fccChannelId);
        break;
      default:
        throw new Error('Unknown command');
    }

    session.activeCommands = session.activeCommands.filter(c => c !== command);
    this.emit('command:executed', { sessionId, command, result });

    return result;
  }

  private async startStreamInLandscape(landscapeId: string, streamId: string): Promise<any> {
    const landscape = this.contentLandscapes.get(landscapeId);
    if (!landscape) {
      throw new Error('Landscape not found');
    }

    // Start stream through streaming service
    streamingService.startGameStream(streamId);

    // Find appropriate tunnel
    const tunnel = Array.from(this.streamingTunnels.values())
      .find(t => landscape.zones.some(z => z.tunnels.includes(t.id)));

    if (tunnel) {
      tunnel.contentStreams.push(streamId);
      const channel = this.fccChannels.get(tunnel.fccChannelId);
      if (channel) {
        channel.activeConnections++;
      }
    }

    landscape.activeStreams++;
    console.log(`📡 Started stream ${streamId} in ${landscapeId}`);

    return { streamId, landscapeId, tunnelId: tunnel?.id };
  }

  private async upgradeZone(landscapeId: string, zoneId: string): Promise<any> {
    const landscape = this.contentLandscapes.get(landscapeId);
    if (!landscape) {
      throw new Error('Landscape not found');
    }

    const zone = landscape.zones.find(z => z.id === zoneId);
    if (!zone) {
      throw new Error('Zone not found');
    }

    // Upgrade all ports in zone
    for (const port of zone.ports) {
      await this.upgradePortThroughTunnel(port);
    }

    console.log(`⬆️ Upgraded zone ${zoneId} in ${landscapeId}`);
    return { landscapeId, zoneId, portsUpgraded: zone.ports.length };
  }

  private async optimizeTunnelsInLandscape(landscapeId: string): Promise<any> {
    const landscape = this.contentLandscapes.get(landscapeId);
    if (!landscape) {
      throw new Error('Landscape not found');
    }

    let optimized = 0;

    for (const zone of landscape.zones) {
      for (const tunnelId of zone.tunnels) {
        const tunnel = this.streamingTunnels.get(tunnelId);
        if (tunnel) {
          // Optimize bandwidth based on usage
          if (tunnel.contentStreams.length > 0) {
            tunnel.bandwidth = Math.min(tunnel.bandwidth * 1.2, 100000);
            optimized++;
          }
        }
      }
    }

    console.log(`⚡ Optimized ${optimized} tunnels in ${landscapeId}`);
    return { landscapeId, tunnelsOptimized: optimized };
  }

  private monitorTunnels() {
    for (const [tunnelId, tunnel] of this.streamingTunnels) {
      // Check tunnel health
      const timeSinceUpgrade = Date.now() - tunnel.lastUpgrade;

      if (timeSinceUpgrade > 300000 && tunnel.upgradeLevel < 5) { // 5 minutes
        this.upgradeQueue.push(tunnelId);
      }

      // Monitor latency
      if (tunnel.latency > 50) {
        tunnel.status = 'degraded';
        this.emit('tunnel:degraded', tunnel);
      }

      // Check FCC channel health
      const channel = this.fccChannels.get(tunnel.fccChannelId);
      if (channel && !channel.compliance) {
        console.warn(`⚠️ FCC compliance issue on tunnel ${tunnelId}`);
      }
    }

    // Process upgrade queue
    if (this.upgradeQueue.length > 0) {
      const tunnelId = this.upgradeQueue.shift()!;
      const tunnel = this.streamingTunnels.get(tunnelId);
      if (tunnel && tunnel.upgradeLevel < 5) {
        tunnel.upgradeLevel++;
        tunnel.lastUpgrade = Date.now();
        tunnel.bandwidth = Math.min(tunnel.bandwidth * 1.3, 100000);
        console.log(`⬆️ Auto-upgraded tunnel ${tunnelId} to level ${tunnel.upgradeLevel}`);
      }
    }
  }

  private optimizeLandscapes() {
    for (const [landscapeId, landscape] of this.contentLandscapes) {
      // Calculate health
      const totalTunnels = landscape.zones.reduce((sum, z) => sum + z.tunnels.length, 0);
      const activeTunnels = Array.from(this.streamingTunnels.values())
        .filter(t => t.status === 'active' && 
          landscape.zones.some(z => z.tunnels.includes(t.id))).length;

      const healthRatio = totalTunnels > 0 ? activeTunnels / totalTunnels : 1;

      if (healthRatio >= 0.9) {
        landscape.health = 'optimal';
      } else if (healthRatio >= 0.7) {
        landscape.health = 'degraded';
      } else {
        landscape.health = 'critical';
      }

      // Auto-create tunnels for zones with low coverage
      for (const zone of landscape.zones) {
        if (zone.tunnels.length < zone.ports.length / 2) {
          const unusedPort = zone.ports.find(p => 
            !zone.tunnels.some(tid => {
              const t = this.streamingTunnels.get(tid);
              return t && t.sourcePort === p;
            })
          );

          if (unusedPort) {
            const fccChannel = this.selectOptimalFCCChannel();
            this.createStreamingTunnel(unusedPort, unusedPort + 1000, fccChannel);
          }
        }
      }
    }
  }

  private validateFCCCompliance() {
    for (const [channelId, channel] of this.fccChannels) {
      // Ensure all channels remain compliant
      if (!channel.compliance) {
        console.error(`❌ FCC compliance violation on ${channelId}`);
        // Disable non-compliant channel
        channel.status = 'suspended';
      }

      // Monitor bandwidth usage
      if (channel.activeConnections > 100) {
        console.warn(`⚠️ High connection count on ${channelId}: ${channel.activeConnections}`);
      }
    }
  }

  // Get comprehensive status
  getRemoteControlStatus() {
    const activeSessions = Array.from(this.remoteControlSessions.values())
      .filter(s => Date.now() < s.expiresAt);

    return {
      tunnels: {
        total: this.streamingTunnels.size,
        active: Array.from(this.streamingTunnels.values()).filter(t => t.status === 'active').length,
        upgrading: Array.from(this.streamingTunnels.values()).filter(t => t.status === 'upgrading').length,
        avgUpgradeLevel: this.streamingTunnels.size > 0 
          ? Array.from(this.streamingTunnels.values()).reduce((sum, t) => sum + t.upgradeLevel, 0) / this.streamingTunnels.size
          : 0
      },
      landscapes: {
        total: this.contentLandscapes.size,
        optimal: Array.from(this.contentLandscapes.values()).filter(l => l.health === 'optimal').length,
        degraded: Array.from(this.contentLandscapes.values()).filter(l => l.health === 'degraded').length,
        critical: Array.from(this.contentLandscapes.values()).filter(l => l.health === 'critical').length
      },
      fccChannels: {
        total: this.fccChannels.size,
        active: Array.from(this.fccChannels.values()).filter(c => c.status === 'active').length,
        compliant: Array.from(this.fccChannels.values()).filter(c => c.compliance).length,
        totalConnections: Array.from(this.fccChannels.values()).reduce((sum, c) => sum + c.activeConnections, 0)
      },
      remoteSessions: {
        total: activeSessions.length,
        activeCommands: activeSessions.reduce((sum, s) => sum + s.activeCommands.length, 0)
      },
      fccEntity: '20130314143016',
      timestamp: Date.now()
    };
  }

  getLandscapes() {
    return Array.from(this.contentLandscapes.values());
  }

  getTunnels() {
    return Array.from(this.streamingTunnels.values());
  }

  getFCCChannels() {
    return Array.from(this.fccChannels.values());
  }

  shutdown() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.streamingTunnels.clear();
    this.remoteControlSessions.clear();
    console.log('🔌 Remote Streaming Control Core shutdown');
  }
}

export const remoteStreamingControlCore = RemoteStreamingControlCore.getInstance();
