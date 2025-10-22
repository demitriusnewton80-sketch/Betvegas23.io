
import express, { Request, Response } from 'express';
import { githubRecoveryService } from '../services/GitHubRecoveryService.js';

const router = express.Router();

// Get recovery code status (masked)
router.get('/status', (req: Request, res: Response) => {
  const status = githubRecoveryService.getCodeStatus();
  
  res.json({
    success: true,
    ...status,
    warning: status.available < 3 ? 'Low on recovery codes - generate new ones on GitHub' : null,
    fccEntity: '20130314143016'
  });
});

// Import recovery codes (protected endpoint)
router.post('/import', (req: Request, res: Response) => {
  const { codes, apiKey } = req.body;
  
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }
  
  if (!codes || !Array.isArray(codes)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid codes format'
    });
  }
  
  githubRecoveryService.importCodes(codes);
  
  res.json({
    success: true,
    message: 'Recovery codes imported securely',
    count: codes.length
  });
});

// Mark code as used
router.post('/mark-used', (req: Request, res: Response) => {
  const { code, apiKey } = req.body;
  
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }
  
  githubRecoveryService.markCodeAsUsed(code);
  
  res.json({
    success: true,
    message: 'Code marked as used'
  });
});

// Security reminder
router.get('/security-guide', (req: Request, res: Response) => {
  res.json({
    title: 'GitHub Recovery Codes Security Guide',
    fccEntity: '20130314143016',
    guidelines: [
      'Never share recovery codes with anyone',
      'Store codes in multiple secure locations',
      'Each code can only be used once',
      'Generate new codes when you have less than 3 remaining',
      'Never commit recovery codes to version control',
      'Use recovery codes only when you cannot access your 2FA device'
    ],
    usage: {
      when_to_use: 'When you lose access to your 2FA device',
      how_to_use: 'Enter a recovery code instead of your 2FA code during login',
      after_use: 'The code becomes invalid and cannot be reused'
    },
    regeneration: {
      url: 'https://github.com/settings/security',
      steps: [
        'Go to Settings → Password and authentication',
        'Click "Show" under Recovery codes',
        'Click "Generate new recovery codes"',
        'Save the new codes securely'
      ]
    }
  });
});

export default router;
