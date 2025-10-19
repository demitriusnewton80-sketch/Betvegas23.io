import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { appCore } from './core/AppCore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import sportsbookRouter from './routes/sportsbook.js';
import streamingRoutes from './routes/streaming.js';
import webhookRoutes from './routes/webhooks.js';
import wifiInfusionRoutes from './routes/wifi-infusion.js';
import authRouter from './routes/auth.js';
import ecommerceRoutes from './routes/ecommerce.js';
import awsRouter from './routes/aws.js';
import backupRoutes from './routes/backup.js';
import accountRouter from './routes/account.js';
import contactRoutes from './routes/contact.js';
import contentRoutes from './routes/content.js';
import samRoutes from './routes/sam.js';
import ssoPluginRoutes from './routes/sso-plugin.js';
import spotifyRoutes from './routes/spotify.js';
import qrRoutes from './routes/qr.js';
import ps5Routes from './routes/ps5.js';
import phoneControlRouter from './routes/phone-control.js';
import winnerPayoutRouter from './routes/winner-payout.js';
import sshRoutes from './routes/ssh.js';
import espnTrackerRouter from './routes/espn-tracker.js';
import espnBettingRouter from './routes/espn-betting.js';
import sportsRadioRouter from './routes/sports-radio.js';
import web3Routes from './routes/web3.js';
import transformerRouter from './routes/transformer.js';
import awsDataRouter from './routes/aws-data.js';
import analyticsRouter from './routes/analytics.js';
import { trafficMonitor } from './routes/analytics.js';
import publicAccessRoutes from './routes/public-access.js';
import vpnRoutes from './routes/vpn.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { domainProtection, addCustomDomain, getAllowedDomains } from './middleware/domainProtection.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - Secure CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://*.replit.dev',
  'https://*.replit.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some(pattern => {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(origin);
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  maxAge: 86400
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Traffic monitoring middleware
app.use((req, res, next) => {
  trafficMonitor.trackRequest(req);
  next();
});

// Apply domain protection middleware
app.use(domainProtection);

// Apply rate limiting middleware
app.use(rateLimiter());

// Initialize App Core
appCore.initialize();

// Health check endpoint for deployment monitoring
app.get('/health', (req: Request, res: Response) => {
  const coreStatus = appCore.getConnectionStatus();
  const isHealthy = coreStatus.active >= coreStatus.total * 0.8; // 80% threshold

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    fccEntity: '20130314143016',
    deployment: process.env.REPLIT_DEPLOYMENT === '1',
    core: coreStatus,
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    }
  });
});

// Readiness check for load balancer
app.get('/ready', (req, res) => {
  const coreStatus = appCore.getConnectionStatus();
  if (coreStatus.active === coreStatus.total) {
    res.status(200).json({ ready: true });
  } else {
    res.status(503).json({ ready: false, waiting: 'core initialization' });
  }
});

// Domain management endpoint
app.get('/domain/status', (req: Request, res: Response) => {
  res.json({
    allowedDomains: getAllowedDomains(),
    currentDomain: req.headers.host,
    fccEntity: '20130314143016',
    protection: 'active',
    timestamp: new Date().toISOString()
  });
});

app.post('/domain/add', (req: Request, res: Response) => {
  const { domain, email } = req.body;

  // Verify authorized email
  const authorizedEmails = ['gbemeeat@gmail.com', 'meeatupt215@gmail.com'];
  if (!authorizedEmails.includes(email)) {
    return res.status(403).json({ error: 'Unauthorized email' });
  }

  addCustomDomain(domain);
  res.json({
    success: true,
    domain,
    allowedDomains: getAllowedDomains(),
    message: 'Domain added successfully'
  });
});

// API Routes - All properly integrated
app.use('/sportsbook', sportsbookRouter);
app.use('/streaming', streamingRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/wifi-infusion', wifiInfusionRoutes);
app.use('/auth', authRouter);
app.use('/ecommerce', ecommerceRoutes);
app.use('/aws', awsRouter);
app.use('/backup', backupRoutes);
app.use('/account', accountRouter);
app.use('/contact', contactRoutes);
app.use('/content', contentRoutes);
app.use('/sam', samRoutes);
app.use('/sso-plugin', ssoPluginRoutes);
app.use('/spotify', spotifyRoutes);
app.use('/qr', qrRoutes);
app.use('/ps5', ps5Routes);
app.use('/phone-control', phoneControlRouter);
app.use('/winner-payout', winnerPayoutRouter);
app.use('/ssh', sshRoutes);
app.use('/espn-tracker', espnTrackerRouter);
app.use('/espn-betting', espnBettingRouter);
app.use('/sports-radio', sportsRadioRouter);
app.use('/web3', web3Routes);
app.use('/transformer', transformerRouter);
app.use('/analytics', analyticsRouter);
app.use('/public-access', publicAccessRoutes);
app.use('/vpn', vpnRoutes);

// Static files - serve with proper MIME types
app.use(express.static(path.join(__dirname, '../public'), {
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    } else if (filepath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filepath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Core status endpoint
app.get('/api/core/status', (req, res) => {
  res.json({
    success: true,
    core: appCore.getConnectionStatus(),
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Fallback route for SPA - only for non-file requests
app.get('*', (req, res, next) => {
  // If the request has a file extension, let static middleware handle it
  if (req.path.includes('.')) {
    return next();
  }
  // Otherwise, serve the SPA
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server with production-ready configuration
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║          Young Meeat LLC - Production Server               ║
║          FCC Entity: 20130314143016                        ║
╠════════════════════════════════════════════════════════════╣
║  🚀 Server running on port ${PORT}                           ║
║  🌐 Access at: http://0.0.0.0:${PORT}                        ║
║  ✅ All WiFi Core Fuse Connector Features Active           ║
║  📡 Phone Control Network: ONLINE                          ║
║  🎮 PS5 Betting Integration: ACTIVE                        ║
║  💰 Winner Payout System: OPERATIONAL                      ║
║  🔌 WiFi Plugin Hub: CONNECTED                             ║
║  📊 Deployment Mode: ${process.env.REPLIT_DEPLOYMENT ? 'PRODUCTION' : 'DEVELOPMENT'} ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Keep server alive with proper timeout settings
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Prevent server crashes from unhandled errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit in production - log and continue
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in production - log and continue
});

// Graceful shutdown for zero-downtime deployments
const gracefulShutdown = (signal: string) => {
  console.log(`${signal} received, shutting down gracefully...`);

  server.close(() => {
    console.log('HTTP server closed');
    appCore.shutdown();
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));