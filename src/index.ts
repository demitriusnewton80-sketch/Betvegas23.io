
import express, { Request, Response } from 'express';
import sportsbookRouter from './routes/sportsbook.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Young Meat LLC',
    status: 'running',
    endpoints: {
      health: '/health',
      sportsbook: '/sportsbook',
      games: '/sportsbook/games',
      placeBet: 'POST /sportsbook/bet'
    }
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

app.use('/sportsbook', sportsbookRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
