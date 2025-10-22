import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';

// Import routes
import authRoutes from './routes/auth.js';
import bettingRoutes from './routes/sportsbook.js';
import boxingUFCRoutes from './routes/boxing-ufc.js';
import streamingRoutes from './routes/streaming.js';
import sportsRadioRoutes from './routes/sports-radio.js';
import espnTrackerRoutes from './routes/espn-tracker.js';
import espnBettingRoutes from './routes/espn-betting.js';
import ps5Routes from './routes/ps5.js';
import web3Routes from './routes/web3.js';
import ssoPluginRoutes from './routes/sso-plugin.js';
import ssoMarketplaceRoutes from './routes/sso-marketplace.js';
import smartSystemRoutes from './routes/smart-system.js';
import smartTroubleshootingRoutes from './routes/smart-troubleshooting.js';
import fusionTroubleshootingRoutes from './routes/fusion-troubleshooting.js';
import transformerRoutes from './routes/transformer.js';
import vibeStudioTransformerRoutes from './routes/vibe-studio-transformer.js';
import wifiWeb3FusionRoutes from './routes/wifi-web3-fusion.js';
import errorRecoveryRoutes from './routes/error-recovery.js';
import apiTroubleshootingRoutes from './routes/api-troubleshooting.js';
import apiFusionRoutes from './routes/api-fusion.js';
import fusionAssemblyRouter from './routes/fusion-assembly.js';
import contractCallbackRouter from './routes/contract-callbacks.js';
import portManagementRouter from './routes/port-management.js';
import portStreamingRouter from './routes/port-streaming.js';
import remoteStreamingControlRouter from './routes/remote-streaming-control.js';
import functionalStructuresRouter from './routes/functional-structures.js';
import contentIntegrityRouter from './routes/content-integrity.js';
import { contentIntegrityService } from './services/ContentIntegrityService.js';
import jsonSyncRoutes from './routes/json-sync.js';
import workflowLandscapeRouter from './routes/workflow-landscape.js';
import smartCommunicationFusionRouter from './routes/smart-communication-fusion.js';
import feedBuilderRoutes from './routes/feed-builder.js';
import phoneControlRoutes from './routes/phone-control.js';
import backupRoutes from './routes/backup.js';
import versionRoutes from './routes/version.js';
import parlayRoutes from './routes/parlay.js';
import applePartnershipRouter from './routes/apple-partnership.js';
import falconBroadcastRoutes from './routes/falcon-broadcast.js';
import partnershipEnrollmentRouter from './routes/partnership-enrollment.js';
import phoneStreamRoutes from './routes/phone-stream.js';
import bloombergPhoneBridgeRoutes from './routes/bloomberg-phone-bridge.js';
import terminalBridgeRoutes from './routes/terminal-bridge.js';
import bridgePortFusionRoutes from './routes/bridge-port-fusion.js';
import oddsAggregatorRoutes from './routes/odds-aggregator.js';
import liveChatRoutes from './routes/live-chat.js';
import advancedAnalyticsRoutes from './routes/advanced-analytics.js';
import dunContentPeersRoutes from './routes/dun-content-peers.js';
import arnFinderRoutes from './routes/arn-finder.js';
import awsRoutes from './routes/aws.js';
import awsCoreBuilderRoutes from './routes/aws-core-builder.js';
import awsSessionRoutes from './routes/aws-session.js';
import leedsExportRoutes from './routes/leeds-export.js';
import waveStreamAssemblyRoutes from './routes/wave-stream-assembly.js';
import radioBroadcastDeploymentRoutes from './routes/radio-broadcast-deployment.js'; // Import the new route
import unifiedStylesheetRouter from './routes/unified-stylesheet.js';
import phoneAppBridgeRouter from './routes/phone-app-bridge.js'; // Import the new route
import aiRoutes from './routes/ai.js';
import openaiRoutes from './routes/openai.js';
import githubRecoveryRoutes from './routes/github-recovery.js';
import firebaseStudioRouter from './routes/firebase-studio.js';
import firebaseStreamRouter from './routes/firebase-stream.js';
import broadcastExportRoutes from './routes/broadcast-export.js';
import liveMediaGeneratorRoutes from './routes/live-media-generator.js';

