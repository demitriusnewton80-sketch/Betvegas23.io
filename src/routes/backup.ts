
import express, { Request, Response } from 'express';
import { awsBackupService } from '../services/AWSBackupService.js';
import { ssoService } from '../services/SSOService.js';
import { ecommerceService } from '../services/ECommerceService.js';

const router = express.Router();

// Middleware for SSO authentication
const requireAuth = (req: Request, res: Response, next: Function) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');

  if (!sessionId) {
    return res.status(401).json({ error: 'SSO authentication required' });
  }

  const user = ssoService.validateSession(sessionId);
  if (!user) {
    return res.status(401).json({ error: 'Invalid SSO session' });
  }

  (req as any).user = user;
  next();
};

// Initialize backup system with AWS and SAP
router.post('/initialize', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { awsAccountId, region, sapEndpoint } = req.body;

  if (!awsAccountId || !region) {
    return res.status(400).json({ error: 'awsAccountId and region required' });
  }

  const result = awsBackupService.initializeBackup(userId, awsAccountId, region, sapEndpoint);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    message: 'Backup system initialized',
    config: result.config,
    fccEntity: '20130314143016',
    githubIntegration: 'https://github.com/betvages23/betvages23.in',
    intel: 'Core Intel backup system active'
  });
});

// Get SSO dropdown options with FCC entity
router.get('/sso-options', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const awsConnection = ecommerceService.getAWSConnection(userId);
  const backupConfig = awsBackupService.getBackupConfig(userId);

  res.json({
    ssoProvider: 'FCC-SSO',
    fccEntity: '20130314143016',
    user: (req as any).user,
    awsConnected: !!awsConnection,
    backupConfigured: !!backupConfig,
    options: [
      {
        id: 'aws-backup',
        label: 'AWS Backup System',
        enabled: !!awsConnection,
        link: '/backup/initialize'
      },
      {
        id: 'sap-marketplace',
        label: 'SAP Business Network',
        enabled: !!backupConfig?.sapConnection,
        link: '/backup/sap-status'
      },
      {
        id: 'github-streaming',
        label: 'GitHub Streaming Foundation',
        enabled: true,
        link: 'https://github.com/betvages23/betvages23.in',
        streamingFoundation: 'active',
        pullEnabled: true,
        autoSync: true
      },
      {
        id: 'intel-core',
        label: 'Core Intel Backup',
        enabled: !!backupConfig,
        link: '/backup/status'
      }
    ]
  });
});

// Create backup job
router.post('/create', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  
  const result = awsBackupService.createBackupJob(userId);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    message: 'Backup job created',
    job: result.job,
    fccCompliant: true,
    entity: '20130314143016'
  });
});

// Get backup status
router.get('/status', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const backups = awsBackupService.getUserBackups(userId);
  const config = awsBackupService.getBackupConfig(userId);

  res.json({
    userId,
    backupCount: backups.length,
    backups,
    configuration: config,
    fccEntity: '20130314143016',
    githubRepo: 'https://github.com/betvages23/betvages23.in'
  });
});

// Get specific backup job
router.get('/jobs/:jobId', requireAuth, (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = awsBackupService.getBackupJob(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Backup job not found' });
  }

  const userId = (req as any).user.id;
  if (job.userId !== userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(job);
});

// Get SAP marketplace connection status
router.get('/sap-status', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const config = awsBackupService.getBackupConfig(userId);

  if (!config) {
    return res.status(404).json({ error: 'Backup not configured' });
  }

  const sapARN = awsBackupService.generateSAPMarketplaceARN(userId);

  res.json({
    sapConnected: !!config.sapConnection,
    sapConnection: config.sapConnection,
    marketplaceARN: sapARN,
    awsMarketplace: `https://aws.amazon.com/marketplace/pp/${sapARN}`,
    fccEntity: '20130314143016'
  });
});

// GitHub streaming foundation status
router.get('/github-streaming', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const config = awsBackupService.getBackupConfig(userId);

  res.json({
    githubRepo: 'https://github.com/betvages23/betvages23.in',
    streamingFoundation: 'active',
    fccEntity: '20130314143016',
    backupIntegrated: !!config,
    codeBase: 'Streaming core built into foundation',
    intelBackup: 'Core Intel backup system operational'
  });
});

export default router;
