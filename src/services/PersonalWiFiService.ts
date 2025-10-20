
interface WiFiUser {
  userId: string;
  email: string;
  phoneNumber?: string;
  ssid: string;
  password: string;
  macAddress?: string;
  ipAddress: string;
  bandwidth: string;
  signalStrength: number;
  connectedAt: Date;
  dataUsed: number;
  status: 'active' | 'inactive' | 'suspended';
  location?: string;
}

interface WiFiNetwork {
  id: string;
  name: string;
  ssid: string;
  password: string;
  frequency: '2.4GHz' | '5GHz' | 'dual-band';
  security: 'WPA3' | 'WPA2';
  maxUsers: number;
  currentUsers: number;
  ipRange: string;
  gateway: string;
  dns: string[];
  fccCompliant: boolean;
}

class PersonalWiFiService {
  private connectedUsers: Map<string, WiFiUser>;
  private networks: Map<string, WiFiNetwork>;
  private ipPool: string[];
  private usedIPs: Set<string>;

  constructor() {
    this.connectedUsers = new Map();
    this.networks = new Map();
    this.ipPool = this.generateIPPool();
    this.usedIPs = new Set();
    this.initializeNetworks();
  }

  private generateIPPool(): string[] {
    const pool: string[] = [];
    // Generate IP range 192.168.100.1 - 192.168.100.254
    for (let i = 2; i <= 254; i++) {
      pool.push(`192.168.100.${i}`);
    }
    return pool;
  }

  private initializeNetworks(): void {
    // National WiFi Network
    this.networks.set('national-wifi', {
      id: 'national-wifi',
      name: 'Young Meeat National WiFi',
      ssid: 'YoungMeeat-National',
      password: this.generateSecurePassword(),
      frequency: 'dual-band',
      security: 'WPA3',
      maxUsers: 1000,
      currentUsers: 0,
      ipRange: '192.168.100.0/24',
      gateway: '192.168.100.1',
      dns: ['8.8.8.8', '8.8.4.4', '1.1.1.1'],
      fccCompliant: true
    });

    // Premium WiFi Network
    this.networks.set('premium-wifi', {
      id: 'premium-wifi',
      name: 'Young Meeat Premium WiFi',
      ssid: 'YoungMeeat-Premium',
      password: this.generateSecurePassword(),
      frequency: 'dual-band',
      security: 'WPA3',
      maxUsers: 500,
      currentUsers: 0,
      ipRange: '192.168.101.0/24',
      gateway: '192.168.101.1',
      dns: ['8.8.8.8', '8.8.4.4'],
      fccCompliant: true
    });
  }

  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private allocateIP(): string {
    for (const ip of this.ipPool) {
      if (!this.usedIPs.has(ip)) {
        this.usedIPs.add(ip);
        return ip;
      }
    }
    throw new Error('No available IP addresses');
  }

  private releaseIP(ip: string): void {
    this.usedIPs.delete(ip);
  }

  // Connect user to personal WiFi
  connectUser(email: string, phoneNumber?: string, networkId: string = 'national-wifi'): WiFiUser {
    const network = this.networks.get(networkId);
    if (!network) {
      throw new Error('Network not found');
    }

    if (network.currentUsers >= network.maxUsers) {
      throw new Error('Network at maximum capacity');
    }

    // Check if user already connected
    const existingUser = Array.from(this.connectedUsers.values()).find(
      u => u.email === email && u.status === 'active'
    );

    if (existingUser) {
      return existingUser;
    }

    const userId = `wifi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const ipAddress = this.allocateIP();

    const user: WiFiUser = {
      userId,
      email,
      phoneNumber,
      ssid: network.ssid,
      password: network.password,
      ipAddress,
      bandwidth: 'unlimited',
      signalStrength: 100,
      connectedAt: new Date(),
      dataUsed: 0,
      status: 'active'
    };

    this.connectedUsers.set(userId, user);
    network.currentUsers++;

    return user;
  }

  // Disconnect user
  disconnectUser(userId: string): boolean {
    const user = this.connectedUsers.get(userId);
    if (!user) {
      return false;
    }

    user.status = 'inactive';
    this.releaseIP(user.ipAddress);

    const network = Array.from(this.networks.values()).find(n => n.ssid === user.ssid);
    if (network) {
      network.currentUsers = Math.max(0, network.currentUsers - 1);
    }

    this.connectedUsers.delete(userId);
    return true;
  }

  // Create personal WiFi for specific user
  createPersonalWiFi(email: string, phoneNumber?: string): {
    ssid: string;
    password: string;
    ipAddress: string;
    gateway: string;
    dns: string[];
    userId: string;
  } {
    const userId = `personal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const sanitizedEmail = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const ssid = `YoungMeeat-${sanitizedEmail}`;
    const password = this.generateSecurePassword();
    const ipAddress = this.allocateIP();

    const user: WiFiUser = {
      userId,
      email,
      phoneNumber,
      ssid,
      password,
      ipAddress,
      bandwidth: 'unlimited',
      signalStrength: 100,
      connectedAt: new Date(),
      dataUsed: 0,
      status: 'active'
    };

    this.connectedUsers.set(userId, user);

    return {
      ssid,
      password,
      ipAddress,
      gateway: '192.168.100.1',
      dns: ['8.8.8.8', '8.8.4.4', '1.1.1.1'],
      userId
    };
  }

  // Get user WiFi info
  getUserWiFi(userId: string): WiFiUser | undefined {
    return this.connectedUsers.get(userId);
  }

  // Get all connected users
  getConnectedUsers(): WiFiUser[] {
    return Array.from(this.connectedUsers.values()).filter(u => u.status === 'active');
  }

  // Get network info
  getNetwork(networkId: string): WiFiNetwork | undefined {
    return this.networks.get(networkId);
  }

  // Get all networks
  getAllNetworks(): WiFiNetwork[] {
    return Array.from(this.networks.values());
  }

  // Update user bandwidth
  updateBandwidth(userId: string, dataUsed: number): void {
    const user = this.connectedUsers.get(userId);
    if (user) {
      user.dataUsed += dataUsed;
    }
  }

  // Get WiFi statistics
  getStats() {
    const users = this.getConnectedUsers();
    const totalDataUsed = users.reduce((sum, u) => sum + u.dataUsed, 0);

    return {
      totalNetworks: this.networks.size,
      totalUsers: this.connectedUsers.size,
      activeUsers: users.length,
      totalDataUsed,
      averageSignalStrength: users.length > 0
        ? Math.round(users.reduce((sum, u) => sum + u.signalStrength, 0) / users.length)
        : 0,
      ipPoolUtilization: Math.round((this.usedIPs.size / this.ipPool.length) * 100),
      networks: Array.from(this.networks.values()).map(n => ({
        name: n.name,
        ssid: n.ssid,
        currentUsers: n.currentUsers,
        maxUsers: n.maxUsers,
        utilization: Math.round((n.currentUsers / n.maxUsers) * 100)
      }))
    };
  }
}

export const personalWiFiService = new PersonalWiFiService();
