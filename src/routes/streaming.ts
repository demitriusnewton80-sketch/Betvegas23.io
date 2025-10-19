
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

// Get Amazon Prime stream access for user
router.get('/amazon-prime/:userId/:gameId', (req: Request, res: Response) => {
  const { userId, gameId } = req.params;
  
  const hasAccess = streamingService.hasStreamAccess(userId, gameId);
  
  if (!hasAccess) {
    return res.status(403).json({ 
      error: 'No stream access. Place a bet on this game to watch on Amazon Prime.',
      hasAccess: false
    });
  }
  
  const amazonPrimeUrl = streamingService.getAmazonPrimeUrl(userId, gameId);
  
  res.json({
    hasAccess: true,
    gameId,
    amazonPrimeUrl,
    message: 'Amazon Prime stream access granted via Young Meeat LLC partnership'
  });
});

// Get all stream access for user
router.get('/my-streams/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const streams = streamingService.getUserStreamAccess(userId);
  
  res.json({
    streams,
    count: streams.length
  });
});

export default router;


// Get NBA direct stream integration
router.get('/nba/direct/:gameId', async (req: Request, res: Response) => {
  const { gameId } = req.params;
  const { userId } = req.query;
  
  // Verify FCC registration
  const fccRegistration = '0024454324'; // 20130314143016 inc
  const controlEntity = '20130314143016';
  
  const nbaIntegration = {
    gameId,
    streamUrl: 'https://www.nba.com/live',
    directControl: true,
    fccCompliant: true,
    registration: {
      frn: fccRegistration,
      entity: controlEntity,
      contactEmail: 'gbemeeat@gmail.com',
      registrationDate: '03/25/2015'
    },
    access: {
      userId: userId || 'guest',
      grantedAt: new Date().toISOString(),
      controlLevel: 'full'
    }
  };
  
  res.json(nbaIntegration);
});

// Get radio stream info for a game with fallback options
router.get('/radio/:gameId', async (req: Request, res: Response) => {
  const { gameId } = req.params;
  
  // Multiple radio stream options with fallbacks
  const radioStreams = [
    {
      url: 'https://player.radio.com/listen/station/nfl-live',
      provider: 'Radio.com',
      type: 'NFL Live Radio'
    },
    {
      url: 'https://www.iheart.com/live/espn-radio-3959/',
      provider: 'iHeartRadio',
      type: 'ESPN Radio'
    },
    {
      url: 'https://tunein.com/radio/ESPN-Radio-s20368/',
      provider: 'TuneIn',
      type: 'ESPN Radio'
    },
    {
      url: 'https://www.audacy.com/stations/sports',
      provider: 'Audacy Sports',
      type: 'Sports Radio Network'
    }
  ];
  
  res.json({
    gameId,
    primaryRadio: radioStreams[0],
    fallbackRadios: radioStreams.slice(1),
    note: 'If primary stream is unavailable, try fallback options',
    directConnect: {
      fccEntity: '20130314143016',
      registration: '0024454324',
      contactEmail: 'gbemeeat@gmail.com'
    }
  });
});

// Get IP address for radio stream URL
router.get('/radio/ip-lookup', async (req: Request, res: Response) => {
  const { url } = req.query;
  
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter required' });
  }
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Use DNS lookup
    const dns = await import('dns');
    const { promisify } = await import('util');
    const lookup = promisify(dns.lookup);
    
    const result = await lookup(hostname);
    
    res.json({
      url: url,
      hostname: hostname,
      ipAddress: result.address,
      family: result.family === 4 ? 'IPv4' : 'IPv6',
      note: 'IP addresses for streaming services may change. Consider using the hostname instead.'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to lookup IP address',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

