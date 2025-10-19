
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

  constructor() {
    this.connections = new Map();
    this.servers = new Map();
    this.ipPool = this.generateIPPool();
    this.initializeServers();
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

  getStats() {
    const activeConnections = this.getActiveConnections();
    const totalDataTransferred = activeConnections.reduce(
      (sum, conn) => sum + conn.dataTransferred,
      0
    );

    return {
      totalServers: this.servers.size,
      onlineServers: Array.from(this.servers.values()).filter(s => s.status === 'online').length,
      activeConnections: activeConnections.length,
      totalDataTransferred,
      averageLoad: Math.round(
        Array.from(this.servers.values()).reduce((sum, s) => sum + s.load, 0) / this.servers.size
      ),
      ipPoolUtilization: Math.round((activeConnections.length / this.ipPool.length) * 100)
    };
  }
}

export const vpnService = new VPNService();
