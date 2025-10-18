
import express, { Request, Response } from 'express';
import { ssoService } from '../services/SSOService.js';

const router = express.Router();

// SSO Login - Redirect to provider
router.get('/login', (req: Request, res: Response) => {
  const authUrl = ssoService.getAuthorizationUrl();
  res.redirect(authUrl);
});

// SSO Callback - Handle provider response
router.get('/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).json({
      error: 'Authentication failed',
      details: error
    });
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({
      error: 'Missing authorization code'
    });
  }

  try {
    const user = await ssoService.exchangeCode(code);
    
    // In production, set secure HTTP-only cookie
    res.cookie('session_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    });

    // Redirect to main app
    res.redirect('/?authenticated=true');
  } catch (err) {
    console.error('SSO callback error:', err);
    res.status(500).json({
      error: 'Authentication processing failed'
    });
  }
});

// Get current user info
router.get('/me', (req: Request, res: Response) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');

  if (!sessionId) {
    return res.status(401).json({
      error: 'Not authenticated'
    });
  }

  const user = ssoService.validateSession(sessionId);

  if (!user) {
    return res.status(401).json({
      error: 'Invalid or expired session'
    });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider
    }
  });
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  const sessionId = req.cookies?.session_id;

  if (sessionId) {
    ssoService.logout(sessionId);
    res.clearCookie('session_id');
  }

  res.json({
    message: 'Logged out successfully'
  });
});

// SSO Status
router.get('/status', (req: Request, res: Response) => {
  res.json({
    ssoEnabled: true,
    activeSessions: ssoService.getActiveSessions(),
    provider: 'FCC-SSO'
  });
});

export default router;
