import { EventEmitter } from 'events';
import { randomBytes } from 'crypto';
import { ssoService } from './SSOService.js';

export interface SSOUser {
  id: string;
  email: string;
  name: string;
  provider: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

export interface SSOPlugin {
  id: string;
  name: string;
  provider: string;
  enabled: boolean;
  config: {
    clientId: string;
    clientSecret: string;
    authUrl: string;
    tokenUrl: string;
    userInfoUrl: string;
    scopes: string[];
  };
  metadata?: {
    icon?: string;
    description?: string;
    priority?: number;
  };
}

export interface PluginAuthResult {
  success: boolean;
  user?: SSOUser;
  error?: string;
  pluginId: string;
}

export interface PluginOutput {
  id: string;
  pluginId: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  metadata?: any;
}

class SSOPluginService extends EventEmitter {
  private plugins: Map<string, SSOPlugin> = new Map();
  private pluginSessions: Map<string, { pluginId: string; userId: string }> = new Map();
  private pluginOutputs: PluginOutput[] = [];
  private maxOutputs = 100; // Keep last 100 outputs

  constructor() {
    super();
    this.initializeDefaultPlugins();
  }

  // Add plugin output
  private addOutput(pluginId: string, type: PluginOutput['type'], message: string, metadata?: any) {
    const output: PluginOutput = {
      id: crypto.randomUUID(),
      pluginId,
      timestamp: new Date().toISOString(),
      type,
      message,
      metadata
    };

    this.pluginOutputs.unshift(output);
    if (this.pluginOutputs.length > this.maxOutputs) {
      this.pluginOutputs = this.pluginOutputs.slice(0, this.maxOutputs);
    }

    this.emit('pluginOutput', output);
    return output;
  }

  // Get all outputs
  getOutputs(pluginId?: string): PluginOutput[] {
    if (pluginId) {
      return this.pluginOutputs.filter(o => o.pluginId === pluginId);
    }
    return this.pluginOutputs;
  }

  // Clear outputs
  clearOutputs(pluginId?: string) {
    if (pluginId) {
      this.pluginOutputs = this.pluginOutputs.filter(o => o.pluginId !== pluginId);
    } else {
      this.pluginOutputs = [];
    }
  }

  private initializeDefaultPlugins() {
    // FCC SSO Plugin (already integrated)
    this.registerPlugin({
      id: 'fcc-sso',
      name: 'FCC SSO',
      provider: 'FCC',
      enabled: true,
      config: {
        clientId: process.env.SSO_CLIENT_ID || 'demo-client-id',
        clientSecret: process.env.SSO_CLIENT_SECRET || 'demo-client-secret',
        authUrl: process.env.SSO_AUTH_URL || 'https://provider.example.com/oauth/authorize',
        tokenUrl: process.env.SSO_TOKEN_URL || 'https://provider.example.com/oauth/token',
        userInfoUrl: process.env.SSO_USER_INFO_URL || 'https://provider.example.com/oauth/userinfo',
        scopes: ['openid', 'profile', 'email']
      },
      metadata: {
        icon: '📡',
        description: 'FCC Entity SSO - Primary authentication',
        priority: 1
      }
    });

    // SAM.gov SSO Plugin
    this.registerPlugin({
      id: 'sam-gov-sso',
      name: 'SAM.gov SSO',
      provider: 'SAM.gov',
      enabled: true,
      config: {
        clientId: process.env.SAM_CLIENT_ID || '',
        clientSecret: process.env.SAM_CLIENT_SECRET || '',
        authUrl: 'https://sam.gov/oauth/authorize',
        tokenUrl: 'https://api.sam.gov/oauth/token',
        userInfoUrl: 'https://api.sam.gov/oauth/userinfo',
        scopes: ['openid', 'profile', 'email', 'entity.read']
      },
      metadata: {
        icon: '🏛️',
        description: 'SAM.gov Government SSO',
        priority: 2
      }
    });

    // AWS Cognito Plugin
    this.registerPlugin({
      id: 'aws-cognito',
      name: 'AWS Cognito',
      provider: 'AWS',
      enabled: true,
      config: {
        clientId: process.env.AWS_COGNITO_CLIENT_ID || '',
        clientSecret: process.env.AWS_COGNITO_CLIENT_SECRET || '',
        authUrl: process.env.AWS_COGNITO_AUTH_URL || '',
        tokenUrl: process.env.AWS_COGNITO_TOKEN_URL || '',
        userInfoUrl: process.env.AWS_COGNITO_USER_INFO_URL || '',
        scopes: ['openid', 'profile', 'email', 'aws.cognito.signin.user.admin']
      },
      metadata: {
        icon: '☁️',
        description: 'AWS Cognito User Pools',
        priority: 3
      }
    });

    // GitHub OAuth Plugin
    this.registerPlugin({
      id: 'github-oauth',
      name: 'GitHub',
      provider: 'GitHub',
      enabled: true,
      config: {
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
        scopes: ['read:user', 'user:email']
      },
      metadata: {
        icon: '🐙',
        description: 'GitHub OAuth for developers',
        priority: 4
      }
    });

    // Google OAuth Plugin
    this.registerPlugin({
      id: 'google-oauth',
      name: 'Google',
      provider: 'Google',
      enabled: true,
      config: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scopes: ['openid', 'profile', 'email']
      },
      metadata: {
        icon: '🔐',
        description: 'Google OAuth 2.0',
        priority: 5
      }
    });

