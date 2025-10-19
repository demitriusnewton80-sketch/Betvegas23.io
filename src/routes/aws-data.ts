
import express, { Request, Response } from 'express';
import { awsDataService } from '../services/AWSDataService.js';
import { ssoService } from '../services/SSOService.js';
import { ecommerceService } from '../services/ECommerceService.js';

const router = express.Router();

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: Function) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');

  if (!sessionId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = ssoService.validateSession(sessionId);
  if (!user) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  (req as any).user = user;
  next();
};

// Store app data in AWS
router.post('/store', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { dataType, content, encrypt } = req.body;

  if (!dataType || !content) {
    return res.status(400).json({ error: 'dataType and content are required' });
  }

  const result = await awsDataService.storeData(userId, dataType, content, encrypt);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    success: true,
    message: 'Data stored in AWS S3',
    operation: result.operation,
    dataId: result.data?.id,
    s3Location: result.operation?.s3Location,
    fccEntity: '20130314143016'
  });
});

// Retrieve app data from AWS
router.get('/retrieve/:dataId', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { dataId } = req.params;

  const result = await awsDataService.retrieveData(userId, dataId);

  if (!result.success) {
    return res.status(404).json({ error: result.error });
  }

  res.json({
    success: true,
    data: result.data
  });
});

// Update app data in AWS
router.put('/update/:dataId', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { dataId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'content is required' });
  }

  const result = await awsDataService.updateData(userId, dataId, content);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    success: true,
    message: 'Data updated in AWS S3',
    operation: result.operation,
    data: result.data,
    s3Location: result.operation?.s3Location
  });
});

// Delete app data from AWS
router.delete('/delete/:dataId', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { dataId } = req.params;

  const result = await awsDataService.deleteData(userId, dataId);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    success: true,
    message: 'Data deleted from AWS S3',
    operation: result.operation
  });
});

// List all user data
router.get('/list', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const userData = awsDataService.getUserData(userId);

  res.json({
    success: true,
    count: userData.length,
    data: userData.map(item => ({
      id: item.id,
      dataType: item.dataType,
      metadata: item.metadata,
      s3Key: item.s3Key
    }))
  });
});

// Batch store multiple data items
router.post('/batch-store', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items array is required' });
  }

  const result = await awsDataService.batchStore(userId, items);

  res.json({
    success: result.success,
    message: `Stored ${result.results.length} items, ${result.errors.length} errors`,
    results: result.results,
    errors: result.errors,
    fccEntity: '20130314143016'
  });
});

// Get operation status
router.get('/operation/:operationId', requireAuth, (req: Request, res: Response) => {
  const { operationId } = req.params;
  const operation = awsDataService.getOperation(operationId);

  if (!operation) {
    return res.status(404).json({ error: 'Operation not found' });
  }

  const userId = (req as any).user.id;
  if (operation.userId !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json({
    success: true,
    operation
  });
});

// Get user operations
router.get('/operations', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const operations = awsDataService.getUserOperations(userId);

  res.json({
    success: true,
    count: operations.length,
    operations
  });
});

// AWS data function status
router.get('/status', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const awsConnection = ecommerceService.getAWSConnection(userId);
  const userData = awsDataService.getUserData(userId);
  const operations = awsDataService.getUserOperations(userId);

  res.json({
    success: true,
    awsConnected: !!awsConnection,
    accountId: awsConnection?.accountId,
    region: awsConnection?.region,
    totalData: userData.length,
    totalOperations: operations.length,
    recentOperations: operations.slice(-5),
    fccEntity: '20130314143016',
    dataFunctionsEnabled: true
  });
});

export default router;
