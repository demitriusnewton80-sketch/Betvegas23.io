
interface VPNConnection {
  id: string;
  userId: string;
  publicIP: string;
  vpnIP: string;
  location: string;
  protocol: string;
  encryption: string;
  connected: boolean;
  connectedAt: Date;
  dataTransferred: number;
  bandwidth: number;
  streamingEnabled?: boolean;
  tvChannels?: string[];
}

interface TVStream {
  id: string;
  name: string;
  category: 'sports' | 'news' | 'entertainment' | 'live-tv';
  streamUrl: string;
  quality: '720p' | '1080p' | '4K';
  vpnRequired: boolean;
  fccCompliant: boolean;
  viewers: number;
}

interface VPNServer {
  id: string;
  location: string;
  country: string;
  ip: string;
  load: number;
  maxConnections: number;
  currentConnections: number;
  protocols: string[];
  status: 'online' | 'offline' | 'maintenance';
}

class VPNService {
  private connections: Map<string, VPNConnection>;
  private servers: Map<string, VPNServer>;
  private ipPool: string[];
  private tvStreams: Map<string, TVStream>;

  constructor() {
    this.connections = new Map();
    this.servers = new Map();
    this.ipPool = this.generateIPPool();
    this.tvStreams = new Map();
    this.initializeServers();
    this.initializeTVStreams();
  }

  private generateIPPool(): string[] {
    const pool: string[] = [];
    for (let i = 1; i <= 254; i++) {
      pool.push(`10.8.0.${i}`);
    }
    return pool;
  }

  private initializeServers(): void {
    const serverData: Omit<VPNServer, 'id'>[] = [
      {
        location: 'New York, USA',
        country: 'US',
        ip: '0.0.0.0',
        load: 45,
        maxConnections: 1000,
        currentConnections: 450,
        protocols: ['OpenVPN', 'WireGuard', 'IKEv2'],
        status: 'online'
      },
      {
        location: 'London, UK',
        country: 'GB',
        ip: '0.0.0.0',
        load: 30,
        maxConnections: 1000,
        currentConnections: 300,
        protocols: ['OpenVPN', 'WireGuard', 'IKEv2'],
        status: 'online'
      },
      {
        location: 'Tokyo, Japan',
        country: 'JP',
        ip: '0.0.0.0',
        load: 60,
        maxConnections: 1000,
        currentConnections: 600,
        protocols: ['OpenVPN', 'WireGuard'],
        status: 'online'
      },
      {
        location: 'Frankfurt, Germany',
        country: 'DE',
        ip: '0.0.0.0',
        load: 25,
        maxConnections: 1000,
        currentConnections: 250,
        protocols: ['OpenVPN', 'WireGuard', 'IKEv2'],
        status: 'online'
      },
      {
        location: 'Singapore',
        country: 'SG',
        ip: '0.0.0.0',
        load: 55,
        maxConnections: 1000,
        currentConnections: 550,
        protocols: ['OpenVPN', 'WireGuard'],
        status: 'online'
      }
    ];

    serverData.forEach((server, index) => {
      const serverId = `vpn-server-${index + 1}`;
      this.servers.set(serverId, { id: serverId, ...server });
    });
  }

