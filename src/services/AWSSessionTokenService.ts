
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

interface AWSSessionToken {
  token: string;
  expiresAt?: Date;
  region: string;
  createdAt: Date;
}

class AWSSessionTokenService extends EventEmitter {
  private static instance: AWSSessionTokenService;
  private sessionToken: AWSSessionToken | null = null;

  private constructor() {
    super();
    this.initialize();
  }

  static getInstance(): AWSSessionTokenService {
    if (!AWSSessionTokenService.instance) {
      AWSSessionTokenService.instance = new AWSSessionTokenService();
    }
    return AWSSessionTokenService.instance;
  }

  private async initialize() {
    // Load token from environment variable if available
    const envToken = process.env.AWS_SESSION_TOKEN;
    
    if (envToken) {
      this.sessionToken = {
        token: envToken,
        region: process.env.AWS_REGION || 'us-east-1',
        createdAt: new Date()
      };
      
      console.log('✅ AWS Session Token loaded from environment');
    } else {
      console.warn('⚠️ AWS Session Token not found in environment variables');
    }
  }

  // Set session token (use this after loading from Secrets)
  setToken(token: string, region: string = 'us-east-1', expiresAt?: Date): void {
    this.sessionToken = {
      token,
      region,
      createdAt: new Date(),
      expiresAt
    };
    
    this.emit('token:updated');
    console.log('✅ AWS Session Token updated');
  }

  // Get current session token
  getToken(): string | null {
    if (!this.sessionToken) {
      return null;
    }

    // Check if token is expired
    if (this.sessionToken.expiresAt && this.sessionToken.expiresAt < new Date()) {
      console.warn('⚠️ AWS Session Token has expired');
      return null;
    }

    return this.sessionToken.token;
  }

  // Check if token is valid and not expired
  isValid(): boolean {
    if (!this.sessionToken) {
      return false;
    }

    if (this.sessionToken.expiresAt && this.sessionToken.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  // Get token info
  getTokenInfo(): AWSSessionToken | null {
    return this.sessionToken;
  }

  // Load token from file (for migration purposes)
  async loadFromFile(filePath: string): Promise<boolean> {
    try {
      const tokenContent = await fs.readFile(filePath, 'utf-8');
      const token = tokenContent.trim();
      
      this.sessionToken = {
        token,
        region: process.env.AWS_REGION || 'us-east-1',
        createdAt: new Date()
      };
      
      console.log('✅ AWS Session Token loaded from file');
      return true;
    } catch (error) {
      console.error('❌ Failed to load AWS Session Token from file:', error);
      return false;
    }
  }

  // Clear token
  clearToken(): void {
    this.sessionToken = null;
    this.emit('token:cleared');
    console.log('🗑️ AWS Session Token cleared');
  }
}

export const awsSessionTokenService = AWSSessionTokenService.getInstance();
