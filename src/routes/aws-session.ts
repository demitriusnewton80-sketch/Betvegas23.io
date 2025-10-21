
import express, { Request, Response } from 'express';
import { awsSessionTokenService } from '../services/AWSSessionTokenService.js';
import { ssoService } from '../services/SSOService.js';

const router = express.Router();

// Get token status
router.get('/status', (req: Request, res: Response) => {
  const isValid = awsSessionTokenService.isValid();
  const tokenInfo = awsSessionTokenService.getTokenInfo();
  
  res.json({
    success: true,
    isValid,
    hasToken: !!tokenInfo,
    region: tokenInfo?.region,
    createdAt: tokenInfo?.createdAt,
    expiresAt: tokenInfo?.expiresAt
  });
});

// Set token (admin only)
router.post('/set', async (req: Request, res: Response) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');
  const user = ssoService.validateSession(sessionId || '');
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { token, region, expiresAt } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const expires = expiresAt ? new Date(expiresAt) : undefined;
    awsSessionTokenService.setToken(token, region || 'us-east-1', expires);
    
    res.json({
      success: true,
      message: 'AWS Session Token set successfully',
      region: region || 'us-east-1'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set token'
    });
  }
});

// Load token from file (migration helper)
router.post('/load-from-file', async (req: Request, res: Response) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');
  const user = ssoService.validateSession(sessionId || '');
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { filePath } = req.body;
  
  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }

  try {
    const success = await awsSessionTokenService.loadFromFile(filePath);
    
    if (success) {
      res.json({
        success: true,
        message: 'Token loaded from file. Please add it to Secrets for persistence.'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to load token from file'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load token'
    });
  }
});

// Clear token
router.post('/clear', async (req: Request, res: Response) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');
  const user = ssoService.validateSession(sessionId || '');
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  awsSessionTokenService.clearToken();
  
  res.json({
    success: true,
    message: 'AWS Session Token cleared'
  });
});

export default router;
