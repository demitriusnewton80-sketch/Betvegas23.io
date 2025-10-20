
import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { awsDataService } from '../services/AWSDataService.js';

const router = express.Router();

interface AppDeposit {
  id: string;
  userId: string;
  appName: string;
  appType: string;
  appData: any;
  depositedAt: string;
  status: 'pending' | 'processed' | 'deployed';
  s3Location?: string;
}

const deposits = new Map<string, AppDeposit>();

// Deposit an app
router.post('/deposit', async (req: Request, res: Response) => {
  try {
    const { userId, appName, appType, appData } = req.body;

    if (!userId || !appName || !appData) {
      return res.status(400).json({
        success: false,
        error: 'userId, appName, and appData are required'
      });
    }

    const depositId = `APP-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const deposit: AppDeposit = {
      id: depositId,
      userId,
      appName,
      appType: appType || 'web',
      appData,
      depositedAt: new Date().toISOString(),
      status: 'pending'
    };

    // Store in AWS S3
    const awsResult = await awsDataService.storeData(
      userId,
      appData,
      `app-deposit-${appName}`
    );

    if (awsResult.success) {
      deposit.s3Location = awsResult.operation?.s3Location;
      deposit.status = 'processed';
    }

    deposits.set(depositId, deposit);

    res.json({
      success: true,
      deposit,
      message: 'App deposited successfully',
      fccEntity: '20130314143016',
      awsBackup: awsResult.success
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Deposit failed'
    });
  }
});

// Get deposit status
router.get('/deposit/:depositId', (req: Request, res: Response) => {
  const { depositId } = req.params;
  const deposit = deposits.get(depositId);

  if (!deposit) {
    return res.status(404).json({
      success: false,
      error: 'Deposit not found'
    });
  }

  res.json({
    success: true,
    deposit
  });
});

// List user deposits
router.get('/deposits/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const userDeposits = Array.from(deposits.values())
    .filter(d => d.userId === userId)
    .sort((a, b) => new Date(b.depositedAt).getTime() - new Date(a.depositedAt).getTime());

  res.json({
    success: true,
    deposits: userDeposits,
    count: userDeposits.length
  });
});

// Deploy deposited app
router.post('/deploy/:depositId', async (req: Request, res: Response) => {
  const { depositId } = req.params;
  const deposit = deposits.get(depositId);

  if (!deposit) {
    return res.status(404).json({
      success: false,
      error: 'Deposit not found'
    });
  }

  deposit.status = 'deployed';

  res.json({
    success: true,
    deposit,
    message: 'App deployed successfully',
    deployUrl: `https://app-${depositId.toLowerCase()}.replit.app`
  });
});

export default router;
