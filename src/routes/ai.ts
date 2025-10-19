
import express, { Request, Response } from 'express';
import { coreAIService } from '../services/CoreAIService.js';
import { ssoService } from '../services/SSOService.js';

const router = express.Router();

// Get all AI models
router.get('/models', (req: Request, res: Response) => {
  const models = coreAIService.getModels();
  
  res.json({
    success: true,
    models,
    count: models.length,
    fccEntity: '20130314143016'
  });
});

// Get specific model
router.get('/models/:modelId', (req: Request, res: Response) => {
  const { modelId } = req.params;
  const model = coreAIService.getModel(modelId);
  
  if (!model) {
    return res.status(404).json({ error: 'Model not found' });
  }

  res.json({
    success: true,
    model
  });
});

// Process AI request
router.post('/process', async (req: Request, res: Response) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');
  const user = ssoService.validateSession(sessionId || '');
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { prompt, modelId } = req.body;

  if (!prompt || !modelId) {
    return res.status(400).json({ error: 'Prompt and modelId required' });
  }

  const result = await coreAIService.processRequest(user.id, prompt, modelId);

  if (!result.success) {
    return res.status(500).json({ error: result.error });
  }

  res.json({
    success: true,
    request: result.request,
    fccEntity: '20130314143016'
  });
});

// Provide feedback on AI response
router.post('/feedback/:requestId', (req: Request, res: Response) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');
  const user = ssoService.validateSession(sessionId || '');
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { requestId } = req.params;
  const { feedback } = req.body;

  if (!feedback || !['positive', 'negative', 'neutral'].includes(feedback)) {
    return res.status(400).json({ error: 'Valid feedback required (positive/negative/neutral)' });
  }

  const result = coreAIService.provideFeedback(requestId, feedback);

  res.json(result);
});

// Get AI insights for user
router.get('/insights', (req: Request, res: Response) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');
  const user = ssoService.validateSession(sessionId || '');
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const insights = coreAIService.getInsights(user.id);

  res.json({
    success: true,
    insights,
    userId: user.id,
    fccEntity: '20130314143016'
  });
});

// Get request history
router.get('/history', (req: Request, res: Response) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');
  const user = ssoService.validateSession(sessionId || '');
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const history = coreAIService.getRequestHistory(user.id);

  res.json({
    success: true,
    history,
    count: history.length
  });
});

// Train model with new data
router.post('/models/:modelId/train', async (req: Request, res: Response) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');
  const user = ssoService.validateSession(sessionId || '');
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { modelId } = req.params;
  const { trainingData } = req.body;

  if (!trainingData || !Array.isArray(trainingData)) {
    return res.status(400).json({ error: 'Training data array required' });
  }

  const result = await coreAIService.trainModel(modelId, trainingData);

  if (!result.success) {
    return res.status(500).json({ error: result.error });
  }

  res.json({
    success: true,
    model: result.model,
    message: 'Model training completed'
  });
});

// Get AI status
router.get('/status', (req: Request, res: Response) => {
  const models = coreAIService.getModels();
  
  res.json({
    success: true,
    status: 'operational',
    modelsAvailable: models.length,
    models: models.map(m => ({
      id: m.id,
      name: m.name,
      type: m.type,
      accuracy: m.accuracy,
      version: m.version
    })),
    capabilities: [
      'Sports outcome prediction',
      'Betting pattern analysis',
      'Content generation',
      'Risk classification',
      'Continuous learning'
    ],
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

export default router;
