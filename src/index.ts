import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import sportsbookRouter from './routes/sportsbook.js';
import streamingRouter from './routes/streaming.js';
import authRouter from './routes/auth.js';
import webhooksRouter from './routes/webhooks.js';
import accountRouter from './routes/account.js';
import contactRoutes from './routes/contact.js';
import { sportsDataService } from './services/SportsDataService.js';

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(express.json());
app.use(cookieParser());

// Serve static files from public directory
app.use(express.static('public'));

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

// API Documentation endpoint removed for security

// API Routes with proper error handling
app.use('/sportsbook', sportsbookRouter);
app.use('/streaming', streamingRouter);
app.use('/auth', authRouter);
app.use('/webhooks', webhooksRouter);
app.use('/account', accountRouter);
app.use('/contact', contactRoutes);

// Ensure all routes are mounted
console.log('📍 Routes registered:');
console.log('   - /sportsbook');
console.log('   - /streaming');
console.log('   - /auth');
console.log('   - /webhooks');
console.log('   - /account');
console.log('   - /contact');

// 404 handler for API
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.path}`
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

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 API Server running on ${HOST}:${PORT}`);
  console.log(`📡 Environment: ${NODE_ENV}`);
  console.log(`🔒 HTTPS: ${NODE_ENV === 'production' ? 'Enabled' : 'Development mode'}`);
  console.log(`☁️  AWS Integration: Active`);
  console.log(`🐙 GitHub Integration: Connected`);
  console.log(`📺 FCC Streaming: Enabled`);
  console.log(`💚 Health Check: http://${HOST}:${PORT}/health`);
  console.log(`🌐 Server is ready to accept connections`);
});

server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

export default app;