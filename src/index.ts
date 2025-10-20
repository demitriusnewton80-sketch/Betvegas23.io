import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { startupDiagnostics } from './utils/startup-diagnostics.js';
import { appCore } from './core/AppCore.js';
import { smartCommunication } from './utils/smart-communication.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import sportsbookRoutes from './routes/sportsbook.js';
import streamingRoutes from './routes/streaming.js';
import ps5Routes from './routes/ps5.js';
import ssoPluginRoutes from './routes/sso-plugin.js';
import backupRoutes from './routes/backup.js';
import publicAccessRoutes from './routes/public-access.js';
import domainRoutes from './routes/domain.js';
import vpnRoutes from './routes/vpn.js';
import functionalStructuresRoutes from './routes/functional-structures.js';
import phoneControlRoutes from './routes/phone-control.js';
import smartSystemRoutes from './routes/smart-system.js';
import mobileRoutes from './routes/mobile.js';
import errorRecoveryRoutes from './routes/error-recovery.js';
import businessRelationshipsRouter from './routes/business-relationships.js';
import espnTrackerRoutes from './routes/espn-tracker.js';
import espnBettingRoutes from './routes/espn-betting.js';
import versionRoutes from './routes/version.js';
import awsAccountRoutes from './routes/aws-account.js';
import accountRoutes from './routes/account.js';
import authRoutes from './routes/auth.js';
import smartTroubleshootingRoutes from './routes/smart-troubleshooting.js';
import functionalRelationshipsBridgeRoutes from './routes/functional-relationships-bridge.js';
import debugEndpoints from './routes/debug-endpoints.js';
import apiTroubleshootingRoutes from './routes/api-troubleshooting.js';
import winnerPayoutRouter from './routes/winner-payout.js';
import wifiInfusionRouter from './routes/wifi-infusion.js';
import personalWiFiRouter from './routes/personal-wifi.js';
import systemHealthRouter from './routes/system-health.js';
import contentRollbackRouter from './routes/content-rollback.js';
import portManagementRoutes from './routes/port-management.js';
import publicSportsIntelRoutes from './routes/public-sports-intel.js';
import streamingPortalRoutes from './routes/streaming-portal.js';
import googlePortLauncherRoutes from './routes/google-port-launcher.js';
import fusionLaunchRoutes from './routes/fusion-launch.js';
import portAllianceRoutes from './routes/port-alliance.js';
import smartTunnelRoutes from './routes/smart-tunnel.js';

const app = express();
const PORT = parseInt(process.env.PORT || '5000');
const HOST = '0.0.0.0'; // Bind to 0.0.0.0 for external accessibility

// Middleware
app.disable('x-powered-by');
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// API routes
app.use('/sportsbook', sportsbookRoutes);
app.use('/streaming', streamingRoutes);
app.use('/api/streaming', streamingRoutes); // Alternative path for frontend compatibility
app.use('/ps5', ps5Routes);
app.use('/sso-plugin', ssoPluginRoutes);
app.use('/backup', backupRoutes);
app.use('/public-access', publicAccessRoutes);
app.use('/domain', domainRoutes);
app.use('/vpn', vpnRoutes);
app.use('/functional-structures', functionalStructuresRoutes);
app.use('/phone-control', phoneControlRoutes);
app.use('/smart-system', smartSystemRoutes);
app.use('/mobile', mobileRoutes);
app.use('/error-recovery', errorRecoveryRoutes);
app.use('/business-relationships', businessRelationshipsRouter);
app.use('/espn-tracker', espnTrackerRoutes);
app.use('/espn-betting', espnBettingRoutes);
app.use('/version', versionRoutes);
app.use('/api/aws-account', awsAccountRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/auth', authRoutes);
app.use('/smart-troubleshooting', smartTroubleshootingRoutes);
app.use('/functional-relationships-bridge', functionalRelationshipsBridgeRoutes);
app.use('/debug', debugEndpoints);
app.use('/api-troubleshooting', apiTroubleshootingRoutes);
app.use('/winner-payout', winnerPayoutRouter);
app.use('/wifi-infusion', wifiInfusionRouter);
app.use('/personal-wifi', personalWiFiRouter);
app.use('/system-health', systemHealthRouter);
app.use('/content-rollback', contentRollbackRouter);
app.use('/port-management', portManagementRoutes);
app.use('/public-sports-intel', publicSportsIntelRoutes);
app.use('/streaming-portal', streamingPortalRoutes);
app.use('/google-port-launcher', googlePortLauncherRoutes);
app.use('/fusion-launch', fusionLaunchRoutes);
app.use('/port-alliance', portAllianceRoutes);
app.use('/smart-tunnel', smartTunnelRoutes);

// Remote Streaming Control Routes
import remoteStreamingControlRoutes from './routes/remote-streaming-control.js';
app.use('/remote-streaming-control', remoteStreamingControlRoutes);

// Serve static files from public directory
app.use(express.static('public'));

// Main Betting Sites homepage
app.get('/betting-sites', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/betting-sites-home.html'));
});