// Initialize core systems
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT: number = parseInt(process.env.PORT || '5000', 10);

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Ensure JSON responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Override for static files
app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    } else if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// API Routes (must be before static files)
try {
  app.use('/auth', authRoutes);
  app.use('/sportsbook', bettingRoutes);
  app.use('/boxing-ufc', boxingUFCRoutes);
  app.use('/streaming', streamingRoutes);
  app.use('/sports-radio', sportsRadioRoutes);
  app.use('/espn-tracker', espnTrackerRoutes);
  app.use('/espn-betting', espnBettingRoutes);
  app.use('/ps5', ps5Routes);
  app.use('/web3', web3Routes);
  app.use('/sso-plugin', ssoPluginRoutes);
  app.use('/sso-marketplace', ssoMarketplaceRoutes);
  app.use('/smart-system', smartSystemRoutes);
  app.use('/phone-control', phoneControlRoutes);
  app.use('/backup', backupRoutes);
  app.use('/version', versionRoutes);
  app.use('/parlay', parlayRoutes);
  app.use('/smart-system', smartSystemRoutes);
  app.use('/smart-troubleshooting', smartTroubleshootingRoutes);
  app.use('/fusion-troubleshooting', fusionTroubleshootingRoutes);
  app.use('/transformer', transformerRoutes);
  app.use('/vibe-studio-transformer', vibeStudioTransformerRoutes);
  app.use('/wifi-web3-fusion', wifiWeb3FusionRoutes);
  app.use('/error-recovery', errorRecoveryRoutes);
  app.use('/api-troubleshooting', apiTroubleshootingRoutes);
  app.use('/api-fusion', apiFusionRoutes);
  app.use('/fusion-assembly', fusionAssemblyRouter);
  app.use('/contract-callbacks', contractCallbackRouter);
  app.use('/port-management', portManagementRouter);
  app.use('/port-streaming', portStreamingRouter);
  app.use('/remote-streaming-control', remoteStreamingControlRouter);
  app.use('/functional-structures', functionalStructuresRouter);
  app.use('/content-integrity', contentIntegrityRouter);
  app.use('/phone-stream', phoneStreamRoutes);
  app.use('/bloomberg-phone-bridge', bloombergPhoneBridgeRoutes);
  app.use('/bridge-port-fusion', bridgePortFusionRoutes);
  app.use('/odds-aggregator', oddsAggregatorRoutes);
  app.use('/live-chat', liveChatRoutes);
  app.use('/advanced-analytics', advancedAnalyticsRoutes);
  app.use('/dun-content-peers', dunContentPeersRoutes);
  app.use('/arn-finder', arnFinderRoutes);
  app.use('/aws', awsRoutes);
  app.use('/aws-core-builder', awsCoreBuilderRoutes);
  app.use('/aws-session', awsSessionRoutes);
  app.use('/leeds-export', leedsExportRoutes);
  app.use('/wave-stream-assembly', waveStreamAssemblyRouter);
  app.use('/radio-broadcast-deployment', radioBroadcastDeploymentRoutes); // Mount the new route
  app.use('/falcon-broadcast', falconBroadcastRoutes);
  app.use('/broadcast-export', broadcastExportRoutes);
  app.use('/live-media-generator', liveMediaGeneratorRoutes);
  // Unified Stylesheet API
  app.use('/api/stylesheet', unifiedStylesheetRouter);
  // Mount phone app bridge routes
  app.use('/api/phone-app-bridge', phoneAppBridgeRouter);
  app.use('/ai', aiRoutes);
  app.use('/openai', openaiRoutes);
  app.use('/github-recovery', githubRecoveryRoutes);
  app.use('/feed-builder', feedBuilderRoutes);
  app.use('/json-sync', jsonSyncRoutes);
  app.use('/smart-communication-fusion', smartCommunicationFusionRouter);
  app.use('/workflow-landscape', workflowLandscapeRouter);
  app.use('/firebase-studio', firebaseStudioRouter);
app.use('/firebase-stream', firebaseStreamRouter);
  console.log('✅ All API routes registered successfully');
} catch (error) {
  console.error('❌ Error registering routes:', error);
}

// Static files (must be after API routes)
app.use(express.static(path.join(__dirname, '../public')));

