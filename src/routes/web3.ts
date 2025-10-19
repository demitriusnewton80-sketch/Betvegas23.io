
import express, { Request, Response } from 'express';
import { web3BridgeService } from '../services/Web3BridgeService.js';

const router = express.Router();

// Get Web3 bridge status
router.get('/status', (req: Request, res: Response) => {
  const stats = web3BridgeService.getStats();
  const config = web3BridgeService.getChainConfig();

  res.json({
    success: true,
    bridge: 'active',
    chain: {
      id: config.chainId,
      name: config.chainName,
      currency: config.nativeCurrency.symbol,
      rpc: 'connected'
    },
    stats,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Connect wallet
router.post('/wallet/connect', async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address required'
      });
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }

    const connection = await web3BridgeService.connectWallet(address);

    res.json({
      success: true,
      message: 'Wallet connected successfully',
      wallet: connection
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect wallet'
    });
  }
});

// Get wallet balance
router.get('/wallet/:address/balance', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    const balance = await web3BridgeService.getBalance(address);
    const wallet = web3BridgeService.getWallet(address);

    res.json({
      success: true,
      address,
      balance,
      currency: 'MATIC',
      connected: !!wallet,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch balance'
    });
  }
});

// Get wallet info
router.get('/wallet/:address', (req: Request, res: Response) => {
  const { address } = req.params;
  const wallet = web3BridgeService.getWallet(address);

  if (!wallet) {
    return res.status(404).json({
      success: false,
      error: 'Wallet not connected'
    });
  }

  res.json({
    success: true,
    wallet
  });
});

// Disconnect wallet
router.post('/wallet/:address/disconnect', (req: Request, res: Response) => {
  const { address } = req.params;
  const disconnected = web3BridgeService.disconnectWallet(address);

  res.json({
    success: disconnected,
    message: disconnected ? 'Wallet disconnected' : 'Wallet not found'
  });
});

// Get all connected wallets
router.get('/wallets', (req: Request, res: Response) => {
  const wallets = web3BridgeService.getAllWallets();

  res.json({
    success: true,
    wallets,
    count: wallets.length
  });
});

// Create transaction
router.post('/transaction/create', async (req: Request, res: Response) => {
  try {
    const { from, to, amount } = req.body;

    if (!from || !to || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: from, to, amount'
      });
    }

    const transaction = await web3BridgeService.createTransaction(from, to, amount);

    res.json({
      success: true,
      message: 'Transaction created',
      transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create transaction'
    });
  }
});

// Send transaction
router.post('/transaction/:txId/send', async (req: Request, res: Response) => {
  try {
    const { txId } = req.params;
    const transaction = await web3BridgeService.sendTransaction(txId);

    res.json({
      success: true,
      message: 'Transaction sent',
      transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send transaction'
    });
  }
});

// Get transaction
router.get('/transaction/:txId', (req: Request, res: Response) => {
  const { txId } = req.params;
  const transaction = web3BridgeService.getTransaction(txId);

  if (!transaction) {
    return res.status(404).json({
      success: false,
      error: 'Transaction not found'
    });
  }

  res.json({
    success: true,
    transaction
  });
});

// Get all transactions
router.get('/transactions', (req: Request, res: Response) => {
  const transactions = web3BridgeService.getAllTransactions();

  res.json({
    success: true,
    transactions,
    count: transactions.length
  });
});

// Verify transaction
router.get('/transaction/:hash/verify', async (req: Request, res: Response) => {
  try {
    const { hash } = req.params;
    const verified = await web3BridgeService.verifyTransaction(hash);

    res.json({
      success: true,
      hash,
      verified,
      status: verified ? 'confirmed' : 'not_found'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to verify transaction'
    });
  }
});

// Get chain configuration
router.get('/chain/config', (req: Request, res: Response) => {
  const config = web3BridgeService.getChainConfig();

  res.json({
    success: true,
    config,
    fccCompliant: true,
    fccEntity: '20130314143016'
  });
});

export default router;
