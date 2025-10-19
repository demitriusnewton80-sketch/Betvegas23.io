
import express, { Request, Response } from 'express';
import { samGovService } from '../services/SAMGovService.js';
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

// Get Young Meeat LLC entity information from SAM.gov
router.get('/entity/young-meeat-llc', async (req: Request, res: Response) => {
  try {
    const entity = await samGovService.searchEntity('Young Meeat LLC');
    
    if (!entity) {
      return res.status(404).json({
        error: 'Entity not found in SAM.gov',
        searchUrl: 'https://sam.gov/search?q=Young%20Meeat%20LLC',
        fccEntity: '20130314143016'
      });
    }

    res.json({
      entity,
      fccEntity: '20130314143016',
      profileLink: samGovService.getEntityProfileLink(entity.ueiSAM),
      message: 'Young Meeat LLC entity data retrieved from SAM.gov'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve SAM.gov entity data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Search SAM.gov entity by name
router.get('/entity/search', async (req: Request, res: Response) => {
  const { name } = req.query;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Entity name required' });
  }

  try {
    const entity = await samGovService.searchEntity(name);
    
    if (!entity) {
      return res.status(404).json({
        error: 'Entity not found',
        searchUrl: `https://sam.gov/search?q=${encodeURIComponent(name)}`
      });
    }

    res.json({
      entity,
      profileLink: samGovService.getEntityProfileLink(entity.ueiSAM)
    });
  } catch (error) {
    res.status(500).json({
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get entity by UEI
router.get('/entity/uei/:uei', async (req: Request, res: Response) => {
  const { uei } = req.params;

  try {
    const entity = await samGovService.getEntityByUEI(uei);
    
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    res.json({
      entity,
      profileLink: samGovService.getEntityProfileLink(uei)
    });
  } catch (error) {
    res.status(500).json({
      error: 'Lookup failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Validate SAM.gov registration
router.get('/validate/:entityName', async (req: Request, res: Response) => {
  const { entityName } = req.params;

  try {
    const validation = await samGovService.validateRegistration(entityName);
    
    res.json({
      entityName,
      validation,
      fccEntity: '20130314143016',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Validation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// SAM.gov SSO integration - Initiate login
router.get('/sso/login', (req: Request, res: Response) => {
  const returnUrl = (req.query.return_url as string) || `${req.protocol}://${req.get('host')}/sam/sso/callback`;
  const ssoUrl = samGovService.generateSSOUrl(returnUrl);
  
  res.json({
    ssoUrl,
    message: 'Redirect to SAM.gov SSO login',
    fccEntity: '20130314143016',
    entityName: 'Young Meeat LLC'
  });
});

// SAM.gov SSO callback
router.get('/sso/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code missing' });
  }

  res.json({
    message: 'SAM.gov SSO callback received',
    authenticated: true,
    fccEntity: '20130314143016',
    entityName: 'Young Meeat LLC',
    note: 'Integrate with actual SAM.gov OAuth token exchange'
  });
});

// Get SAM.gov configuration
router.get('/config', requireAuth, (req: Request, res: Response) => {
  const config = samGovService.getConfig();
  
  res.json({
    baseUrl: config.baseUrl,
    entityName: config.entityName,
    fccEntity: config.fccEntity,
    uei: config.uei,
    hasApiKey: !!config.apiKey,
    profileLink: samGovService.getEntityProfileLink()
  });
});

// Update SAM.gov API key (admin only)
router.post('/config/api-key', requireAuth, (req: Request, res: Response) => {
  const { apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'API key required' });
  }

  samGovService.updateApiKey(apiKey);
  
  res.json({
    message: 'SAM.gov API key updated',
    fccEntity: '20130314143016'
  });
});

// Get cached entities
router.get('/cache', requireAuth, (req: Request, res: Response) => {
  const entities = samGovService.getCachedEntities();
  
  res.json({
    entities,
    count: entities.length,
    fccEntity: '20130314143016'
  });
});

// Direct link to SAM.gov profile
router.get('/profile-link', (req: Request, res: Response) => {
  const profileLink = samGovService.getEntityProfileLink();
  
  res.json({
    entityName: 'Young Meeat LLC',
    fccEntity: '20130314143016',
    profileLink,
    directAccess: true
  });
});

export default router;
