
import express, { Request, Response } from 'express';
import sportsbookRouter from './routes/sportsbook.js';
import streamingRouter from './routes/streaming.js';

const app = express();
const PORT = process.env.PORT || 5000;

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
