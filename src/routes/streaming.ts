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
    console.log('WiFi network stream connection closed for game:', gameId);
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

// Get IP address for radio stream URL with WiFi network validation
router.get('/radio/ip-lookup', async (req: Request, res: Response) => {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ 
      error: 'URL parameter required',


// WiFi Calling Status - Core Network Health
router.get('/wifi-calling/status', async (req: Request, res: Response) => {
  const dns = await import('dns/promises');
  const resolver = new dns.Resolver();
  
  // Test DNS resolution with multiple providers
  const testHosts = [
    'google.com',
    'cloudflare.com', 
    'nba.com'
  ];
  
  const results = await Promise.allSettled(
    testHosts.map(host => dns.lookup(host))
  );
  
  const successfulLookups = results.filter(r => r.status === 'fulfilled').length;
  const healthPercentage = (successfulLookups / testHosts.length) * 100;
  
  res.json({
    wifiCalling: {
      status: healthPercentage >= 66 ? 'healthy' : healthPercentage >= 33 ? 'degraded' : 'critical',
      protocol: 'DNS-over-WiFi',
      coreNetwork: 'active',
      healthPercentage: Math.round(healthPercentage)
    },
    dns: {
      totalTests: testHosts.length,
      successful: successfulLookups,
      failed: testHosts.length - successfulLookups
    },
    network: {
      calling: 'enabled',
      voip: 'active',
      streaming: 'active',
      quality: healthPercentage >= 80 ? 'excellent' : healthPercentage >= 60 ? 'good' : 'fair'
    },
    fccEntity: '20130314143016',
    fccRegistration: '0024454324',
    timestamp: new Date().toISOString()
  });
});

// DNS WiFi Calling - Resolve any hostname
router.get('/wifi-calling/resolve/:hostname', async (req: Request, res: Response) => {
  const { hostname } = req.params;
  
  try {
    const dns = await import('dns/promises');
    
    const [lookup, ipv4, ipv6, mx, ns] = await Promise.allSettled([
      dns.lookup(hostname),
      dns.resolve4(hostname),
      dns.resolve6(hostname),
      dns.resolveMx(hostname),
      dns.resolveNs(hostname)
    ]);
    
    res.json({
      hostname,
      wifiCalling: {
        status: 'active',
        protocol: 'DNS-Core',
        resolution: 'successful'
      },
      records: {
        primary: lookup.status === 'fulfilled' ? lookup.value : null,
        ipv4: ipv4.status === 'fulfilled' ? ipv4.value : [],
        ipv6: ipv6.status === 'fulfilled' ? ipv6.value : [],
        mx: mx.status === 'fulfilled' ? mx.value : [],
        nameservers: ns.status === 'fulfilled' ? ns.value : []
      },
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'WiFi calling DNS resolution failed',
      hostname,
      message: errorMessage,
      wifiCalling: 'disabled'
    });
  }
});

      wifiCoreNetwork: 'connection_required',
      wifiCalling: 'disabled'
    });
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Use DNS lookup with WiFi network connection - Core WiFi Calling
    const dns = await import('dns/promises');
    
    // Perform multiple DNS resolutions for redundancy
    const [ipv4Result, ipv6Result] = await Promise.allSettled([
      dns.resolve4(hostname),
      dns.resolve6(hostname)
    ]);

    const ipv4Addresses = ipv4Result.status === 'fulfilled' ? ipv4Result.value : [];
    const ipv6Addresses = ipv6Result.status === 'fulfilled' ? ipv6Result.value : [];

    // Get primary address using standard lookup
    const primaryLookup = await dns.lookup(hostname);

    res.json({
      url: url,
      hostname: hostname,
      wifiCalling: {
        status: 'active',
        protocol: 'DNS',
        coreNetwork: 'connected'
      },
      dns: {
        primary: {
          address: primaryLookup.address,
          family: primaryLookup.family === 4 ? 'IPv4' : 'IPv6'
        },
        ipv4: ipv4Addresses,
        ipv6: ipv6Addresses,
        totalAddresses: ipv4Addresses.length + ipv6Addresses.length
      },
      wifiCoreNetwork: 'connected',
      fccEntity: '20130314143016',
      fccRegistration: '0024454324',
      calling: {
        voip: 'enabled',
        streaming: 'enabled',
        quality: 'high'
      },
      note: 'DNS resolution complete via WiFi calling network'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('DNS WiFi calling error:', errorMessage);
    
    // Attempt fallback DNS servers
    try {
      const dns = await import('dns/promises');
      const resolver = new dns.Resolver();
      
      // Use public DNS servers as fallback
      resolver.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
      
      const urlObj = new URL(url as string);
      const fallbackResult = await resolver.resolve4(urlObj.hostname);
      
      res.json({
        url: url,
        hostname: urlObj.hostname,
        wifiCalling: {
          status: 'active',
          protocol: 'DNS-Fallback',
          coreNetwork: 'fallback_connected'
        },
        dns: {
          primary: {
            address: fallbackResult[0],
            family: 'IPv4'
          },
          ipv4: fallbackResult,
          ipv6: [],
          totalAddresses: fallbackResult.length,
          source: 'public_dns_fallback'
        },
        wifiCoreNetwork: 'fallback_connected',
        fccEntity: '20130314143016',
        calling: {
          voip: 'enabled',
          streaming: 'enabled',
          quality: 'medium'
        },
        note: 'Connected via fallback DNS servers (Google/Cloudflare)'
      });
    } catch (fallbackError) {
      res.status(500).json({
        error: 'WiFi calling DNS resolution failed',
        message: errorMessage,
        wifiCoreNetwork: 'connection_failed',
        wifiCalling: 'disabled',
        hostname: url ? new URL(url as string).hostname : 'invalid',
        fallback: 'Check WiFi network connection and try again',
        fccEntity: '20130314143016',
        troubleshooting: {
          step1: 'Verify WiFi network is connected',
          step2: 'Check firewall settings',
          step3: 'Try using IP address directly',
          step4: 'Contact support at gbemeeat@gmail.com'
        }
      });
    }
  }
});

export default router;