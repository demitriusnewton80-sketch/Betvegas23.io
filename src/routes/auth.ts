import express, { Request, Response } from 'express';
import { ssoService } from '../services/SSOService.js';
import crypto from 'crypto';

const router = express.Router();

// SSO Login - Redirect to provider
router.get('/login', (req: Request, res: Response) => {
  const state = crypto.randomBytes(16).toString('hex');
  const redirectUrl = req.query.redirect as string || '/';
  const authUrl = ssoService.getAuthorizationUrl(state);

  res.cookie('oauth_state', state, {
    httpOnly: true,
    maxAge: 600000,
    sameSite: 'lax'
  });

  res.cookie('post_login_redirect', redirectUrl, {
    httpOnly: true,
    maxAge: 600000,
    sameSite: 'lax'
  });

  res.redirect(authUrl);
});

// SSO Callback - Handle provider response
router.get('/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;
  const savedState = req.cookies?.oauth_state;
  const redirectUrl = req.cookies?.post_login_redirect || '/';

  if (!code || !state || state !== savedState) {
    return res.status(400).json({ error: 'Invalid OAuth callback' });
  }

  try {
    const user = await ssoService.exchangeCode(code as string);
    const sessionId = crypto.randomBytes(64).toString('hex');

    res.cookie('session_id', sessionId, {
      httpOnly: true,
      maxAge: 3600000,
      sameSite: 'lax'
    });

    res.clearCookie('oauth_state');
    res.clearCookie('post_login_redirect');

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('SSO callback error:', error);
    res.status(500).json({
      error: 'Authentication processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
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