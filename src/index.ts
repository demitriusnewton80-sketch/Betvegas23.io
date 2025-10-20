import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { functionalStructures } from './core/FunctionalStructures.js';
import { domainProtection } from './middleware/domainProtection.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { sanitizeInput, validateRequest } from './middleware/security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import only functional routes
import functionalStructuresRoutes from './routes/functional-structures.js';
import smartSystemRoutes from './routes/smart-system.js';
import aiRoutes from './routes/ai.js';
import systemHealthRoutes from './routes/system-health.js';

const app = express();
const PORT = parseInt(process.env.PORT || '5000');
const HOST = '0.0.0.0';

// Security headers
app.disable('x-powered-by');

// CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
  maxAge: 86400
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Security middleware
app.use(validateRequest);
app.use(sanitizeInput);
app.use(domainProtection);
app.use(rateLimiter());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  const structureStatus = functionalStructures.getStructureStatus();

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    fccEntity: '20130314143016',
    structures: structureStatus,
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    }
  });
});

// Functional API routes
app.use('/functional-structures', functionalStructuresRoutes);
app.use('/smart-system', smartSystemRoutes);
app.use('/ai', aiRoutes);
app.use('/system', systemHealthRoutes);

// Static files
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

// Functional dashboard route
app.get('/functional-structures-dashboard', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/functional-structures-dashboard.html'));
});

// Main route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Functional Structures API',
    fccEntity: '20130314143016',
    endpoints: {
      health: '/health',
      structures: '/functional-structures/structures',
      modules: '/functional-structures/modules',
      status: '/functional-structures/status',
      smartSystem: '/smart-system/status',
      ai: '/ai/models',
      dashboard: '/functional-structures-dashboard'
    },
    timestamp: new Date().toISOString()
  });
});

// Fallback for SPA
app.get('*', (req, res, next) => {
  if (req.path.includes('.')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../public/functional-structures-dashboard.html'));
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    fccEntity: '20130314143016'
  });
});

// Create HTTP server with WebSocket
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

// WebSocket smart communication
const activeConnections = new Map<string, WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  activeConnections.set(clientId, ws);

  console.log(`🔌 WebSocket connected: ${clientId} (Total: ${activeConnections.size})`);

  ws.send(JSON.stringify({
    type: 'connected',
    clientId,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'subscribe':
          ws.send(JSON.stringify({
            type: 'subscribed',
            channel: message.channel,
            timestamp: new Date().toISOString()
          }));
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          break;

        case 'execute':
          const result = functionalStructures.executeFunction(
            message.moduleId,
            message.functionName,
            message.params
          );
          ws.send(JSON.stringify({ type: 'result', ...result }));
          break;

        default:
          ws.send(JSON.stringify({
            type: 'echo',
            received: message,
            timestamp: new Date().toISOString()
          }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    activeConnections.delete(clientId);
    console.log(`🔌 WebSocket disconnected: ${clientId}`);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for ${clientId}:`, error);
    activeConnections.delete(clientId);
  });

  const heartbeat = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() }));
    } else {
      clearInterval(heartbeat);
    }
  }, 30000);
});

// Broadcast function
const broadcast = (data: any) => {
  activeConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  });
};

(global as any).wsBroadcast = broadcast;

// Start server
httpServer.listen(PORT, HOST, () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('🏢 Functional Structures - Smart Communication');
  console.log('═══════════════════════════════════════════════════');
  console.log(`🚀 HTTP Server: http://${HOST}:${PORT}`);
  console.log(`🔌 WebSocket: ws://${HOST}:${PORT}/ws`);
  console.log(`📡 FCC Entity: 20130314143016`);
  console.log(`🏗️  Functional Structures: ${functionalStructures.getAllStructures().length}`);
  console.log(`📦 Modules: ${functionalStructures.getAllModules().length}`);
  console.log('═══════════════════════════════════════════════════');
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`${signal} received, shutting down gracefully...`);
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});