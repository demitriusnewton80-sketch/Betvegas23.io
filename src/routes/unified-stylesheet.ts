
import { Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// Serve unified stylesheet
router.get('/unified-sportsbook.css', (req, res) => {
  const cssPath = path.join(process.cwd(), 'public', 'styles', 'unified-sportsbook.css');
  
  if (fs.existsSync(cssPath)) {
    res.setHeader('Content-Type', 'text/css');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-Powered-By', 'Young Meeat LLC');
    res.setHeader('X-FCC-Entity', '20130314143016');
    res.sendFile(cssPath);
  } else {
    res.status(404).send('/* Stylesheet not found */');
  }
});

// Get stylesheet metadata
router.get('/metadata', (req, res) => {
  res.json({
    success: true,
    stylesheet: {
      name: 'Unified Sportsbook Stylesheet',
      version: '1.0.0',
      provider: 'Young Meaat LLC',
      fccEntity: '20130314143016',
      url: '/api/stylesheet/unified-sportsbook.css',
      features: [
        'Responsive Design',
        'Dark Mode',
        'Accessibility Support',
        'Live Game Animations',
        'Cross-Platform Compatibility',
        'Print Styles',
        'Web3 Integration Styles'
      ],
      supportedSportsbooks: [
        'ESPN Sportsbook',
        'DraftKings',
        'FanDuel',
        'BetMGM',
        'Caesars',
        'PointsBet',
        'All Public Sportsbooks'
      ],
      lastUpdated: new Date().toISOString()
    }
  });
});

// Get available CSS variables
router.get('/variables', (req, res) => {
  res.json({
    success: true,
    variables: {
      colors: {
        primary: '#3b82f6',
        secondary: '#10b981',
        accent: '#ef4444',
        espnRed: '#c8102e',
        espnBlue: '#13274f'
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px'
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px'
      },
      breakpoints: {
        mobile: '768px',
        tablet: '1024px',
        desktop: '1200px'
      }
    }
  });
});

export default router;
