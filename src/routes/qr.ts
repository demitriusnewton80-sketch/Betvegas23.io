
import express, { Request, Response } from 'express';

const router = express.Router();

// Get QR code information
router.get('/info', (req: Request, res: Response) => {
  const baseUrl = process.env.REPL_SLUG 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    : req.protocol + '://' + req.get('host');
  
  res.json({
    qrCodeUrl: `${baseUrl}/qr-login-portal.html`,
    ssoLoginUrl: `${baseUrl}/personal-sso-login.html`,
    description: 'QR code for business providers and management services',
    fccEntity: '20130314143016',
    features: [
      'Multi-provider SSO authentication',
      'FCC compliant access',
      'SAM.gov integration',
      'AWS Cognito support',
      'GitHub OAuth',
      'Google OAuth'
    ]
  });
});

// Generate QR code data URL
router.get('/generate', (req: Request, res: Response) => {
  const baseUrl = process.env.REPL_SLUG 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    : req.protocol + '://' + req.get('host');
  
  const targetUrl = req.query.url || `${baseUrl}/personal-sso-login.html`;
  
  res.json({
    targetUrl,
    qrPortalUrl: `${baseUrl}/qr-login-portal.html`,
    instructions: 'Use the qrPortalUrl to access the interactive QR code page',
    message: 'Scan QR code to access all SSO login providers'
  });
});

// Get all available SSO providers for QR display
router.get('/providers', async (req: Request, res: Response) => {
  try {
    // This would integrate with your SSO plugin service
    res.json({
      providers: [
        { id: 'fcc-sso', name: 'FCC SSO', icon: '📡', enabled: true },
        { id: 'sam-gov-sso', name: 'SAM.gov SSO', icon: '🏛️', enabled: true },
        { id: 'aws-cognito', name: 'AWS Cognito', icon: '☁️', enabled: true },
        { id: 'github-oauth', name: 'GitHub', icon: '🐙', enabled: true },
        { id: 'google-oauth', name: 'Google', icon: '🔐', enabled: true }
      ],
      qrCodeEnabled: true,
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load providers' });
  }
});

export default router;
