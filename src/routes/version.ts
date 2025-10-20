import express, { Request, Response } from 'express';
import { APP_VERSION } from '../config/version.js';

const router = express.Router();

// Get current version info
router.get('/', (req: Request, res: Response) => {
  res.json({
    version: APP_VERSION.version,
    buildDate: APP_VERSION.buildDate,
    features: APP_VERSION.features,
    changelog: APP_VERSION.changelog
  });
});

// Get latest changelog
router.get('/changelog', (req: Request, res: Response) => {
  const changelog = APP_VERSION.changelog as Record<string, { date: string; changes: string[] }>;
  const currentVersion = APP_VERSION.version as keyof typeof APP_VERSION.changelog;
  const latestChangelog = changelog[currentVersion] || {
    date: new Date().toISOString(),
    changes: ['Current version']
  };

  res.json({
    version: currentVersion,
    latest: latestChangelog
  });
});

export default router;