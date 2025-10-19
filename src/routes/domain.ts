
import express, { Request, Response } from 'express';

const router = express.Router();

// Get current domain info
router.get('/info', (req: Request, res: Response) => {
  const protocol = req.protocol;
  const host = req.get('host');
  const baseUrl = `${protocol}://${host}`;
  
  res.json({
    protocol,
    host,
    baseUrl,
    endpoints: {
      sportsbook: `${baseUrl}/sportsbook/games`,
      ps5: `${baseUrl}/ps5/games`,
      streaming: `${baseUrl}/streaming/status`,
      ssoPlugins: `${baseUrl}/sso-plugin/plugins/enabled`,
      qrPortal: `${baseUrl}/qr-login-portal.html`,
      personalLogin: `${baseUrl}/personal-sso-login.html`,
      ps5Betting: `${baseUrl}/ps5-betting.html`,
      bettingPortal: `${baseUrl}/ps5-qr-betting-portal.html`
    },
    fccEntity: '20130314143016',
    status: 'operational'
  });
});

export default router;
