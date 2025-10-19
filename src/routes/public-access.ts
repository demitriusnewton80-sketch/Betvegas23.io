
import express, { Request, Response } from 'express';
import { phoneControlService } from '../services/PhoneControlService.js';
import { ssoPluginService } from '../services/SSOPluginService.js';

const router = express.Router();

// Get public access status
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    publicAccess: 'enabled',
    fccEntity: '20130314143016',
    platforms: {
      sportsbook: 'active',
      ps5Betting: 'active',
      streaming: 'active',
      phoneControl: 'active',
      bettingZone: 'active',
      wifiHub: 'active'
    },
    authMethods: {
      sso: ssoPluginService.getEnabledPlugins().length > 0,
      phoneControl: true,
      directAccess: true
    },
    timestamp: new Date().toISOString()
  });
});

// Create public session
router.post('/session/create', (req: Request, res: Response) => {
  const { email, phoneNumber, accessType } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  try {
    const session = phoneControlService.createSession(email, phoneNumber);

    res.json({
      success: true,
      session: {
        id: session.id,
        email: session.email,
        activePlugins: session.activePlugins,
        networkStatus: session.networkStatus
      },
      message: 'Public access session created',
      accessType: accessType || 'phone-control',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create session'
    });
  }
});

// Get available SSO providers
router.get('/sso/providers', (req: Request, res: Response) => {
  const plugins = ssoPluginService.getEnabledPlugins();

  res.json({
    success: true,
    providers: plugins.map(p => ({
      id: p.id,
      name: p.name,
      provider: p.provider,
      icon: p.metadata?.icon,
      description: p.metadata?.description,
      authUrl: `/sso-plugin/login/${p.id}`
    })),
    count: plugins.length,
    timestamp: new Date().toISOString()
  });
});

// Troubleshooting diagnostics endpoint
router.get('/diagnostics', async (req: Request, res: Response) => {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      fccEntity: '20130314143016',
      publicAccess: true,
      tests: {
        server: { status: 'online', uptime: Math.floor(process.uptime()) },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        },
        environment: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT || '5000')
      },
      endpoints: {
        health: '/health',
        api: '/api',
        core: '/api/core/status',
        domain: '/domain/status'
      },
      troubleshooting: {
        dashboard: '/public-troubleshooting.html',
        logs: 'Available via dashboard',
        support: 'gbemeeat@gmail.com'
      }
    };

    res.json({
      success: true,
      ...diagnostics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Diagnostics failed'
    });
  }
});

export default router;
