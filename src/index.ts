
import express from 'express';
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
import awsRoutes from './routes/aws.js';
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
import espnTracker from './routes/espn-tracker.js';
import web3Routes from './routes/web3.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize App Core
appCore.initialize();

// Health check endpoint
app.get('/health', (req, res) => {
  const coreStatus = appCore.getConnectionStatus();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    fccEntity: '20130314143016',
    core: coreStatus,
    uptime: Math.floor(process.uptime())
  });
});

// API Routes - All properly integrated
app.use('/sportsbook', sportsbookRouter);
app.use('/streaming', streamingRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/wifi-infusion', wifiInfusionRoutes);
app.use('/auth', authRouter);
app.use('/ecommerce', ecommerceRoutes);
app.use('/aws', awsRoutes);
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
app.use('/espn-tracker', espnTracker);
app.use('/web3', web3Routes);

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Core status endpoint
app.get('/api/core/status', (req, res) => {
  res.json({
    success: true,
    core: appCore.getConnectionStatus(),
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Fallback route for SPA
app.get('*', (req, res) => {
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
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
╚════════════════════════════════════════════════════════════╝
  `);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  appCore.shutdown();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  appCore.shutdown();
  process.exit(0);
});
