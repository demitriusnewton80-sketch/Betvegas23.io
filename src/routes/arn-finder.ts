
import express, { Request, Response } from 'express';
import { arnFinderService } from '../services/ARNFinderService.js';
import path from 'path';

const router = express.Router();

// Parse ARN
router.post('/parse', (req: Request, res: Response) => {
  try {
    const { arn } = req.body;

    if (!arn) {
      return res.status(400).json({
        success: false,
        error: 'ARN string is required'
      });
    }

    const parsed = arnFinderService.parseARN(arn);

    if (!parsed) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ARN format'
      });
    }

    res.json({
      success: true,
      arn: parsed
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse ARN'
    });
  }
});

// Validate ARN
router.post('/validate', (req: Request, res: Response) => {
  try {
    const { arn } = req.body;

    if (!arn) {
      return res.status(400).json({
        success: false,
        error: 'ARN string is required'
      });
    }

    const isValid = arnFinderService.validateARN(arn);

    res.json({
      success: true,
      arn,
      isValid
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate ARN'
    });
  }
});

// Find ARNs in text
router.post('/find-in-text', (req: Request, res: Response) => {
  try {
    const { text, source } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text content is required'
      });
    }

    const arns = arnFinderService.findARNsInText(text, source || 'request');

    res.json({
      success: true,
      totalFound: arns.length,
      arns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to find ARNs'
    });
  }
});

// Search project for ARNs
router.get('/search-project', async (req: Request, res: Response) => {
  try {
    const projectRoot = path.join(process.cwd());
    const results = await arnFinderService.findARNsInDirectory(projectRoot, true);

    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search project'
    });
  }
});

// Get cached ARNs
router.get('/cached', (req: Request, res: Response) => {
  try {
    const arns = arnFinderService.getCachedARNs();

    res.json({
      success: true,
      totalARNs: arns.length,
      arns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get cached ARNs'
    });
  }
});

// Get statistics
router.get('/statistics', (req: Request, res: Response) => {
  try {
    const stats = arnFinderService.getStatistics();

    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get statistics'
    });
  }
});

// Group by service
router.get('/group-by-service', (req: Request, res: Response) => {
  try {
    const arns = arnFinderService.getCachedARNs();
    const grouped = arnFinderService.groupByService(arns);

    res.json({
      success: true,
      services: Object.keys(grouped),
      grouped
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to group ARNs'
    });
  }
});

// Build ARN
router.post('/build', (req: Request, res: Response) => {
  try {
    const { service, region, accountId, resourceType, resourceId } = req.body;

    if (!service || !accountId || !resourceType) {
      return res.status(400).json({
        success: false,
        error: 'Service, accountId, and resourceType are required'
      });
    }

    const arn = arnFinderService.buildARN(
      service,
      region || '',
      accountId,
      resourceType,
      resourceId || ''
    );

    const isValid = arnFinderService.validateARN(arn);

    res.json({
      success: true,
      arn,
      isValid
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to build ARN'
    });
  }
});

// Clear cache
router.delete('/cache', (req: Request, res: Response) => {
  try {
    arnFinderService.clearCache();

    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear cache'
    });
  }
});

export default router;
