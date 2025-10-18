
import express, { Request, Response } from 'express';
import sportsbookRouter from './routes/sportsbook.js';
import streamingRouter from './routes/streaming.js';

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy for production HTTPS
app.set('trust proxy', 1);

// Force HTTPS in production
app.use((req: Request, res: Response, next) => {
  if (NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});

// Security headers for production
app.use((req: Request, res: Response, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Young Meat LLC - Live Sports Betting Platform',
    status: 'running',
    endpoints: {
      health: '/health',
      sportsbook: '/sportsbook',
      games: '/sportsbook/games',
      placeBet: 'POST /sportsbook/bet',
      cashOut: 'POST /sportsbook/cashout/:betId',
      userBets: '/sportsbook/user/:userId/bets',
      userWallet: '/sportsbook/user/:userId/wallet',
      deposit: 'POST /sportsbook/user/:userId/deposit',
      liveStream: '/streaming/stream/:gameId',
      startStream: 'POST /streaming/stream/:gameId/start'
    }
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

app.use('/sportsbook', sportsbookRouter);
app.use('/streaming', streamingRouter);

// CORS configuration for cross-origin requests
app.use((req: Request, res: Response, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`📡 Environment: ${NODE_ENV}`);
  console.log(`🔒 HTTPS: ${NODE_ENV === 'production' ? 'Enabled' : 'Development mode'}`);
  console.log(`🌐 Ready for deployment on any platform`);
});