// Root route - serve functional structures sportsbook
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/functional-sportsbook-structures.html'));
});

// Alternative production sportsbook route
app.get('/production', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/my-public-sportsbook.html'));
});

// Legacy routes
app.get('/bettingsites-home', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/bettingsites-home.html'));
});

// BettingSites branding endpoint
app.get('/api/brand', (req: Request, res: Response) => {
  res.json({
    name: 'BettingSites™',
    trademark: '™',
    company: 'Young Meeat LLC',
    fccEntity: '20130314143016',
    fccRegistration: '0024454324',
    poweredBy: 'Amazon Web Services (AWS)',
    services: {
      streaming: 'Live Sports Video & Audio',
      radio: 'Sports Radio Broadcasting',
      betting: 'Real-Time Sports Betting',
      gaming: 'PlayStation 5 Integration'
    },
    copyright: '© 2025 Young Meeat LLC. All rights reserved.',
    design: 'Logo & Brand Design by AWS'
  });
});

// Unified public sportsbook
app.get('/unified', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/unified-public-sportsbook-complete.html'));
});

// SPA fallback for all HTML routes
app.get('*', (req: Request, res: Response) => {
  if (req.path.endsWith('.html') || !req.path.includes('.')) {
    const filePath = path.join(__dirname, '../public', req.path.endsWith('.html') ? req.path : 'index.html');
    res.sendFile(filePath, (err) => {
      if (err) {
        res.sendFile(path.join(__dirname, '../public/bettingsites-home.html'));
      }
    });
  } else {
    res.status(404).json({ error: 'Not found', brand: 'BettingSites™' });
  }
});

// API 404 handlers - must come before SPA catch-all
app.use('/api/*', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(404).json({
    error: 'API endpoint not found',
    brand: 'BettingSites™',
    fccEntity: '20130314143016'
  });
});

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Initialize core systems BEFORE starting server
async function initializeAndStartServer() {
  try {
    console.log('🔄 Initializing core systems...');

    // Load environment from certificate files
    const { environmentLoader } = await import('./services/EnvironmentLoaderService.js');
    await environmentLoader.loadFromCertificate();
    console.log('✅ Environment loaded from certificates');

    const { appCore } = await import('./core/AppCore.js');
    appCore.initialize();
    console.log('✅ AppCore initialized');

    // Initialize other systems
    const { smartTroubleshootingCore } = await import('./core/SmartTroubleshootingCore.js');
    console.log('✅ SmartTroubleshooting ready');

    const { errorRecoverySystem } = await import('./core/ErrorRecoverySystem.js');
    console.log('✅ ErrorRecovery ready');

    const { fusionAssemblyCore } = await import('./core/FusionAssemblyCore.js');
    console.log('✅ FusionAssembly ready');

    // Initialize JSON Sync Service
    const { jsonSyncService } = await import('./services/JSONSyncService.js');
    console.log('✅ JSONSync ready');

    // Initialize Content Integrity Service
    contentIntegrityService.initialize();
    console.log('✅ ContentIntegrityService ready');

    // Initialize Bridge-Port Fusion Core
    const { bridgePortFusionCore } = await import('./core/BridgePortFusionCore.js');
    console.log('✅ BridgePortFusion ready');

    console.log('✅ All core systems initialized successfully\n');

    // NOW start the server after everything is ready
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎯 BettingSites™ - Live Sports Streaming & Betting    ║
║                                                           ║
║   Powered by Amazon Web Services (AWS)                   ║
║   Young Meeat LLC | FCC: 20130314143016                  ║
║                                                           ║
║   Server running on http://0.0.0.0:${PORT}                    ║
║   ✅ All systems operational                             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

  } catch (error) {
    console.error('❌ Core system initialization error:', error);
    console.error('⚠️  Starting server anyway with limited functionality...');

    // Start server even if initialization fails
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`⚠️  Server running on http://0.0.0.0:${PORT} (degraded mode)`);
    });
  }
}

// Start initialization
initializeAndStartServer();

// Workflow landscape already mounted in routes section above

// Health check endpoint
// Note: This is a placeholder and might need further implementation
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', service: 'BettingSites API', timestamp: new Date().toISOString() });
});

export default app;