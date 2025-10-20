import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';

// Import routes
import sportsbookRoutes from './routes/sportsbook.js';
import streamingRoutes from './routes/streaming.js';
import sportsRadioRoutes from './routes/sports-radio.js';
import espnTrackerRoutes from './routes/espn-tracker.js';
import espnBettingRoutes from './routes/espn-betting.js';
import ps5Routes from './routes/ps5.js';
import web3Routes from './routes/web3.js';
import ssoPluginRoutes from './routes/sso-plugin.js';
import phoneControlRoutes from './routes/phone-control.js';
import backupRoutes from './routes/backup.js';
import versionRoutes from './routes/version.js';
import parlayRoutes from './routes/parlay.js';
import smartSystemRoutes from './routes/smart-system.js';
import smartTroubleshootingRoutes from './routes/smart-troubleshooting.js';
import fusionTroubleshootingRoutes from './routes/fusion-troubleshooting.js';
import wifiWeb3FusionRoutes from './routes/wifi-web3-fusion.js';
import errorRecoveryRoutes from './routes/error-recovery.js';
import apiTroubleshootingRoutes from './routes/api-troubleshooting.js';
import apiFusionRoutes from './routes/api-fusion.js';
import fusionAssemblyRouter from './routes/fusion-assembly.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes (must be before static files)
app.use('/sportsbook', sportsbookRoutes);
app.use('/streaming', streamingRoutes);
app.use('/sports-radio', sportsRadioRoutes);
app.use('/espn-tracker', espnTrackerRoutes);
app.use('/espn-betting', espnBettingRoutes);
app.use('/ps5', ps5Routes);
app.use('/web3', web3Routes);
app.use('/sso-plugin', ssoPluginRoutes);
app.use('/phone-control', phoneControlRoutes);
app.use('/backup', backupRoutes);
app.use('/version', versionRoutes);
app.use('/parlay', parlayRoutes);
app.use('/smart-system', smartSystemRoutes);
app.use('/smart-troubleshooting', smartTroubleshootingRoutes);
app.use('/fusion-troubleshooting', fusionTroubleshootingRoutes);
app.use('/wifi-web3-fusion', wifiWeb3FusionRoutes);
app.use('/error-recovery', errorRecoveryRoutes);
app.use('/api-troubleshooting', apiTroubleshootingRoutes);
app.use('/api-fusion', apiFusionRoutes);
app.use('/fusion-assembly', fusionAssemblyRouter);

// Static files (must be after API routes)
app.use(express.static(path.join(__dirname, '../public')));

// Root route - redirect to BettingSites home
app.get('/', (req: Request, res: Response) => {
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

// Start server
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
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Initialize core systems with error handling
import { appCore } from './core/AppCore.js';
import { smartTroubleshootingCore } from './core/SmartTroubleshootingCore.js';
import { errorRecoverySystem } from './core/ErrorRecoverySystem.js';
import { fusionAssemblyCore } from './core/FusionAssemblyCore.js';

try {
  appCore.initialize();
  console.log('✅ AppCore initialized');
  
  // Initialize other systems
  smartTroubleshootingCore;
  console.log('✅ SmartTroubleshooting ready');
  
  errorRecoverySystem;
  console.log('✅ ErrorRecovery ready');
  
  fusionAssemblyCore;
  console.log('✅ FusionAssembly ready');
} catch (error) {
  console.error('❌ Core system initialization error:', error);
}

export default app;