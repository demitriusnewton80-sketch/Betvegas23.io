
import express, { Request, Response } from 'express';
import { streamingService } from '../services/StreamingService.js';

const router = express.Router();

// Get client IP address helper
function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

// Register external sportsbook callback endpoint
router.post('/register', (req: Request, res: Response) => {
  const { sportsbookId, apiKey, callbackUrl, allowedIPs, name, githubProject } = req.body;
  
  if (!sportsbookId || !apiKey || !callbackUrl || !allowedIPs) {
    return res.status(400).json({ 
      error: 'Missing required fields: sportsbookId, apiKey, callbackUrl, allowedIPs' 
    });
  }

  // Validate IP addresses format
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const validIPs = allowedIPs.every((ip: string) => ipRegex.test(ip));
  
  if (!validIPs) {
    return res.status(400).json({ 
      error: 'Invalid IP address format' 
    });
  }

  // Register the external sportsbook
  streamingService.addExternalSportsbook({
    id: sportsbookId,
    name: name || `Sportsbook-${sportsbookId}`,
    apiKey,
    webhookUrl: callbackUrl,
    active: true,
    allowedIPs,
    registeredAt: new Date().toISOString(),
    githubProject: githubProject || 'https://github.com/betvages23/betvages23.in'
  });

  res.json({
    success: true,
    message: 'Callback registered successfully',
    sportsbook: {
      id: sportsbookId,
      callbackUrl,
      allowedIPs,
      registeredAt: new Date().toISOString(),
      githubProject: githubProject || 'https://github.com/betvages23/betvages23.in'
    }
  });
});

// Update callback URL for existing sportsbook
router.put('/callback/:sportsbookId', (req: Request, res: Response) => {
  const { sportsbookId } = req.params;
  const { apiKey, callbackUrl, allowedIPs } = req.body;
  const clientIP = getClientIP(req);

  // Validate API key and IP
  const sportsbooks = streamingService.getExternalSportsbooks();
  const sportsbook = sportsbooks.find(sb => sb.id === sportsbookId);

  if (!sportsbook) {
    return res.status(404).json({ error: 'Sportsbook not found' });
  }

  if (sportsbook.apiKey !== apiKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  if (!streamingService.validateIPAccess(sportsbookId, clientIP)) {
    return res.status(403).json({ 
      error: 'IP address not authorized',
      clientIP 
    });
  }

  // Update callback
  const updated = streamingService.registerCallback(sportsbookId, callbackUrl, allowedIPs);

  if (updated) {
    res.json({
      success: true,
      message: 'Callback URL updated',
      callbackUrl,
      allowedIPs
    });
  } else {
    res.status(500).json({ error: 'Failed to update callback' });
  }
});

// Test callback endpoint
router.post('/test/:sportsbookId', async (req: Request, res: Response) => {
  const { sportsbookId } = req.params;
  const { apiKey } = req.body;
  const clientIP = getClientIP(req);

  const sportsbooks = streamingService.getExternalSportsbooks();
  const sportsbook = sportsbooks.find(sb => sb.id === sportsbookId);

  if (!sportsbook) {
    return res.status(404).json({ error: 'Sportsbook not found' });
  }

  if (sportsbook.apiKey !== apiKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  if (!streamingService.validateIPAccess(sportsbookId, clientIP)) {
    return res.status(403).json({ 
      error: 'IP address not authorized',
      clientIP,
      allowedIPs: sportsbook.allowedIPs
    });
  }

  // Send test payload to callback URL
  try {
    const testPayload = {
      source: 'Young Meat LLC - betvages23.in',
      event: 'test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'Test callback from betting engine',
        sportsbookId,
        clientIP
      }
    };

    res.json({
      success: true,
      message: 'Callback endpoint validated',
      testPayload,
      callbackUrl: sportsbook.webhookUrl,
      note: 'In production, payload would be sent to your callback URL'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Callback test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// List all registered callbacks
router.get('/list', (req: Request, res: Response) => {
  const sportsbooks = streamingService.getExternalSportsbooks();
  
  res.json({
    count: sportsbooks.length,
    sportsbooks: sportsbooks.map(sb => ({
      id: sb.id,
      name: sb.name,
      callbackUrl: sb.webhookUrl,
      allowedIPs: sb.allowedIPs,
      active: sb.active,
      registeredAt: sb.registeredAt,
      githubProject: sb.githubProject
    }))
  });
});

// Receive game updates from external sources (for partners who want to push data to you)
router.post('/receive/:sportsbookId', (req: Request, res: Response) => {
  const { sportsbookId } = req.params;
  const { apiKey, gameUpdate } = req.body;
  const clientIP = getClientIP(req);

  const sportsbooks = streamingService.getExternalSportsbooks();
  const sportsbook = sportsbooks.find(sb => sb.id === sportsbookId);

  if (!sportsbook) {
    return res.status(404).json({ error: 'Sportsbook not found' });
  }

  if (sportsbook.apiKey !== apiKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  if (!streamingService.validateIPAccess(sportsbookId, clientIP)) {
    return res.status(403).json({ 
      error: 'IP address not authorized',
      clientIP 
    });
  }

  // Process the game update
  if (gameUpdate) {
    streamingService.pushGameUpdate(gameUpdate);
    res.json({
      success: true,
      message: 'Game update received and processed'
    });
  } else {
    res.status(400).json({ error: 'Missing game update data' });
  }
});

export default router;
