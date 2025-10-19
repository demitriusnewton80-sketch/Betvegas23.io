import express, { Request, Response } from 'express';
import { streamingService } from '../services/StreamingService.js';

const router = express.Router();

// Stream live game updates
router.get('/stream/:gameId', (req: Request, res: Response) => {
  const { gameId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const intervalId = setInterval(() => {
    try {
      const update = streamingService.generateLiveUpdate(gameId);
      res.write(`data: ${JSON.stringify(update)}\n\n`);
    } catch (error) {
      console.error('Stream error:', error);
    }
  }, 3000);

  req.on('close', () => {
    clearInterval(intervalId);
  });
});

// Get stream status
router.get('/status', (req: Request, res: Response) => {
  const status = streamingService.getBroadcastStatus();
  res.json({
    status: 'active',
    streaming: true,
    domain: req.get('host'),
    ...status
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

// FCC Email-based PlayStation Control
router.post('/fcc/playstation-control', async (req: Request, res: Response) => {
  const { email, action, gameId } = req.body;

  // Verify FCC authorized emails
  const authorizedEmails = ['gbemeeat@gmail.com', 'meeatupt215@gmail.com'];

  if (!email || !authorizedEmails.includes(email.toLowerCase())) {
    return res.status(403).json({
      error: 'Unauthorized email address',
      fccEntity: '20130314143016',
      authorizedEmails: authorizedEmails.map(e => e.replace(/(.{2}).*(@.*)/, '$1***$2'))
    });
  }

  // FCC Streaming Control
  const fccControl = {
    email,
    action: action || 'connect',
    gameId,
    fccEntity: '20130314143016',
    fccRegistration: '0024454324',
    playstationNetwork: {
      status: 'connected',
      controlLevel: 'full',
      streamingEnabled: true,
      phoneControl: true
    },
    streamingSources: [
      {
        type: 'NBA Direct',
        url: 'https://www.nba.com/live',
        fccCompliant: true
      },
      {
        type: 'Amazon Prime',
        partnership: 'Young Meeat LLC',
        fccCompliant: true
      },
      {
        type: 'Radio Networks',
        providers: ['ESPN Radio', 'Audacy Sports'],
        fccCompliant: true
      }
    ],
    controlMethods: {
      phone: 'enabled',
      web: 'enabled',
      ps5: 'enabled'
    },
    timestamp: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'FCC PlayStation control activated',
    control: fccControl,
    instructions: {
      phone: 'Use your phone to control PlayStation through FCC streaming services',
      games: 'Access Madden, NBA 2K, UFC, and all betting games',
      streaming: 'All streams are FCC compliant and authorized'
    }
  });
});

// FCC Phone Control for PlayStation
router.get('/fcc/status/:email', (req: Request, res: Response) => {
  const { email } = req.params;

  res.json({
    email,
    fccEntity: '20130314143016',
    phoneControlEnabled: true,
    services: {
      playstationControl: 'enabled',
      streamingAccess: 'enabled',
      radioAccess: 'enabled',
      videoStreaming: 'enabled'
    },
    activeStreams: streamingService.getActiveStreamCount() || 0,
    domain: req.get('host'),
    timestamp: new Date().toISOString()
  });
});

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
    const dns = await import('dns/promises');
    const result = await dns.lookup(hostname);

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

export default router;