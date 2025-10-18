
import express, { Request, Response } from 'express';
import { ecommerceService } from '../services/ECommerceService.js';
import { ssoService } from '../services/SSOService.js';

const router = express.Router();

// AWS ARN format validator
const validateARN = (arn: string): boolean => {
  const arnPattern = /^arn:aws:[a-z\-]+:[a-z0-9\-]*:\d{12}:[a-zA-Z0-9\/\-_]+$/;
  return arnPattern.test(arn);
};

// Register AWS resource ARN
router.post('/resources/register', async (req: Request, res: Response) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');
  const user = ssoService.validateSession(sessionId || '');
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { arn, resourceType, accountId, region } = req.body;
  
  if (!arn || !validateARN(arn)) {
    return res.status(400).json({ error: 'Invalid ARN format' });
  }

  // Parse ARN
  const arnParts = arn.split(':');
  const service = arnParts[2];
  const detectedRegion = arnParts[3];
  const detectedAccountId = arnParts[4];

  const connection = ecommerceService.getAWSConnection(user.id);
  const resources = connection?.resources || [];

  resources.push({
    arn,
    type: resourceType || service,
    status: 'active'
  });

  ecommerceService.connectAWS(
    user.id,
    accountId || detectedAccountId,
    region || detectedRegion,
    resources
  );

  res.json({
    message: 'AWS resource registered',
    arn,
    service,
    region: detectedRegion,
    accountId: detectedAccountId,
    resourceType: resourceType || service
  });
});

// List registered AWS resources
router.get('/resources', async (req: Request, res: Response) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');
  const user = ssoService.validateSession(sessionId || '');
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const connection = ecommerceService.getAWSConnection(user.id);
  
  res.json({
    connected: !!connection,
    accountId: connection?.accountId,
    region: connection?.region,
    resources: connection?.resources || [],
    count: connection?.resources?.length || 0
  });
});

// Test AWS connectivity
router.post('/test-connection', async (req: Request, res: Response) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');
  const user = ssoService.validateSession(sessionId || '');
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const connection = ecommerceService.getAWSConnection(user.id);
  
  if (!connection) {
    return res.status(400).json({ error: 'No AWS connection found' });
  }

  res.json({
    status: 'connected',
    accountId: connection.accountId,
    region: connection.region,
    resourceCount: connection.resources.length,
    message: 'AWS integration is active and ready for oil application provisioning'
  });
});

export default router;