  async connect(userId: string, serverId: string, publicIP: string): Promise<VPNConnection> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error('VPN server not found');
    }

    if (server.status !== 'online') {
      throw new Error('VPN server is not available');
    }

    if (server.currentConnections >= server.maxConnections) {
      throw new Error('VPN server is at maximum capacity');
    }

    const existingConnection = Array.from(this.connections.values()).find(
      c => c.userId === userId && c.connected
    );

    if (existingConnection) {
      throw new Error('User already has an active VPN connection');
    }

    const vpnIP = this.allocateIP();
    const connectionId = `vpn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const connection: VPNConnection = {
      id: connectionId,
      userId,
      publicIP,
      vpnIP,
      location: server.location,
      protocol: 'WireGuard',
      encryption: 'ChaCha20-Poly1305',
      connected: true,
      connectedAt: new Date(),
      dataTransferred: 0,
      bandwidth: 1000
    };

    this.connections.set(connectionId, connection);
    server.currentConnections++;
    server.load = Math.round((server.currentConnections / server.maxConnections) * 100);

    return connection;
  }

  async disconnect(connectionId: string): Promise<boolean> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    connection.connected = false;
    this.releaseIP(connection.vpnIP);

    const server = Array.from(this.servers.values()).find(
      s => s.location === connection.location
    );

    if (server) {
      server.currentConnections = Math.max(0, server.currentConnections - 1);
      server.load = Math.round((server.currentConnections / server.maxConnections) * 100);
    }

    this.connections.delete(connectionId);
    return true;
  }

  getServers(): VPNServer[] {
    return Array.from(this.servers.values()).sort((a, b) => a.load - b.load);
  }

  getConnection(connectionId: string): VPNConnection | undefined {
    return this.connections.get(connectionId);
  }

  getUserConnections(userId: string): VPNConnection[] {
    return Array.from(this.connections.values()).filter(c => c.userId === userId);
  }

  getActiveConnections(): VPNConnection[] {
    return Array.from(this.connections.values()).filter(c => c.connected);
  }

  private allocateIP(): string {
    const usedIPs = new Set(
      Array.from(this.connections.values()).map(c => c.vpnIP)
    );

    for (const ip of this.ipPool) {
      if (!usedIPs.has(ip)) {
        return ip;
      }
    }

    throw new Error('No available IP addresses in pool');
  }

  private releaseIP(ip: string): void {
    // IP is automatically released when connection is removed
  }

  private initializeTVStreams(): void {
    // Sports Channels
    this.tvStreams.set('espn-live', {
      id: 'espn-live',
      name: 'ESPN Live Sports',
      category: 'sports',
      streamUrl: 'https://www.espn.com/watch',
      quality: '1080p',
      vpnRequired: true,
      fccCompliant: true,
      viewers: 0
    });

    this.tvStreams.set('nfl-network', {
      id: 'nfl-network',
      name: 'NFL Network',
      category: 'sports',
      streamUrl: 'https://www.nfl.com/network',
      quality: '1080p',
      vpnRequired: true,
      fccCompliant: true,
      viewers: 0
    });

    this.tvStreams.set('nba-tv', {
      id: 'nba-tv',
      name: 'NBA TV',
      category: 'sports',
      streamUrl: 'https://www.nba.com/watch',
      quality: '1080p',
      vpnRequired: true,
      fccCompliant: true,
      viewers: 0
    });

    this.tvStreams.set('fox-sports', {
      id: 'fox-sports',
      name: 'FOX Sports',
      category: 'sports',
      streamUrl: 'https://www.foxsports.com/live',
      quality: '1080p',
      vpnRequired: true,
      fccCompliant: true,
      viewers: 0
    });

    this.tvStreams.set('nbc-sports', {
      id: 'nbc-sports',
      name: 'NBC Sports',
      category: 'sports',
      streamUrl: 'https://www.nbcsports.com/live',
      quality: '1080p',
      vpnRequired: true,
      fccCompliant: true,
      viewers: 0
    });

    // Live TV Channels
    this.tvStreams.set('cbs-live', {
      id: 'cbs-live',
      name: 'CBS Live',
      category: 'live-tv',
      streamUrl: 'https://www.cbs.com/live-tv',
      quality: '1080p',
      vpnRequired: true,
      fccCompliant: true,
      viewers: 0
    });

    this.tvStreams.set('nbc-live', {
      id: 'nbc-live',
      name: 'NBC Live',
      category: 'live-tv',
      streamUrl: 'https://www.nbc.com/live',
      quality: '1080p',
      vpnRequired: true,
      fccCompliant: true,
      viewers: 0
    });

    this.tvStreams.set('abc-live', {
      id: 'abc-live',
      name: 'ABC Live',
      category: 'live-tv',
      streamUrl: 'https://abc.com/watch-live',
      quality: '1080p',
      vpnRequired: true,
      fccCompliant: true,
      viewers: 0
    });

    this.tvStreams.set('fox-live', {
      id: 'fox-live',
      name: 'FOX Live',
      category: 'live-tv',
      streamUrl: 'https://www.fox.com/live',
      quality: '1080p',
      vpnRequired: true,
      fccCompliant: true,
      viewers: 0
    });
  }

  enableStreamingForConnection(connectionId: string, channels: string[]): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    connection.streamingEnabled = true;
    connection.tvChannels = channels;
    
    channels.forEach(channelId => {
      const stream = this.tvStreams.get(channelId);
      if (stream) {
        stream.viewers++;
      }
    });

    return true;
  }

  getTVStreams(category?: string): TVStream[] {
    const streams = Array.from(this.tvStreams.values());
    if (category) {
      return streams.filter(s => s.category === category);
    }
    return streams;
  }

  getStreamUrl(streamId: string, connectionId: string): string | null {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.connected || !connection.streamingEnabled) {
      return null;
    }

    const stream = this.tvStreams.get(streamId);
    if (!stream) {
      return null;
    }

    return stream.streamUrl;
  }

  getStats() {
    const activeConnections = this.getActiveConnections();
    const totalDataTransferred = activeConnections.reduce(
      (sum, conn) => sum + conn.dataTransferred,
      0
    );

    const streamingConnections = activeConnections.filter(c => c.streamingEnabled).length;
    const totalViewers = Array.from(this.tvStreams.values()).reduce((sum, s) => sum + s.viewers, 0);

    return {
      totalServers: this.servers.size,
      onlineServers: Array.from(this.servers.values()).filter(s => s.status === 'online').length,
      activeConnections: activeConnections.length,
      streamingConnections,
      totalDataTransferred,
      averageLoad: Math.round(
        Array.from(this.servers.values()).reduce((sum, s) => sum + s.load, 0) / this.servers.size
      ),
      ipPoolUtilization: Math.round((activeConnections.length / this.ipPool.length) * 100),
      totalTVStreams: this.tvStreams.size,
      totalViewers
    };
  }

  // Phone-to-Domain Integration
  createPhoneDomain(phoneNumber: string, userId: string): { domain: string; ip: string; vpnIP: string } {
    // Generate unique domain from phone number
    const sanitizedPhone = phoneNumber.replace(/\D/g, '');
    const domain = `phone-${sanitizedPhone}.youngmeeat.repl.co`;
    
    // Allocate dedicated VPN IP for this phone
    const vpnIP = this.allocateIP();
    
    // Map to server's public IP (0.0.0.0 binding makes it accessible)
    const publicIP = '0.0.0.0';
    
    return {
      domain,
      ip: publicIP,
      vpnIP
    };
  }

  // Get domain mapping for phone
  getPhoneDomainMapping(phoneNumber: string): {
    domain: string;
    vpnIP: string;
    serverIP: string;
    port: number;
    accessUrl: string;
  } {
    const sanitizedPhone = phoneNumber.replace(/\D/g, '');
    const domain = `phone-${sanitizedPhone}.youngmeeat.repl.co`;
    const vpnIP = `10.8.0.${Math.floor(Math.random() * 254) + 1}`;
    
    return {
      domain,
      vpnIP,
      serverIP: '0.0.0.0',
      port: 5000,
      accessUrl: `https://${domain}:5000`
    };
  }

  // Enable phone control access
  enablePhoneAccess(connectionId: string, phoneNumber: string): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    const phoneMapping = this.getPhoneDomainMapping(phoneNumber);
    
    // Enable full access including streaming and control
    connection.streamingEnabled = true;
    connection.tvChannels = Array.from(this.tvStreams.keys());
    
    return true;
  }

  // Create streaming server for VPN connection
  createStreamingServer(connectionId: string, appPort: number = 5000): {
    serverUrl: string;
    vpnIP: string;
    streamingPort: number;
    status: string;
  } {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    const streamingPort = appPort;
    const serverUrl = `https://${connection.vpnIP}:${streamingPort}`;

    return {
      serverUrl,
      vpnIP: connection.vpnIP,
      streamingPort,
      status: 'streaming'
    };
  }

  // Get streaming server info
  getStreamingServerInfo(connectionId: string): {
    appUrl: string;
    vpnIP: string;
    publicAccess: string;
    fccEntity: string;
  } | null {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return null;
    }

    return {
      appUrl: `https://${connection.vpnIP}:5000`,
      vpnIP: connection.vpnIP,
      publicAccess: `https://0.0.0.0:5000`,
      fccEntity: '20130314143016'
    };
  }
}

export const vpnService = new VPNService();
