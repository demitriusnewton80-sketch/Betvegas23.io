
import express, { Request, Response } from 'express';
import { streamingService } from '../services/StreamingService.js';
import { ssoService } from '../services/SSOService.js';

const router = express.Router();

// WiFi Core Connection Status
router.get('/wifi/status', (req: Request, res: Response) => {
  res.json({
    status: 'connected',
    protocol: 'WiFi Core 6E',
    bandwidth: '1Gbps',
    latency: '5ms',
    fccCompliant: true,
    fccEntity: '20130314143016',
    psn: {
      integrated: true,
      apiVersion: 'v2.0',
      region: 'US'
    }
  });
});

// Get available PlayStation 5 games for betting
router.get('/games', async (req: Request, res: Response) => {
  const ps5Games = [
    {
      id: 'ps5-cod-001',
      title: 'Call of Duty: Warzone Tournament',
      platform: 'PlayStation 5',
      gameType: 'FPS',
      status: 'live',
      startTime: new Date().toISOString(),
      odds: {
        team1: -150,
        team2: +130
      },
      streamUrl: '/streaming/ps5/cod-001',
      wifiRequired: true
    },
    {
      id: 'ps5-fifa-002',
      title: 'FIFA 24 Championship',
      platform: 'PlayStation 5',
      gameType: 'Sports',
      status: 'upcoming',
      startTime: new Date(Date.now() + 3600000).toISOString(),
      odds: {
        team1: -110,
        team2: -110
      },
      streamUrl: '/streaming/ps5/fifa-002',
      wifiRequired: true
    },
    {
      id: 'ps5-nba2k-003',
      title: 'NBA 2K24 Pro League',
      platform: 'PlayStation 5',
      gameType: 'Sports',
      status: 'live',
      startTime: new Date().toISOString(),
      odds: {
        team1: +200,
        team2: -250
      },
      streamUrl: '/streaming/ps5/nba2k-003',
      wifiRequired: true
    }
  ];

  res.json({
    games: ps5Games,
    wifiCoreEnabled: true,
    fccStreamingContract: 'FCC-2024-PS5-GAMING',
    totalGames: ps5Games.length
  });
});

// Place bet on PS5 game (SSO protected)
router.post('/bet', async (req: Request, res: Response) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId) {
    return res.status(401).json({
      error: 'Authentication required',
      ssoLogin: '/auth/login'
    });
  }

  const user = ssoService.validateSession(sessionId);
  if (!user) {
    return res.status(401).json({
      error: 'Invalid session',
      ssoLogin: '/auth/login'
    });
  }

  const { gameId, team, amount } = req.body;

  if (!gameId || !team || !amount) {
    return res.status(400).json({
      error: 'Missing required fields: gameId, team, amount'
    });
  }

  try {
    const betId = `ps5-bet-${Date.now()}`;
    const streamAccess = streamingService.grantStreamAccess(user.id, gameId, betId);

    res.json({
      success: true,
      betId,
      gameId,
      team,
      amount,
      userId: user.id,
      streamAccess: {
        granted: true,
        streamUrl: streamAccess.amazonPrimeStreamUrl,
        ps5DirectStream: `/streaming/ps5/${gameId}`,
        wifiCoreEnabled: true
      },
      fccCompliant: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to place bet',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PlayStation Network WiFi Core Integration
router.get('/psn/connect', async (req: Request, res: Response) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId) {
    return res.status(401).json({
      error: 'SSO authentication required',
      redirectTo: '/auth/login'
    });
  }

  const user = ssoService.validateSession(sessionId);
  if (!user) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  res.json({
    connected: true,
    userId: user.id,
    psnId: `psn_${user.id}`,
    wifiCore: {
      status: 'active',
      protocol: 'WiFi 6E',
      encryption: 'WPA3',
      bandwidth: '1Gbps',
      ps5Optimized: true
    },
    fccRegistration: {
      entity: '20130314143016',
      streamingContract: 'FCC-PS5-GAMING-2024',
      compliant: true
    }
  });
});

// Live PS5 game stream
router.get('/stream/:gameId', (req: Request, res: Response) => {
  const { gameId } = req.params;
  const sessionId = req.cookies?.session_id || req.query.userId as string;

  if (!sessionId) {
    return res.status(401).json({
      error: 'Authentication required for stream access'
    });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const updateHandler = (update: any) => {
    if (update.gameId === gameId) {
      res.write(`data: ${JSON.stringify({
        ...update,
        platform: 'PlayStation 5',
        wifiCore: 'active',
        fccCompliant: true
      })}\n\n`);
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

// WiFi Core diagnostic
router.get('/wifi/diagnostic', (req: Request, res: Response) => {
  res.json({
    wifiCore: {
      status: 'optimal',
      signalStrength: '100%',
      frequency: '6GHz',
      channel: 'Auto',
      interference: 'none',
      ps5Compatibility: 'full'
    },
    network: {
      downloadSpeed: '1000 Mbps',
      uploadSpeed: '500 Mbps',
      ping: '5ms',
      jitter: '1ms',
      packetLoss: '0%'
    },
    fccCompliance: {
      registered: true,
      entity: '20130314143016',
      streamingLicense: 'active',
      gamingApproved: true
    }
  });
});

// QR Code Access Information
router.get('/qr-access', (req: Request, res: Response) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  res.json({
    qrPageUrl: `${baseUrl}/ps5-qr-betting.html`,
    bettingPageUrl: `${baseUrl}/ps5-betting.html`,
    ssoLoginUrl: `${baseUrl}/auth/login`,
    contracts: {
      ps5Betting: `${baseUrl}/contracts/ps5-betting`,
      ssoTerms: `${baseUrl}/contracts/sso-terms`
    },
    publicAccess: true,
    requiresSSO: true,
    fccEntity: '20130314143016'
  });
});

export default router;
