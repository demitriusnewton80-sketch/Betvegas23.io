
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
  
  const errorHandler = () => {
    streamingService.recordStreamFailure(gameId);
  };
  
  streamingService.on('gameUpdate', updateHandler);
  streamingService.startGameStream(gameId);
  
  // Handle stream errors
  res.on('error', errorHandler);
  
  req.on('close', () => {
    streamingService.off('gameUpdate', updateHandler);
    res.off('error', errorHandler);
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

// Get stream sharing status
router.get('/stream/:gameId/sharing', (req: Request, res: Response) => {
  const { gameId } = req.params;
  const status = streamingService.getSharingStatus(gameId);
  
  res.json({
    gameId,
    ...status
  });
});

// Report stream failure manually
router.post('/stream/:gameId/report-failure', (req: Request, res: Response) => {
  const { gameId } = req.params;
  streamingService.recordStreamFailure(gameId);
  
  res.json({
    message: 'Stream failure recorded',
    gameId,
    sharingStatus: streamingService.getSharingStatus(gameId)
  });
});

// Get all external sportsbooks
router.get('/partners', (req: Request, res: Response) => {
  const sportsbooks = streamingService.getExternalSportsbooks();
  
  res.json({
    partners: sportsbooks,
    count: sportsbooks.length
  });
});

// Add new external sportsbook partner
router.post('/partners', (req: Request, res: Response) => {
  const { id, name, apiKey, webhookUrl, active = true } = req.body;
  
  if (!id || !name || !apiKey || !webhookUrl) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  streamingService.addExternalSportsbook({ id, name, apiKey, webhookUrl, active });
  
  res.json({
    message: 'External sportsbook partner added',
    sportsbook: { id, name, webhookUrl, active }
  });
});

export default router;
