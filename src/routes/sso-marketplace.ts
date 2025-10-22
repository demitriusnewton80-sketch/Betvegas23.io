
import express, { Request, Response } from 'express';
import { ssoMarketplaceService } from '../services/SSOMarketplaceService.js';
import { ssoService } from '../services/SSOService.js';

const router = express.Router();

// Middleware for SSO authentication
const requireAuth = (req: Request, res: Response, next: Function) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');

  if (!sessionId) {
    return res.status(401).json({ error: 'SSO authentication required' });
  }

  const user = ssoService.validateSession(sessionId);
  if (!user) {
    return res.status(401).json({ error: 'Invalid SSO session' });
  }

  (req as any).user = user;
  next();
};

// Create marketplace account
router.post('/account/create', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { ssoProviderId } = req.body;

  const account = ssoMarketplaceService.createMarketplaceAccount(
    user.email,
    ssoProviderId || user.provider
  );

  // Auto-sync with SSO
  ssoMarketplaceService.syncWithSSO(account.id);

  res.json({
    success: true,
    account: {
      id: account.id,
      email: account.email,
      fccEntity: account.fccEntity,
      appliances: account.appliances.length,
      createdAt: new Date(account.createdAt).toISOString()
    },
    message: 'Marketplace account created and synced with SSO'
  });
});

// Get all available appliances
router.get('/appliances', (req: Request, res: Response) => {
  const appliances = ssoMarketplaceService.getAllAppliances();

  res.json({
    success: true,
    appliances: appliances.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      status: a.status,
      ssoIntegrated: a.ssoIntegrated,
      endpoints: a.endpoints,
      metadata: a.metadata
    })),
    count: appliances.length,
    fccEntity: '20130314143016'
  });
});

// Get account appliances
router.get('/account/:accountId/appliances', requireAuth, (req: Request, res: Response) => {
  const { accountId } = req.params;
  const appliances = ssoMarketplaceService.getAccountAppliances(accountId);

  res.json({
    success: true,
    accountId,
    appliances,
    count: appliances.length
  });
});

// Activate appliance for account
router.post('/account/:accountId/appliances/:applianceId/activate', requireAuth, (req: Request, res: Response) => {
  const { accountId, applianceId } = req.params;

  const success = ssoMarketplaceService.activateApplianceForAccount(accountId, applianceId);

  if (!success) {
    return res.status(404).json({
      success: false,
      error: 'Account or appliance not found'
    });
  }

  const appliance = ssoMarketplaceService.getAppliance(applianceId);

  res.json({
    success: true,
    message: `Appliance ${appliance?.name} activated`,
    accountId,
    applianceId
  });
});

// Deactivate appliance for account
router.post('/account/:accountId/appliances/:applianceId/deactivate', requireAuth, (req: Request, res: Response) => {
  const { accountId, applianceId } = req.params;

  const success = ssoMarketplaceService.deactivateApplianceForAccount(accountId, applianceId);

  if (!success) {
    return res.status(404).json({
      success: false,
      error: 'Account not found'
    });
  }

  res.json({
    success: true,
    message: 'Appliance deactivated',
    accountId,
    applianceId
  });
});

// Get marketplace statistics
router.get('/stats', (req: Request, res: Response) => {
  const stats = ssoMarketplaceService.getMarketplaceStats();
  res.json({
    success: true,
    ...stats
  });
});

// Sync account with SSO
router.post('/account/:accountId/sync-sso', requireAuth, (req: Request, res: Response) => {
  const { accountId } = req.params;

  const success = ssoMarketplaceService.syncWithSSO(accountId);

  if (!success) {
    return res.status(404).json({
      success: false,
      error: 'Account not found'
    });
  }

  const appliances = ssoMarketplaceService.getAccountAppliances(accountId);

  res.json({
    success: true,
    message: 'SSO sync completed',
    accountId,
    activatedAppliances: appliances.length
  });
});

export default router;
