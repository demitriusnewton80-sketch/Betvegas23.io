
import express, { Request, Response } from 'express';
import { waveStreamAssemblyService } from '../services/WaveStreamAssemblyService.js';

const router = express.Router();

// Get wave assembly status
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = waveStreamAssemblyService.getWaveStatus();

    res.json({
      success: true,
      ...status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed'
    });
  }
});

// Assemble active streams
router.get('/assemble', (req: Request, res: Response) => {
  try {
    const assembly = waveStreamAssemblyService.assembleActiveStreams();

    res.json({
      success: true,
      ...assembly,
      message: 'Active streams assembled successfully',
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Assembly failed'
    });
  }
});

// Create new wave origin
router.post('/wave/create', (req: Request, res: Response) => {
  try {
    const { origin, frequency, amplitude, mode } = req.body;

    if (!origin || !frequency || !amplitude || !mode) {
      return res.status(400).json({
        success: false,
        error: 'origin, frequency, amplitude, and mode are required'
      });
    }

    const waveId = waveStreamAssemblyService.createStreamWave(origin, frequency, amplitude, mode);

    res.json({
      success: true,
      waveId,
      message: 'Stream wave created successfully',
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Wave creation failed'
    });
  }
});

// Add live content to wave
router.post('/content/add', (req: Request, res: Response) => {
  try {
    const { type, source, waveId, metadata } = req.body;

    if (!type || !source || !waveId) {
      return res.status(400).json({
        success: false,
        error: 'type, source, and waveId are required'
      });
    }

    const contentId = waveStreamAssemblyService.addLiveContent(type, source, waveId, metadata);

    res.json({
      success: true,
      contentId,
      message: 'Live content added to wave successfully',
      fccEntity: '20130314143016'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Content addition failed'
    });
  }
});

export default router;
