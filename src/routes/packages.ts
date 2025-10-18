
import express, { Request, Response } from 'express';
import { sportsPackageService } from '../services/SportsPackageService.js';
import { accountService } from '../services/AccountService.js';

const router = express.Router();

// Get all available packages
router.get('/', (req: Request, res: Response) => {
  const packages = sportsPackageService.getAllPackages();
  
  res.json({
    packages,
    count: packages.length,
    message: 'Use your account balance to purchase sports packages'
  });
});

// Get packages by league
router.get('/league/:league', (req: Request, res: Response) => {
  const { league } = req.params;
  const packages = sportsPackageService.getPackagesByLeague(league.toUpperCase());
  
  res.json({
    league,
    packages,
    count: packages.length
  });
});

// Get single package details
router.get('/:packageId', (req: Request, res: Response) => {
  const pkg = sportsPackageService.getPackage(req.params.packageId);
  
  if (!pkg) {
    return res.status(404).json({ error: 'Package not found' });
  }
  
  res.json(pkg);
});

// Purchase a package using account balance
router.post('/purchase', (req: Request, res: Response) => {
  const { userId = 'demo-user', packageId } = req.body;
  
  if (!packageId) {
    return res.status(400).json({ error: 'packageId is required' });
  }

  const pkg = sportsPackageService.getPackage(packageId);
  if (!pkg) {
    return res.status(404).json({ error: 'Package not found' });
  }

  const account = accountService.getAccount(userId) || accountService.getAccountByUsername(userId);
  if (!account) {
    return res.status(404).json({ error: 'User not found' });
  }

  const result = sportsPackageService.purchasePackage(userId, packageId);
  
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  const updatedAccount = accountService.getAccount(account.id);
  
  res.json({
    message: 'Package purchased successfully',
    package: result.package,
    packageDetails: pkg,
    remainingBalance: updatedAccount?.walletBalance || 0
  });
});

// Get user's purchased packages
router.get('/user/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  
  const userPackages = sportsPackageService.getUserPackages(userId);
  const activePackageDetails = sportsPackageService.getActivePackageDetails(userId);
  
  res.json({
    userId,
    packages: userPackages,
    activePackages: activePackageDetails,
    totalActive: activePackageDetails.length
  });
});

// Check if user has access to a specific league
router.get('/user/:userId/access/:league', (req: Request, res: Response) => {
  const { userId, league } = req.params;
  
  const hasAccess = sportsPackageService.hasActivePackage(userId, league.toUpperCase());
  const activePackages = sportsPackageService.getActivePackageDetails(userId);
  
  res.json({
    userId,
    league,
    hasAccess,
    activePackages: activePackages.filter(pkg => 
      pkg.league === league.toUpperCase() || pkg.league === 'ALL'
    )
  });
});

export default router;
