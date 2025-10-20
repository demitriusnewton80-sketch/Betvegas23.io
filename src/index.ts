import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { startupDiagnostics } from './utils/startup-diagnostics.js';
import { appCore } from './core/AppCore.js';

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

const app = express();
const PORT = parseInt(process.env.PORT || '5000');
const HOST = '0.0.0.0'; // Bind to 0.0.0.0 for external accessibility

// Middleware
app.disable('x-powered-by');
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    fccEntity: '20130314143016'
  });
});

// API routes
app.use('/sportsbook', sportsbookRoutes);
app.use('/streaming', streamingRoutes);
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

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Main route
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Catch-all for SPA
app.get('*', (req: Request, res: Response) => {
  if (req.path.includes('.')) {
    return res.status(404).send('Not found');
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal server error',
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
    }
  });
});

// Initialize app core
appCore.initialize();

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
    console.log('\n');
  });

  httpServer.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Trying alternate port...`);
      const altPort = PORT + 1;
      httpServer.listen(altPort, HOST);
    } else {
      console.error('❌ Server error:', error);
    }
  });
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  httpServer.close(() => {
    process.exit(0);
  });
});