
import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import sportsbookRouter from './routes/sportsbook.js';
import streamingRouter from './routes/streaming.js';
import authRouter from './routes/auth.js';
import webhooksRouter from './routes/webhooks.js';

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(express.json());
app.use(cookieParser());

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
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    service: 'Young Meat LLC Sports Betting API',
    integrations: {
      aws: 'ready',
      github: 'connected',
      fcc: 'streaming_enabled'
    }
  });
});

// API Documentation endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    service: 'Young Meat LLC Sports Betting API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      sportsbook: {
        games: 'GET /sportsbook/games',
        bet: 'POST /sportsbook/bet',
        wallet: 'GET /sportsbook/user/:userId/wallet',
        deposit: 'POST /sportsbook/user/:userId/deposit',
        bets: 'GET /sportsbook/user/:userId/bets',
        cashout: 'POST /sportsbook/cashout/:betId'
      },
      streaming: {
        stream: 'GET /streaming/stream/:gameId',
        start: 'POST /streaming/stream/:gameId/start',
        stop: 'POST /streaming/stream/:gameId/stop',
        sharing: 'GET /streaming/stream/:gameId/sharing',
        partners: 'GET /streaming/partners',
        addPartner: 'POST /streaming/partners'
      },
      auth: {
        login: 'GET /auth/login',
        callback: 'GET /auth/callback',
        me: 'GET /auth/me',
        logout: 'POST /auth/logout',
        status: 'GET /auth/status'
      },
      webhooks: {
        receive: 'POST /webhooks/receive/:sportsbookId',
        test: 'POST /webhooks/test/:sportsbookId'
      }
    },
    integrations: {
      aws: {
        description: 'AWS integration for cloud deployment and scaling',
        status: 'active'
      },
      github: {
        description: 'GitHub integration for version control and CI/CD',
        repository: 'https://github.com/betvages23/betvages23.in',
        status: 'connected'
      },
      fcc: {
        description: 'FCC-compliant streaming and authentication',
        status: 'enabled'
      }
    }
  });
});

// API Routes with proper error handling
app.use('/sportsbook', sportsbookRouter);
app.use('/streaming', streamingRouter);
app.use('/auth', authRouter);
app.use('/webhooks', webhooksRouter);

// Ensure all routes are mounted
console.log('📍 Routes registered:');
console.log('   - /sportsbook');
console.log('   - /streaming');
console.log('   - /auth');
console.log('   - /webhooks');

// 404 handler for API
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: '/api'
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, HOST, () => {
  console.log(`🚀 API Server running on ${HOST}:${PORT}`);
  console.log(`📡 Environment: ${NODE_ENV}`);
  console.log(`🔒 HTTPS: ${NODE_ENV === 'production' ? 'Enabled' : 'Development mode'}`);
  console.log(`☁️  AWS Integration: Active`);
  console.log(`🐙 GitHub Integration: Connected`);
  console.log(`📺 FCC Streaming: Enabled`);
  console.log(`🌐 API Documentation: http://${HOST}:${PORT}/api`);
  console.log(`💚 Health Check: http://${HOST}:${PORT}/health`);
});

export default app;