// Smart communication status
app.get('/smart-communication/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    communication: smartCommunication.getStats(),
    fccEntity: '20130314143016'
  });
});

// Main route
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API 404 handler - must come before SPA catch-all
app.use('/api/*', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.path
  });
});

app.use('/streaming/*', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(404).json({
    success: false,
    error: 'Streaming endpoint not found',
    path: req.path
  });
});

// Catch-all for SPA - only for non-API routes
app.get('*', (req: Request, res: Response) => {
  // Don't catch API routes
  if (req.path.startsWith('/api/') ||
      req.path.startsWith('/streaming/') ||
      req.path.startsWith('/sportsbook/') ||
      req.path.startsWith('/error-recovery/') ||
      req.path.startsWith('/smart-troubleshooting/') ||
      req.path.startsWith('/debug/') ||
      req.path.startsWith('/api-troubleshooting/')) {
    return res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      path: req.path
    });
  }

  // For file requests, return 404
  if (req.path.includes('.')) {
    return res.status(404).send('Not found');
  }

  // Otherwise serve index.html
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', err.message || err);

  // Always return JSON, never HTML
  res.setHeader('Content-Type', 'application/json');
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message || 'An unexpected error occurred.',
    fccEntity: '20130314143016'
  });
});

// Create HTTP server
const httpServer = createServer(app);

// WebSocket
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  console.log('WebSocket connected');
  ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));

  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      ws.send(JSON.stringify({ type: 'echo', received: message }));
    } catch (error) {
      console.error('WebSocket error:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Failed to process message.' }));
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket connection error:', error);
  });
});

// Initialize app core
appCore.initialize();

// Initialize smart troubleshooting
import { smartTroubleshootingCore } from './core/SmartTroubleshootingCore.js';
console.log('🔧 Smart Troubleshooting Core: ACTIVE');

// Initialize smart tunnel
import { smartTunnelCore } from './core/SmartTunnelCore.js';
smartTunnelCore.hostAllAspects();
console.log('🌐 Smart Tunnel Core: ACTIVE');

// Start server with diagnostics
startupDiagnostics.runDiagnostics().then(diagnostics => {
  if (!diagnostics.success) {
    console.error('⚠️  Starting with errors - some features may not work');
  }

  httpServer.listen(PORT, HOST, () => {
    console.log('═══════════════════════════════════════════════════');
    console.log('🏈 Young Meeat LLC Sportsbook');
    console.log('═══════════════════════════════════════════════════');
    console.log(`🚀 Server running on: http://${HOST}:${PORT}`);
    console.log(`📡 FCC Entity: 20130314143016`);
    console.log(`🌐 Web URL: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📱 Phone Control: ENABLED`);
    console.log(`🔄 Smart Recovery: ACTIVE`);
    console.log('═══════════════════════════════════════════════════');

    // Test endpoint access
    console.log('\n📍 Available endpoints:');
    console.log(`  • Sportsbook: http://${HOST}:${PORT}/sportsbook/games`);
    console.log(`  • Streaming: http://${HOST}:${PORT}/streaming/fusion/status`);
    console.log(`  • Phone Control: http://${HOST}:${PORT}/phone-control/stats`);
    console.log(`  • Smart System: http://${HOST}:${PORT}/smart-system/status`);
    console.log(`  • Mobile: http://${HOST}:${PORT}/mobile/stats`);
    console.log(`  • Version: http://${HOST}:${PORT}/version`);
    console.log(`  • AWS Account: http://${HOST}:${PORT}/api/aws-account/status`); // Added endpoint for AWS Account
    console.log(`  • API Troubleshooting: http://${HOST}:${PORT}/api-troubleshooting/status`);
    console.log(`  • Smart Tunnel: http://${HOST}:${PORT}/smart-tunnel/status`);
    console.log('\n');
  });

  httpServer.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Trying alternate port...`);
      const altPort = PORT + 1;
      // Ensure the alternate port is also checked for availability if it's already in use
      httpServer.listen(altPort, HOST, () => {
        console.log(`🚀 Server started on alternate port: ${altPort}`);
      });
      httpServer.on('error', (altError: any) => {
        if (altError.code === 'EADDRINUSE') {
          console.error(`❌ Alternate port ${altPort} is also in use. Please check running processes.`);
          process.exit(1); // Exit if the alternate port is also in use
        } else {
          console.error('❌ Server error on alternate port:', altError);
          process.exit(1); // Exit on other server errors
        }
      });
    } else {
      console.error('❌ Server error:', error);
      process.exit(1); // Exit on other server errors
    }
  });
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  httpServer.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Attempt to gracefully shut down or restart, depending on desired behavior
  // For now, we'll log and exit to prevent further issues.
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Log the rejection and potentially exit or take other recovery actions
  process.exit(1);
});