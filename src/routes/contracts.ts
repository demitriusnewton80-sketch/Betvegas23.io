
import express, { Request, Response } from 'express';

const router = express.Router();

// Get PS5 Betting Contract
router.get('/ps5-betting', (req: Request, res: Response) => {
  res.json({
    title: 'PlayStation 5 Sports Betting Agreement',
    entity: 'Young Meat LLC',
    fccEntity: '20130314143016',
    fccRegistration: '0024454324',
    effectiveDate: new Date().toISOString(),
    terms: [
      'Users must authenticate via SSO to place bets',
      'All bets are final once placed',
      'Stream access granted automatically upon bet placement',
      'WiFi Core 6E connectivity required for optimal experience',
      'Must be 21+ years of age to participate',
      'Responsible gaming policies apply'
    ],
    privacy: 'All user data is encrypted and stored securely in compliance with FCC regulations',
    version: '1.0',
    lastUpdated: new Date().toISOString()
  });
});

// Get SSO Terms
router.get('/sso-terms', (req: Request, res: Response) => {
  res.json({
    title: 'Single Sign-On (SSO) Terms of Service',
    provider: 'FCC-Compliant SSO System',
    entity: '20130314143016',
    terms: [
      'SSO is required for all betting transactions',
      'Session tokens expire after 1 hour of inactivity',
      'User credentials are never stored on our servers',
      'OAuth 2.0 protocol is used for secure authentication',
      'Users can revoke access at any time'
    ],
    dataUsage: 'We collect only essential information: email, name, and user ID for authentication purposes',
    version: '1.0',
    lastUpdated: new Date().toISOString()
  });
});

// Accept contract (track user acceptance)
router.post('/accept', (req: Request, res: Response) => {
  const { contractType, userId } = req.body;
  
  if (!contractType || !userId) {
    return res.status(400).json({ error: 'Missing contract type or user ID' });
  }
  
  // In production, store this in database
  res.json({
    success: true,
    contractType,
    userId,
    acceptedAt: new Date().toISOString(),
    message: 'Contract accepted successfully'
  });
});

export default router;