    // PlayStation Network SSO Plugin
    this.registerPlugin({
      id: 'playstation-network',
      name: 'PlayStation Network',
      provider: 'Sony PlayStation',
      enabled: true,
      config: {
        clientId: process.env.PSN_CLIENT_ID || '',
        clientSecret: process.env.PSN_CLIENT_SECRET || '',
        authUrl: 'https://auth.api.sonyentertainmentnetwork.com/2.0/oauth/authorize',
        tokenUrl: 'https://auth.api.sonyentertainmentnetwork.com/2.0/oauth/token',
        userInfoUrl: 'https://us-prof.np.community.playstation.net/userProfile/v1/users/me/profile2',
        scopes: ['psn:mobile.v1', 'user:account.get']
      },
      metadata: {
        icon: '🎮',
        description: 'PlayStation Network - Sports Gaming Betting',
        priority: 6
      }
    });
  }

  // Register a new SSO plugin
  registerPlugin(plugin: SSOPlugin): boolean {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} already registered`);
      this.addOutput(plugin.id, 'warning', `Plugin already registered: ${plugin.name}`);
      return false;
    }

    this.plugins.set(plugin.id, plugin);
    this.emit('pluginRegistered', plugin);
    this.addOutput(plugin.id, 'success', `Plugin registered: ${plugin.name}`, { provider: plugin.provider });
    console.log(`✅ SSO Plugin registered: ${plugin.name} (${plugin.id})`);
    return true;
  }

  // Get all plugins
  getAllPlugins(): SSOPlugin[] {
    return Array.from(this.plugins.values()).sort((a, b) => 
      (a.metadata?.priority || 999) - (b.metadata?.priority || 999)
    );
  }

  // Get enabled plugins
  getEnabledPlugins(): SSOPlugin[] {
    return this.getAllPlugins().filter(p => p.enabled);
  }

  // Get plugin by ID
  getPlugin(pluginId: string): SSOPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  // Enable/disable plugin
  togglePlugin(pluginId: string, enabled: boolean): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      this.addOutput(pluginId, 'error', `Plugin not found: ${pluginId}`);
      return false;
    }

    plugin.enabled = enabled;
    this.emit('pluginToggled', { pluginId, enabled });
    this.addOutput(pluginId, enabled ? 'success' : 'info', 
      `Plugin ${enabled ? 'enabled' : 'disabled'}: ${plugin.name}`);
    return true;
  }

  // Generate authorization URL for a specific plugin
  getPluginAuthUrl(pluginId: string, redirectUri: string, state?: string): string | null {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !plugin.enabled) return null;

    const stateParam = state || this.generateState();
    const params = new URLSearchParams({
      client_id: plugin.config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: plugin.config.scopes.join(' '),
      state: stateParam
    });

    return `${plugin.config.authUrl}?${params.toString()}`;
  }

  // Authenticate with specific plugin
  async authenticateWithPlugin(pluginId: string, code: string): Promise<PluginAuthResult> {
    const plugin = this.plugins.get(pluginId);

    if (!plugin || !plugin.enabled) {
      this.addOutput(pluginId, 'error', 'Plugin not found or disabled');
      return {
        success: false,
        error: 'Plugin not found or disabled',
        pluginId
      };
    }

    this.addOutput(pluginId, 'info', `Starting authentication for ${plugin.name}`);

    try {
      // Exchange code for token
      this.addOutput(pluginId, 'info', 'Exchanging authorization code for token');
      const tokenData = await this.exchangeCodeForToken(plugin, code);

      // Get user info
      this.addOutput(pluginId, 'info', 'Fetching user information');
      const userInfo = await this.getUserInfo(plugin, tokenData.access_token);

      // Create SSO user
      const user: SSOUser = {
        id: userInfo.id || userInfo.sub || crypto.randomUUID(),
        email: userInfo.email,
        name: userInfo.name || userInfo.login || userInfo.email,
        provider: plugin.provider,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000)
      };

      // Store plugin session
      this.pluginSessions.set(user.id, { pluginId, userId: user.id });

      this.emit('pluginAuthenticated', { plugin: pluginId, user });
      this.addOutput(pluginId, 'success', `Authentication successful for ${user.email}`, 
        { userId: user.id, provider: plugin.provider });

      return {
        success: true,
        user,
        pluginId
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Authentication failed';
      console.error(`Plugin authentication error (${pluginId}):`, error);
      this.addOutput(pluginId, 'error', `Authentication failed: ${errorMsg}`);
      return {
        success: false,
        error: errorMsg,
        pluginId
      };
    }
  }

  // Exchange authorization code for access token
  private async exchangeCodeForToken(plugin: SSOPlugin, code: string): Promise<any> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.SSO_REDIRECT_URI || 'http://0.0.0.0:5000/auth/callback',
      client_id: plugin.config.clientId,
      client_secret: plugin.config.clientSecret
    });

    const response = await fetch(plugin.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: body.toString()
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Get user info with access token
  private async getUserInfo(plugin: SSOPlugin, accessToken: string): Promise<any> {
    const response = await fetch(plugin.config.userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`User info request failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Update plugin configuration
  updatePluginConfig(pluginId: string, config: Partial<SSOPlugin['config']>): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    plugin.config = { ...plugin.config, ...config };
    this.emit('pluginConfigUpdated', { pluginId, config });
    return true;
  }

  // Get plugin session info
  getPluginSession(userId: string): { pluginId: string; userId: string } | undefined {
    return this.pluginSessions.get(userId);
  }

  // Generate random state
  private generateState(): string {
    return randomBytes(32).toString('hex');
  }

  // Get plugin statistics
  getPluginStats() {
    return {
      totalPlugins: this.plugins.size,
      enabledPlugins: this.getEnabledPlugins().length,
      activeSessions: this.pluginSessions.size,
      plugins: this.getAllPlugins().map(p => ({
        id: p.id,
        name: p.name,
        provider: p.provider,
        enabled: p.enabled
      }))
    };
  }
}

export const ssoPluginService = new SSOPluginService();