
import express, { Request, Response } from 'express';
import { streamingService } from '../services/StreamingService.js';

const router = express.Router();

router.get('/stream/:gameId', (req: Request, res: Response) => {
  const { gameId } = req.params;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const updateHandler = (update: any) => {
    if (update.gameId === gameId) {
      res.write(`data: ${JSON.stringify(update)}\n\n`);
    }
  };
  
  streamingService.on('gameUpdate', updateHandler);
  streamingService.startGameStream(gameId);
  
  req.on('close', () => {
    streamingService.off('gameUpdate', updateHandler);
    streamingService.stopGameStream(gameId);
    res.end();
  });
});

router.post('/stream/:gameId/start', (req: Request, res: Response) => {
  const { gameId } = req.params;
  streamingService.startGameStream(gameId);
  
  res.json({
    message: 'Stream started',
    gameId,
    streamUrl: `/streaming/stream/${gameId}`
  });
});

router.post('/stream/:gameId/stop', (req: Request, res: Response) => {
  const { gameId } = req.params;
  streamingService.stopGameStream(gameId);
  
  res.json({
    message: 'Stream stopped',
    gameId
  });
});

export default router;
