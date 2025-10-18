
import express, { Request, Response } from 'express';
import { accountService } from '../services/AccountService.js';
import { bettingService } from '../services/BettingService.js';

const router = express.Router();

// Create new account
router.post('/register', (req: Request, res: Response) => {
  const { username, email, firstName, lastName, phoneNumber, address } = req.body;

  if (!username || !email) {
    return res.status(400).json({ error: 'Username and email are required' });
  }

  const result = accountService.createAccount({
    username,
    email,
    firstName,
    lastName,
    phoneNumber,
    address
  });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.status(201).json({
    message: 'Account created successfully',
    account: result.account
  });
});

// Get account profile
router.get('/profile/:accountId', (req: Request, res: Response) => {
  const { accountId } = req.params;
  const account = accountService.getAccount(accountId);

  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  // Don't send sensitive data
  const { ...publicProfile } = account;
  
  res.json({
    profile: publicProfile,
    stats: accountService.getAccountStats(accountId)
  });
});

// Update account profile
router.put('/profile/:accountId', (req: Request, res: Response) => {
  const { accountId } = req.params;
  const updates = req.body;

  // Prevent updating certain fields
  delete updates.id;
  delete updates.walletBalance;
  delete updates.kycStatus;

  const result = accountService.updateAccount(accountId, updates);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    message: 'Profile updated successfully',
    account: result.account
  });
});

// Get account balance
router.get('/balance/:accountId', (req: Request, res: Response) => {
  const { accountId } = req.params;
  const account = accountService.getAccount(accountId);

  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  res.json({
    accountId,
    balance: account.walletBalance,
    currency: 'USD'
  });
});

// Deposit funds
router.post('/deposit/:accountId', (req: Request, res: Response) => {
  const { accountId } = req.params;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid deposit amount' });
  }

  const result = accountService.updateBalance(accountId, amount, 'add');

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    message: 'Deposit successful',
    newBalance: result.newBalance,
    amount
  });
});

// Withdraw funds
router.post('/withdraw/:accountId', (req: Request, res: Response) => {
  const { accountId } = req.params;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid withdrawal amount' });
  }

  const result = accountService.updateBalance(accountId, amount, 'subtract');

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    message: 'Withdrawal successful',
    newBalance: result.newBalance,
    amount
  });
});

// Get account statistics
router.get('/stats/:accountId', (req: Request, res: Response) => {
  const { accountId } = req.params;
  const stats = accountService.getAccountStats(accountId);

  if (!stats) {
    return res.status(404).json({ error: 'Account not found' });
  }

  res.json({
    accountId,
    stats
  });
});

// Get betting history
router.get('/bets/:accountId', (req: Request, res: Response) => {
  const { accountId } = req.params;
  const account = accountService.getAccount(accountId);

  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  const bets = bettingService.getUserBets(accountId);

  res.json({
    accountId,
    bets,
    count: bets.length
  });
});

// Update preferences
router.put('/preferences/:accountId', (req: Request, res: Response) => {
  const { accountId } = req.params;
  const { preferences } = req.body;

  const result = accountService.updateAccount(accountId, { preferences });

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    message: 'Preferences updated successfully',
    preferences: result.account?.preferences
  });
});

// Deactivate account
router.post('/deactivate/:accountId', (req: Request, res: Response) => {
  const { accountId } = req.params;
  const result = accountService.deactivateAccount(accountId);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    message: 'Account deactivated successfully'
  });
});

// Reactivate account
router.post('/reactivate/:accountId', (req: Request, res: Response) => {
  const { accountId } = req.params;
  const result = accountService.reactivateAccount(accountId);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    message: 'Account reactivated successfully'
  });
});

// Admin: Get all accounts
router.get('/admin/accounts', (req: Request, res: Response) => {
  const accounts = accountService.getAllAccounts();

  res.json({
    accounts,
    count: accounts.length,
    activeCount: accountService.getActiveAccountsCount()
  });
});

// Admin: Update KYC status
router.put('/admin/kyc/:accountId', (req: Request, res: Response) => {
  const { accountId } = req.params;
  const { status } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid KYC status' });
  }

  const result = accountService.updateKYCStatus(accountId, status);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    message: 'KYC status updated successfully',
    accountId,
    status
  });
});

export default router;
