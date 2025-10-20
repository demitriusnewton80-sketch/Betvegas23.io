
import express, { Request, Response } from 'express';
import { portManagementCore } from '../core/PortManagementCore.js';

const router = express.Router();

interface PortApp {
  port: number;
  name: string;
  description: string;
  path: string;
  icon: string;
  status: 'active' | 'inactive' | 'error';
}

// Port-to-App mapping
const portApps: PortApp[] = [
  {
    port: 5000,
    name: 'Main Sportsbook',
    description: 'Primary betting platform with live odds',
    path: '/sportsbook-landing.html',
    icon: '🏈',
    status: 'active'
  },
  {
    port: 3000,
    name: 'Sports Intelligence',
    description: 'ESPN data & Google Maps integration',
    path: '/public-sports-intel.html',
    icon: '🌎',
    status: 'active'
  },
  {
    port: 3001,
    name: 'Streaming Hub',
    description: 'Live sports streaming portal',
    path: '/streaming-deployment-dashboard.html',
    icon: '📡',
    status: 'active'
  },
  {
    port: 3002,
    name: 'Port Management',
    description: 'Microsoft-style port control',
    path: '/port-management-portal.html',
    icon: '🔌',
    status: 'active'
  },
  {
    port: 3003,
    name: 'PS5 Betting',
    description: 'PlayStation Network integration',
    path: '/ps5-betting.html',
    icon: '🎮',
    status: 'active'
  }
];

// Get all available port apps
router.get('/apps', (req: Request, res: Response) => {
  const landscape = portManagementCore.getPortLandscape();
  
  const appsWithStatus = portApps.map(app => {
    const portStatus = landscape.ports.find(p => p.port === app.port);
    return {
      ...app,
      status: portStatus?.status || 'inactive',
      responseTime: portStatus?.responseTime || 0,
      errorCount: portStatus?.errorCount || 0
    };
  });

  res.json({
    success: true,
    apps: appsWithStatus,
    totalApps: appsWithStatus.length,
    activeApps: appsWithStatus.filter(a => a.status === 'active').length,
    fccEntity: '20130314143016'
  });
});

// Launch app from specific port
router.post('/launch', (req: Request, res: Response) => {
  const { port, googleToken } = req.body;

  if (!port) {
    return res.status(400).json({
      success: false,
      error: 'Port number required'
    });
  }

  const app = portApps.find(a => a.port === parseInt(port));
  
  if (!app) {
    return res.status(404).json({
      success: false,
      error: 'App not found for this port'
    });
  }

  const portStatus = portManagementCore.getPortStatus(parseInt(port));

  res.json({
    success: true,
    app: {
      name: app.name,
      port: app.port,
      launchUrl: `http://0.0.0.0:${app.port}${app.path}`,
      publicUrl: `${req.protocol}://${req.get('host')}${app.path}`,
      status: portStatus?.status || 'unknown'
    },
    googleAuth: googleToken ? 'verified' : 'not_provided',
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Get Google OAuth configuration
router.get('/google-config', (req: Request, res: Response) => {
  res.json({
    success: true,
    oauth: {
      clientId: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
      scopes: ['profile', 'email'],
      redirectUri: `${req.protocol}://${req.get('host')}/google-port-launcher/callback`
    },
    fccEntity: '20130314143016'
  });
});

// OAuth callback handler
router.get('/callback', (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect('/google-port-launch.html?error=oauth_failed');
  }

  // Redirect to launcher with auth success
  res.redirect('/google-port-launch.html?auth=success');
});

export default router;
