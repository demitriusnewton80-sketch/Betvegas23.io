
import express, { Request, Response } from 'express';
import { awsCoreBuilder } from '../core/AWSCoreBuilder.js';
import { ssoService } from '../services/SSOService.js';

const router = express.Router();

// Build AWS core connection
router.post('/build', async (req: Request, res: Response) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');
  const user = ssoService.validateSession(sessionId || '');
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { accountId, region } = req.body;
  
  if (!accountId || !region) {
    return res.status(400).json({ error: 'accountId and region are required' });
  }

  try {
    const connectionId = await awsCoreBuilder.buildCoreConnection(user.id, accountId, region);
    const connection = awsCoreBuilder.getConnection(connectionId);
    
    res.json({
      success: true,
      connectionId,
      connection,
      message: 'AWS Core connection built successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to build core connection'
    });
  }
});

// Add resource using ARN
router.post('/resource/add', async (req: Request, res: Response) => {
  const { connectionId, service, resourceType, resourceId } = req.body;
  
  if (!connectionId || !service || !resourceType || !resourceId) {
    return res.status(400).json({
      error: 'connectionId, service, resourceType, and resourceId are required'
    });
  }

  try {
    const arn = await awsCoreBuilder.addResource(connectionId, service, resourceType, resourceId);
    const resource = awsCoreBuilder.getResource(arn);
    
    res.json({
      success: true,
      arn,
      resource
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add resource'
    });
  }
});

// Discover and connect existing ARNs
router.post('/discover', async (req: Request, res: Response) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');
  const user = ssoService.validateSession(sessionId || '');
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const results = await awsCoreBuilder.discoverAndConnect(user.id);
    
    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Discovery failed'
    });
  }
});

// Build service core infrastructure
router.post('/service/build', async (req: Request, res: Response) => {
  const { connectionId, service } = req.body;
  
  if (!connectionId || !service) {
    return res.status(400).json({ error: 'connectionId and service are required' });
  }

  const validServices = ['s3', 'ec2', 'lambda', 'dynamodb', 'rds'];
  if (!validServices.includes(service)) {
    return res.status(400).json({ error: `Service must be one of: ${validServices.join(', ')}` });
  }

  try {
    const arns = await awsCoreBuilder.buildServiceCore(connectionId, service);
    
    res.json({
      success: true,
      service,
      arnsCreated: arns.length,
      arns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to build service core'
    });
  }
});

// Get core status
router.get('/status', (req: Request, res: Response) => {
  const status = awsCoreBuilder.getStatus();
  res.json(status);
});

// Get all connections
router.get('/connections', (req: Request, res: Response) => {
  const connections = awsCoreBuilder.getConnections();
  res.json({ connections });
});

// Get all resources
router.get('/resources', (req: Request, res: Response) => {
  const resources = awsCoreBuilder.getResources();
  res.json({ resources });
});

// Get connection by ID
router.get('/connections/:id', (req: Request, res: Response) => {
  const connection = awsCoreBuilder.getConnection(req.params.id);
  
  if (!connection) {
    return res.status(404).json({ error: 'Connection not found' });
  }
  
  res.json({ connection });
});

export default router;
