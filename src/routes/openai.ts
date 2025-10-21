
import express, { Request, Response } from 'express';
import { openAIService } from '../services/OpenAIService.js';
import { ssoService } from '../services/SSOService.js';

const router = express.Router();

// Check OpenAI status
router.get('/status', (req: Request, res: Response) => {
  const stats = openAIService.getStats();
  
  res.json({
    success: true,
    configured: stats.hasApiKey,
    stats,
    fccEntity: '20130314143016'
  });
});

// General chat completion
router.post('/chat', async (req: Request, res: Response) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');
  const user = ssoService.validateSession(sessionId || '');
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { prompt, model, maxTokens, temperature, systemPrompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt required' });
  }

  const result = await openAIService.getChatCompletion(prompt, {
    model,
    maxTokens,
    temperature,
    systemPrompt
  });

  if (!result.success) {
    return res.status(500).json({ error: result.error });
  }

  res.json({
    success: true,
    content: result.content,
    usage: result.usage,
    fccEntity: '20130314143016'
  });
});

// Sports prediction analysis
router.post('/analyze/sports', async (req: Request, res: Response) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');
  const user = ssoService.validateSession(sessionId || '');
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { matchup } = req.body;

  if (!matchup) {
    return res.status(400).json({ error: 'Matchup information required' });
  }

  const result = await openAIService.analyzeSportsPrediction(matchup);

  if (!result.success) {
    return res.status(500).json({ error: result.error });
  }

  res.json({
    success: true,
    analysis: result.analysis,
    fccEntity: '20130314143016'
  });
});

// Betting pattern analysis
router.post('/analyze/betting', async (req: Request, res: Response) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');
  const user = ssoService.validateSession(sessionId || '');
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { userHistory } = req.body;

  if (!userHistory) {
    return res.status(400).json({ error: 'User history required' });
  }

  const result = await openAIService.analyzeBettingPattern(userHistory);

  if (!result.success) {
    return res.status(500).json({ error: result.error });
  }

  res.json({
    success: true,
    analysis: result.analysis,
    fccEntity: '20130314143016'
  });
});

// Generate betting content
router.post('/generate/content', async (req: Request, res: Response) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');
  const user = ssoService.validateSession(sessionId || '');
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topic required' });
  }

  const result = await openAIService.generateBettingContent(topic);

  if (!result.success) {
    return res.status(500).json({ error: result.error });
  }

  res.json({
    success: true,
    content: result.content,
    fccEntity: '20130314143016'
  });
});

export default router;
