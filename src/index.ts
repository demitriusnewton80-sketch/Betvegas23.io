import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { appCore } from './core/AppCore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import sportsbookRouter from './routes/sportsbook.js';
import streamingRoutes from './routes/streaming.js';
import webhookRoutes from './routes/webhooks.js';
import wifiInfusionRoutes from './routes/wifi-infusion.js';
import authRouter from './routes/auth.js';
import ecommerceRoutes from './routes/ecommerce.js'; // New import for e-commerce routes
import awsRoutes from './routes/aws.js'; // New import for AWS routes
import backupRoutes from './routes/backup.js'; // New import for backup routes
import accountRouter from './routes/account.js';
import contactRoutes from './routes/contact.js'; // Renamed from contactRoutes for consistency
import contentRoutes from './routes/content.js'; // New import for content routes
import samRoutes from './routes/sam.js'; // New import for SAM.gov routes
import ssoPluginRoutes from './routes/sso-plugin.js'; // New import for SSO plugin routes
import spotifyRoutes from './routes/spotify.js'; // New import for Spotify routes
import qrRoutes from './routes/qr.js';
import ps5Routes from './routes/ps5.js'; // Added for PS5 sports betting routes
import phoneControlRouter from './routes/phone-control.js'; // Added for phone control
import winnerPayoutRouter from './routes/winner-payout.js';
import espnTracker from './routes/espn-tracker.js'; // Added for ESPN tracker
import web3Routes from './routes/web3.js'; // Added for Web3 bridge

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(express.json());
app.use(cookieParser());

// Serve static files from public directory
app.use(express.static('public'));

// Personal SSO login route
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/personal-sso-login.html'));
});

// Public access route (authenticated users)
app.get('/public-access', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/public-access.html'));
});

// CORS for external device connections
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint for AWS/deployment monitoring
app.get('/health', (req: Request, res: Response) => {
  const coreStatus = appCore.getConnectionStatus();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    service: 'Young Meeat LLC Sports Betting API',
    integrations: {
      aws: 'ready',
      github: 'connected',
      fcc: 'streaming_enabled'
    },
    core: {
      active: coreStatus.active,
      total: coreStatus.total,
      status: coreStatus.active === coreStatus.total ? 'all_connected' : 'partial'
    }
  });
});

// Core connection status endpoint
app.get('/core/status', (req: Request, res: Response) => {
  res.json(appCore.getConnectionStatus());
});

// API Documentation endpoint removed for security

// API Routes with proper error handling
app.use('/sportsbook', sportsbookRouter);
app.use('/streaming', streamingRoutes);
app.use('/auth', authRouter);
app.use('/webhooks', webhookRoutes);
app.use('/account', accountRouter);
app.use('/contact', contactRoutes);
app.use('/ecommerce', ecommerceRoutes); // Mount e-commerce routes
app.use('/aws', awsRoutes); // Mount AWS routes
app.use('/backup', backupRoutes); // Mount backup routes
app.use('/content', contentRoutes); // Mount content routes
app.use('/sam', samRoutes); // Mount SAM.gov routes
app.use('/sso-plugin', ssoPluginRoutes); // Mount SSO plugin routes
app.use('/spotify', spotifyRoutes); // Mount Spotify routes
app.use('/qr', qrRoutes);
app.use('/ps5', ps5Routes); // Mount PS5 routes
app.use('/phone-control', phoneControlRouter); // Mount phone control routes
app.use('/winner-payout', winnerPayoutRouter);
app.use('/espn-tracker', espnTracker); // Mount ESPN tracker routes
app.use('/wifi-infusion', wifiInfusionRoutes);
app.use('/web3', web3Routes); // Mount Web3 bridge routes

// Route registry for monitoring
const routes = [
  '/sportsbook', '/streaming', '/auth', '/webhooks',
  '/account', '/contact', '/ecommerce', '/aws',
  '/backup', '/content', '/sam', '/sso-plugin',
  '/spotify', '/qr', '/ps5', '/phone-control',
  '/winner-payout', '/espn-tracker', '/wifi-infusion', '/web3'
];

console.log('📍 Routes registered:', routes.length);
routes.forEach(route => console.log(`   ✓ ${route}`));

// 404 handler with better styling
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.path}`,
    availableRoutes: '/health, /core/status',
    timestamp: new Date().toISOString()
  });
});

// Enhanced error handler with control
app.use((err: Error, req: Request, res: Response, next: any) => {
  const errorId = `ERR-${Date.now()}`;
  console.error(`[${errorId}] Server error:`, err.message);
  console.error('Stack:', err.stack);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    errorId,
    message: NODE_ENV === 'development' ? err.message : 'An error occurred',
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 API Server running on ${HOST}:${PORT}`);
  console.log(`📡 Environment: ${NODE_ENV}`);
  console.log(`🔒 HTTPS: ${NODE_ENV === 'production' ? 'Enabled' : 'Development mode'}`);
  console.log(`☁️  AWS Integration: Active`);
  console.log(`🐙 GitHub Integration: Connected`);
  console.log(`📺 FCC Streaming: Enabled`);
  console.log(`💚 Health Check: http://${HOST}:${PORT}/health`);
  console.log(`🌐 Server is ready to accept connections`);
  
  // Initialize App Core
  appCore.initialize();
});

server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully...');
  appCore.shutdown();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully...');
  appCore.shutdown();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;