
import express, { Request, Response } from 'express';
import { sportsRadioService } from '../services/SportsRadioService.js';

const router = express.Router();

// Get all live radio streams
router.get('/live', (req: Request, res: Response) => {
  const liveStreams = sportsRadioService.getLiveRadioStreams();
  
  res.json({
    streams: liveStreams,
    count: liveStreams.length,
    fccEntity: '20130314143016',
    protected: true,
    timestamp: new Date().toISOString()


// Proxy endpoint for player23.ag logos
router.get('/player23/:league/:teamName', async (req: Request, res: Response) => {
  const { league, teamName } = req.params;
  const sanitizedTeam = teamName.toLowerCase().replace(/\s+/g, '-');
  const leaguePath = league.toLowerCase();
  const player23Url = `https://player23.ag/assets/logos/${leaguePath}/${sanitizedTeam}.png`;
  
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(player23Url);
    
    if (!response.ok) {
      return res.status(404).json({ 
        error: 'Logo not found on player23.ag',
        url: player23Url 
      });
    }
    
    const buffer = await response.buffer();
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-Logo-Source', 'player23.ag');
    res.setHeader('X-FCC-Entity', '20130314143016');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch logo from player23.ag',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

  });
});

// Get radio streams by league
router.get('/league/:league', (req: Request, res: Response) => {
  const { league } = req.params;
  const streams = sportsRadioService.getRadioStreamsByLeague(league);
  
  res.json({
    league: league.toUpperCase(),
    streams,
    count: streams.length,
    timestamp: new Date().toISOString()
  });
});

// Get all radio streams
router.get('/streams', (req: Request, res: Response) => {
  const allStreams = sportsRadioService.getAllRadioStreams();
  
  res.json({
    streams: allStreams,
    total: allStreams.length,
    live: allStreams.filter(s => s.status === 'live').length,
    timestamp: new Date().toISOString()
  });
});

// Get specific radio stream
router.get('/stream/:streamId', (req: Request, res: Response) => {
  const { streamId } = req.params;
  const stream = sportsRadioService.getRadioStream(streamId);
  
  if (!stream) {
    return res.status(404).json({ error: 'Stream not found' });
  }
  
  res.json({
    stream,
    timestamp: new Date().toISOString()
  });
});

// Get protected team logo as SVG
router.get('/logo/:league/:teamName', (req: Request, res: Response) => {
  const { league, teamName } = req.params;
  const decodedTeamName = decodeURIComponent(teamName);
  
  const { teamLogoService } = require('../services/TeamLogoService.js');
  const logoSVG = teamLogoService.generateLogoSVG(league, decodedTeamName);
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('X-FCC-Entity', '20130314143016');
  res.setHeader('X-Copyright', '© 2025 Young Meeat LLC. All rights reserved.');
  res.setHeader('X-Logo-Source', 'player23.ag');
  
  res.send(logoSVG);
});

// Get team logo info as JSON
router.get('/logo/:league/:teamName/info', (req: Request, res: Response) => {
  const { league, teamName } = req.params;
  const logo = sportsRadioService.getTeamLogoInfo(league, decodeURIComponent(teamName));
  
  if (!logo) {
    return res.status(404).json({ error: 'Team logo not found' });
  }
  
  res.json({
    logo,
    protection: {
      watermark: logo.watermark,
      fccEntity: '20130314143016',
      copyrightNotice: '© 2025 Young Meeat LLC. All rights reserved.'
    },
    timestamp: new Date().toISOString()
  });
});

// Get all protected logos
router.get('/logos', (req: Request, res: Response) => {
  const logos = sportsRadioService.getAllProtectedLogos();
  
  res.json({
    logos,
    count: logos.length,
    protection: {
      fccEntity: '20130314143016',
      watermark: 'Young Meeat LLC - FCC 20130314143016',
      copyrightNotice: '© 2025 Young Meeat LLC. All team logos are protected.'
    },
    timestamp: new Date().toISOString()
  });
});

// SSE endpoint for live radio updates
router.get('/stream-updates', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const updateHandler = (update: any) => {
    res.write(`data: ${JSON.stringify(update)}\n\n`);
  };

  sportsRadioService.on('radioUpdate', updateHandler);

  // Send initial data
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    streams: sportsRadioService.getLiveRadioStreams(),
    timestamp: new Date().toISOString()
  })}\n\n`);

  req.on('close', () => {
    sportsRadioService.off('radioUpdate', updateHandler);
    res.end();
  });
});

export default router;
