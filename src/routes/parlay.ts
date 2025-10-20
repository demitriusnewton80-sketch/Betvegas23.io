
import express, { Request, Response } from 'express';
import { parlayBuilderService } from '../services/ParlayBuilderService.js';

const router = express.Router();

// Build new parlay
router.post('/build', (req: Request, res: Response) => {
  const { userId = 'demo-user', legs, stake } = req.body;

  if (!legs || !Array.isArray(legs) || legs.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Parlay requires at least 2 legs'
    });
  }

  if (!stake || stake <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid stake amount'
    });
  }

  try {
    const parlay = parlayBuilderService.buildParlay(userId, legs, stake);
    const winProbability = parlayBuilderService.calculateWinProbability(parlay);

    res.json({
      success: true,
      parlay,
      winProbability: winProbability.toFixed(2) + '%',
      message: 'Parlay created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to build parlay'
    });
  }
});

// Get AI suggestions
router.get('/suggestions/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const maxLegs = req.query.maxLegs ? parseInt(req.query.maxLegs as string) : 4;

  try {
    const suggestions = parlayBuilderService.getAISuggestions(userId, maxLegs);

    res.json({
      success: true,
      suggestions,
      count: suggestions.length,
      message: 'AI-powered parlay suggestions based on current games'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions'
    });
  }
});

// Get user's parlays
router.get('/user/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const parlays = parlayBuilderService.getUserParlays(userId);

    res.json({
      success: true,
      parlays,
      count: parlays.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get parlays'
    });
  }
});

// Get specific parlay
router.get('/:parlayId', (req: Request, res: Response) => {
  const { parlayId } = req.params;

  const parlay = parlayBuilderService.getParlay(parlayId);

  if (!parlay) {
    return res.status(404).json({
      success: false,
      error: 'Parlay not found'
    });
  }

  const winProbability = parlayBuilderService.calculateWinProbability(parlay);

  res.json({
    success: true,
    parlay,
    winProbability: winProbability.toFixed(2) + '%'
  });
});

// Cash out parlay
router.post('/:parlayId/cashout', (req: Request, res: Response) => {
  const { parlayId } = req.params;

  const result = parlayBuilderService.cashOutParlay(parlayId);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({
    success: true,
    cashOutAmount: result.amount,
    message: 'Parlay cashed out successfully'
  });
});

export default router;
