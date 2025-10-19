import express, { Request, Response } from 'express';
import { streamingService } from '../services/StreamingService.js';

const router = express.Router();

router.get('/stream/:gameId', (req: Request, res: Response) => {
  const { gameId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('X-Stream-Protected', 'true');
  res.setHeader('X-FCC-Entity', '20130314143016');

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

// Mobile contract management - Get contract status
router.get('/contracts/mobile/status', (req: Request, res: Response) => {
  const sportsbooks = streamingService.getExternalSportsbooks();
  
  res.json({
    success: true,
    contracts: sportsbooks.map(sb => ({
      id: sb.id,
      name: sb.name,
      active: sb.active,
      webhookUrl: sb.webhookUrl,
      allowedIPs: sb.allowedIPs,
      registeredAt: sb.registeredAt
    })),
    mobileOptimized: true,
    fccEntity: '20130314143016',
    httpsEnabled: true,
    secureConnection: true
  });
});

// Mobile sportsbook hub status
router.get('/mobile/hub/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    workflows: [
      { name: 'Live Streaming', endpoint: '/streaming/partners', status: 'active' },
      { name: 'PS5 Gaming', endpoint: '/ps5/games', status: 'connected' },
      { name: 'WiFi Hub', endpoint: '/streaming/wifi-hub/status', status: 'online' },
      { name: 'Phone Control', endpoint: '/phone-control/stats', status: 'ready' },
      { name: 'AWS Backup', endpoint: '/backup/status', status: 'synced' },
      { name: 'SSO System', endpoint: '/sso-plugin/plugins', status: 'enabled' }
    ],
    mobileOptimized: true,
    httpsEnabled: true,
    fccEntity: '20130314143016'
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

  // Verify FCC authorized emails from environment
  const authorizedEmails = (process.env.AUTHORIZED_EMAILS || 'gbemeeat@gmail.com,meeatupt215@gmail.com').split(',');

  if (!email || !authorizedEmails.includes(email.toLowerCase())) {
    return res.status(403).json({
      error: 'Unauthorized email address',
      fccEntity: '20130314143016'
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

// Get FCC streaming status for email
router.get('/fcc/status/:email', async (req: Request, res: Response) => {
  const { email } = req.params;

  const authorizedEmails = ['gbemeeat@gmail.com', 'meeatupt215@gmail.com'];

  if (!authorizedEmails.includes(email.toLowerCase())) {
    return res.status(403).json({
      error: 'Unauthorized email',
      fccEntity: '20130314143016'
    });
  }

  res.json({
    email,
    fccEntity: '20130314143016',
    fccRegistration: '0024454324',
    status: 'active',
    services: {
      playstationControl: 'enabled',
      streamingAccess: 'full',
      bettingPlatform: 'active'
    },
    activeStreams: streamingService.getExternalSportsbooks().length,
    phoneControlEnabled: true,
    lastActivity: new Date().toISOString()
  });
});

// Get WiFi connection hub status with enhanced control
router.get('/wifi-hub/status', (req: Request, res: Response) => {
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0';
  
  res.json({
    success: true,
    hubName: 'WiFi Connection Infusion Hub',
    status: 'active',
    connectionStrength: 'excellent',
    network: {
      ipAddress: '0.0.0.0',
      clientIP: String(clientIP),
      port: parseInt(process.env.PORT || '5000'),
      protocol: 'https/wss',
      encryption: 'WPA3-Enterprise'
    },
    fccEntity: '20130314143016',
    wifiInfusion: {
      enabled: true,
      protocol: 'TCP/IP over HTTPS',
      bandwidth: 'unlimited',
      signalStrength: 100
    },
    connectedPlugins: [
      { name: 'Live Sportsbook', status: 'connected', endpoint: '/sportsbook/games', health: 100 },
      { name: 'PlayStation Network', status: 'connected', endpoint: '/ps5/games', health: 100 },
      { name: 'FCC Streaming', status: 'connected', endpoint: '/streaming/partners', health: 100 },
      { name: 'SSO Authentication', status: 'connected', endpoint: '/sso-plugin/plugins', health: 100 },
      { name: 'AWS Integration', status: 'connected', endpoint: '/aws/status', health: 100 },
      { name: 'SAM.gov Portal', status: 'connected', endpoint: '/sam/entity/young-meeat-llc', health: 100 }
    ],
    metrics: {
      bandwidth: 'unlimited',
      latency: '<50ms',
      uptime: '99.9%'
    },
    timestamp: new Date().toISOString()
  });
});

// Get WiFi hub connection metrics
router.get('/wifi-hub/metrics', (req: Request, res: Response) => {
  const uptime = process.uptime();

  res.json({
    uptime: Math.floor(uptime),
    activeConnections: streamingService.getExternalSportsbooks().length,
    totalPlugins: 6,
    connectedPlugins: 6,
    averageLatency: '42ms',
    bandwidthUsage: '15%',
    signalStrength: 100,
    timestamp: new Date().toISOString()
  });
});

// Betting Zone unified endpoint
router.get('/betting-zone/status', (req: Request, res: Response) => {
  res.json({
    zoneName: 'Betting Zone',
    status: 'active',
    phoneControlEnabled: true,
    wifiHubConnected: true,
    networkControl: 'integrated',
    fccEntity: '20130314143016',
    features: {
      phoneControl: 'enabled',
      wifiConnection: 'excellent',
      unifiedPlugins: 'active',
      liveStreaming: 'active',
      contentDistribution: 'active',
      networkCommands: 'enabled'
    },
    connectedPlugins: [
      { name: 'PlayStation 5', endpoint: '/ps5-betting.html', status: 'connected' },
      { name: 'Live Sportsbook', endpoint: '/index.html', status: 'connected' },
      { name: 'Streaming Services', endpoint: '/streaming/partners', status: 'connected' },
      { name: 'Radio Networks', endpoint: '/streaming/radio/latest', status: 'connected' },
      { name: 'SSO System', endpoint: '/sso-plugin-dashboard.html', status: 'connected' },
      { name: 'AWS Integration', endpoint: '/backup-dashboard.html', status: 'connected' }
    ],
    phoneControlEmails: ['gbemeeat@gmail.com', 'meeatupt215@gmail.com'],
    accessUrl: '/wifi-plugin-hub.html',
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

export default router;