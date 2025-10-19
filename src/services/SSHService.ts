
import { EventEmitter } from 'events';
import crypto from 'crypto';
import { ssoService } from './SSOService.js';

interface SSHKey {
  id: string;
  userId: string;
  publicKey: string;
  fingerprint: string;
  label: string;
  createdAt: string;
  lastUsed?: string;
}

interface SSHSession {
  id: string;
  userId: string;
  keyId: string;
  ipAddress: string;
  connectedAt: string;
  lastActivity: string;
  status: 'active' | 'disconnected';
}

interface SSHConfig {
  host: string;
  port: number;
  user: string;
  allowedIPs?: string[];
  maxSessions: number;
}

class SSHService extends EventEmitter {
  private sshKeys: Map<string, SSHKey> = new Map();
  private activeSessions: Map<string, SSHSession> = new Map();
  private readonly FCC_ENTITY = '20130314143016';
  private readonly DEFAULT_PORT = 22;

  constructor() {
    super();
  }

  // Add SSH public key for user
  addSSHKey(
    userId: string,
    publicKey: string,
    label: string
  ): { success: boolean; key?: SSHKey; error?: string } {
    // Validate public key format
    if (!this.validatePublicKey(publicKey)) {
      return { success: false, error: 'Invalid SSH public key format' };
    }

    const keyId = `SSH-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const fingerprint = this.generateFingerprint(publicKey);

    // Check for duplicate keys
    const existingKey = Array.from(this.sshKeys.values()).find(
      key => key.fingerprint === fingerprint && key.userId === userId
    );

    if (existingKey) {
      return { success: false, error: 'SSH key already exists' };
    }

    const sshKey: SSHKey = {
      id: keyId,
      userId,
      publicKey,
      fingerprint,
      label,
      createdAt: new Date().toISOString()
    };

    this.sshKeys.set(keyId, sshKey);
    this.emit('sshKeyAdded', sshKey);

    return { success: true, key: sshKey };
  }

  // Get user's SSH keys
  getUserSSHKeys(userId: string): SSHKey[] {
    return Array.from(this.sshKeys.values()).filter(key => key.userId === userId);
  }

  // Remove SSH key
  removeSSHKey(userId: string, keyId: string): { success: boolean; error?: string } {
    const key = this.sshKeys.get(keyId);

    if (!key) {
      return { success: false, error: 'SSH key not found' };
    }

    if (key.userId !== userId) {
      return { success: false, error: 'Access denied' };
    }

    this.sshKeys.delete(keyId);
    this.emit('sshKeyRemoved', { userId, keyId });

    return { success: true };
  }

  // Authenticate SSH connection
  authenticateSSH(
    publicKey: string,
    ipAddress: string
  ): { success: boolean; session?: SSHSession; error?: string } {
    const fingerprint = this.generateFingerprint(publicKey);
    
    // Find matching key
    const sshKey = Array.from(this.sshKeys.values()).find(
      key => key.fingerprint === fingerprint
    );

    if (!sshKey) {
      return { success: false, error: 'SSH key not authorized' };
    }

    // Check max sessions
    const userSessions = Array.from(this.activeSessions.values()).filter(
      s => s.userId === sshKey.userId && s.status === 'active'
    );

    if (userSessions.length >= 5) {
      return { success: false, error: 'Maximum concurrent sessions reached' };
    }

    // Create session
    const sessionId = `SESSION-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const session: SSHSession = {
      id: sessionId,
      userId: sshKey.userId,
      keyId: sshKey.id,
      ipAddress,
      connectedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      status: 'active'
    };

    this.activeSessions.set(sessionId, session);
    
    // Update key last used
    sshKey.lastUsed = new Date().toISOString();
    this.sshKeys.set(sshKey.id, sshKey);

    this.emit('sshSessionStarted', session);

    return { success: true, session };
  }

  // Get SSH connection configuration
  getSSHConfig(userId: string): SSHConfig {
    const hostname = process.env.REPLIT_DEV_DOMAIN || 'replit.dev';
    
    return {
      host: `${userId}.${hostname}`,
      port: this.DEFAULT_PORT,
      user: userId,
      maxSessions: 5
    };
  }

  // Generate SSH connection command
  generateSSHCommand(userId: string, keyPath: string = '~/.ssh/replit'): string {
    const config = this.getSSHConfig(userId);
    return `ssh -i ${keyPath} -p ${config.port} ${config.user}@${config.host}`;
  }

  // Get active sessions for user
  getUserSessions(userId: string): SSHSession[] {
    return Array.from(this.activeSessions.values()).filter(
      s => s.userId === userId && s.status === 'active'
    );
  }

  // Disconnect session
  disconnectSession(sessionId: string): { success: boolean; error?: string } {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    session.status = 'disconnected';
    this.activeSessions.set(sessionId, session);
    this.emit('sshSessionEnded', session);

    return { success: true };
  }

  // Validate SSH public key format
  private validatePublicKey(publicKey: string): boolean {
    const sshKeyPattern = /^(ssh-rsa|ssh-ed25519|ecdsa-sha2-nistp256|ecdsa-sha2-nistp384|ecdsa-sha2-nistp521)\s+[A-Za-z0-9+/]+[=]{0,3}(\s+.+)?$/;
    return sshKeyPattern.test(publicKey.trim());
  }

  // Generate SSH key fingerprint
  private generateFingerprint(publicKey: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(publicKey.trim());
    return `SHA256:${hash.digest('base64').replace(/=+$/, '')}`;
  }

  // Get SSH statistics
  getSSHStats(): {
    totalKeys: number;
    activeSessions: number;
    totalUsers: number;
  } {
    const uniqueUsers = new Set(Array.from(this.sshKeys.values()).map(k => k.userId));
    const activeSessions = Array.from(this.activeSessions.values()).filter(
      s => s.status === 'active'
    );

    return {
      totalKeys: this.sshKeys.size,
      activeSessions: activeSessions.length,
      totalUsers: uniqueUsers.size
    };
  }
}

export const sshService = new SSHService();
