
import express, { Request, Response } from 'express';
import { transformerBridgeService } from '../services/TransformerBridgeService.js';

const router = express.Router();

// Get transformer bridge status
router.get('/status', (req: Request, res: Response) => {
  const stats = transformerBridgeService.getStats();

  res.json({
    success: true,
    bridge: 'transformer',
    fccEntity: '20130314143016',
    stats,
    timestamp: new Date().toISOString()
  });
});

// Activate transformer bridge
router.post('/activate', async (req: Request, res: Response) => {
  try {
    const result = await transformerBridgeService.activateBridge();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to activate bridge'
    });
  }
});

// Deactivate transformer bridge
router.post('/deactivate', async (req: Request, res: Response) => {
  try {
    const result = await transformerBridgeService.deactivateBridge();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate bridge'
    });
  }
});

// Transform and deliver data to Web3
router.post('/transform', async (req: Request, res: Response) => {
  try {
    const { sourceType, data } = req.body;

    if (!sourceType || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing sourceType or data'
      });
    }

    const transformed = await transformerBridgeService.transformAndDeliver(sourceType, data);

    res.json({
      success: true,
      message: 'Data transformed and delivered to Web3',
      transformed
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Transformation failed'
    });
  }
});

// Batch transform
router.post('/transform/batch', async (req: Request, res: Response) => {
  try {
    const { sourceType, dataArray } = req.body;

    if (!sourceType || !Array.isArray(dataArray)) {
      return res.status(400).json({
        success: false,
        error: 'Missing sourceType or dataArray must be an array'
      });
    }

    const results = await transformerBridgeService.batchTransform(sourceType, dataArray);

    res.json({
      success: true,
      message: 'Batch transformation complete',
      totalProcessed: dataArray.length,
      successfulDeliveries: results.filter(r => r.status === 'delivered').length,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Batch transformation failed'
    });
  }
});

// Get transformation rules
router.get('/rules', (req: Request, res: Response) => {
  const rules = transformerBridgeService.getTransformationRules();

  res.json({
    success: true,
    rules,
    count: rules.length
  });
});

// Get transformed data history
router.get('/data', (req: Request, res: Response) => {
  const data = transformerBridgeService.getTransformedData();

  res.json({
    success: true,
    data,
    count: data.length
  });
});

// Get specific transformed data
router.get('/data/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const allData = transformerBridgeService.getTransformedData();
  const data = allData.find(d => d.id === id);

  if (!data) {
    return res.status(404).json({
      success: false,
      error: 'Transformed data not found'
    });
  }

  res.json({
    success: true,
    data
  });
});

export default router;
