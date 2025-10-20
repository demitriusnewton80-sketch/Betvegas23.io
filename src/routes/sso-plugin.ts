
import express, { Request, Response } from 'express';
import { ssoPluginService } from '../services/SSOPluginService.js';
import { ssoService } from '../services/SSOService.js';

const router = express.Router();

// Middleware for SSO authentication
const requireAuth = (req: Request, res: Response, next: Function) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');

  if (!sessionId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = ssoService.validateSession(sessionId);
  if (!user) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  (req as any).user = user;
  next();
};

// Get all available SSO plugins
router.get('/plugins', (req: Request, res: Response) => {
  const plugins = ssoPluginService.getAllPlugins();
  
  res.json({
    plugins: plugins.map(p => ({
      id: p.id,
      name: p.name,
      provider: p.provider,
      enabled: p.enabled,
      icon: p.metadata?.icon,
      description: p.metadata?.description
    })),
    count: plugins.length
  });
});

// Get enabled SSO plugins
router.get('/plugins/enabled', (req: Request, res: Response) => {
  const plugins = ssoPluginService.getEnabledPlugins();
  
  res.json({
    plugins: plugins.map(p => ({
      id: p.id,
      name: p.name,
      provider: p.provider,
      icon: p.metadata?.icon,
      description: p.metadata?.description,
      authUrl: `/sso-plugin/login/${p.id}`
    })),
    count: plugins.length
  });
});

// Get specific plugin details
router.get('/plugins/:pluginId', requireAuth, (req: Request, res: Response) => {
  const { pluginId } = req.params;
  const plugin = ssoPluginService.getPlugin(pluginId);

  if (!plugin) {
    return res.status(404).json({ error: 'Plugin not found' });
  }

  res.json({
    id: plugin.id,
    name: plugin.name,
    provider: plugin.provider,
    enabled: plugin.enabled,
    metadata: plugin.metadata,
    config: {
      scopes: plugin.config.scopes,
      // Don't expose secrets
      hasClientId: !!plugin.config.clientId,
      hasClientSecret: !!plugin.config.clientSecret
    }
  });
});

// Login with specific SSO plugin
router.get('/login/:pluginId', (req: Request, res: Response) => {
  const { pluginId } = req.params;
  const redirectUri = process.env.SSO_REDIRECT_URI || 'http://0.0.0.0:5000/sso-plugin/callback';
  
  const authUrl = ssoPluginService.getPluginAuthUrl(pluginId, redirectUri);

  if (!authUrl) {
    return res.status(404).json({ 
      error: 'Plugin not found or disabled',
      availablePlugins: ssoPluginService.getEnabledPlugins().map(p => p.id)
    });
  }

  // Store plugin ID in cookie for callback
  res.cookie('sso_plugin_id', pluginId, {
    httpOnly: true,
    maxAge: 10 * 60 * 1000, // 10 minutes
    sameSite: 'lax'
  });

  res.redirect(authUrl);
});

// SSO Plugin callback handler
router.get('/callback', async (req: Request, res: Response) => {
  const { code, error } = req.query;
  const pluginId = req.cookies?.sso_plugin_id;

  if (error) {
    return res.status(400).json({
      error: 'Authentication failed',
      details: error
    });
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({
      error: 'Missing authorization code'
    });
  }

  if (!pluginId) {
    return res.status(400).json({
      error: 'Plugin session expired'
    });
  }

  try {
    const result = await ssoPluginService.authenticateWithPlugin(pluginId, code);

    if (!result.success || !result.user) {
      return res.status(401).json({
        error: result.error || 'Authentication failed',
        pluginId
      });
    }

    // Set session cookie
    res.cookie('session_id', result.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    });

    // Clear plugin ID cookie
    res.clearCookie('sso_plugin_id');

    // Redirect to main app
    res.redirect(`/?authenticated=true&provider=${result.user.provider}`);
  } catch (err) {
    console.error('SSO plugin callback error:', err);
    res.status(500).json({
      error: 'Authentication processing failed'
    });
  }
});

// Enable/disable plugin (admin only)
router.post('/plugins/:pluginId/toggle', requireAuth, (req: Request, res: Response) => {
  const { pluginId } = req.params;
  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'enabled must be a boolean' });
  }

  const success = ssoPluginService.togglePlugin(pluginId, enabled);

  if (!success) {
    return res.status(404).json({ error: 'Plugin not found' });
  }

  res.json({
    message: `Plugin ${enabled ? 'enabled' : 'disabled'}`,
    pluginId,
    enabled
  });
});

// Update plugin configuration (admin only)
router.put('/plugins/:pluginId/config', requireAuth, (req: Request, res: Response) => {
  const { pluginId } = req.params;
  const { clientId, clientSecret, scopes } = req.body;

  const config: any = {};
  if (clientId) config.clientId = clientId;
  if (clientSecret) config.clientSecret = clientSecret;
  if (scopes && Array.isArray(scopes)) config.scopes = scopes;

  const success = ssoPluginService.updatePluginConfig(pluginId, config);

  if (!success) {
    return res.status(404).json({ error: 'Plugin not found' });
  }

  res.json({
    message: 'Plugin configuration updated',
    pluginId
  });
});

// Get plugin statistics
router.get('/stats', requireAuth, (req: Request, res: Response) => {
  const stats = ssoPluginService.getPluginStats();
  res.json(stats);
});

// Get plugin outputs/logs
router.get('/outputs', (req: Request, res: Response) => {
  const { pluginId } = req.query;
  const outputs = ssoPluginService.getOutputs(pluginId as string | undefined);
  
  res.json({
    outputs,
    count: outputs.length
  });
});

// Clear plugin outputs
router.delete('/outputs', requireAuth, (req: Request, res: Response) => {
  const { pluginId } = req.query;
  ssoPluginService.clearOutputs(pluginId as string | undefined);
  
  res.json({
    message: pluginId ? `Outputs cleared for plugin ${pluginId}` : 'All outputs cleared'
  });
});

// Get current user's plugin session
router.get('/session', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const session = ssoPluginService.getPluginSession(userId);

  if (!session) {
    return res.json({
      hasSession: false
    });
  }

  const plugin = ssoPluginService.getPlugin(session.pluginId);

  res.json({
    hasSession: true,
    pluginId: session.pluginId,
    pluginName: plugin?.name,
    provider: plugin?.provider
  });
});

export default router;
