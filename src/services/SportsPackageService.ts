
import { EventEmitter } from 'events';
import { accountService } from './AccountService.js';

export interface SportsPackage {
  id: string;
  name: string;
  league: 'NFL' | 'NBA' | 'MLB' | 'NHL' | 'Boxing' | 'Soccer' | 'ALL';
  price: number;
  duration: number; // days
  features: string[];
  active: boolean;
}

export interface UserPackage {
  userId: string;
  packageId: string;
  purchasedAt: string;
  expiresAt: string;
  active: boolean;
}

class SportsPackageService extends EventEmitter {
  private packages: Map<string, SportsPackage> = new Map();
  private userPackages: Map<string, UserPackage[]> = new Map();

  constructor() {
    super();
    this.initializePackages();
  }

  private initializePackages(): void {
    // Individual league packages
    this.packages.set('pkg-nfl', {
      id: 'pkg-nfl',
      name: 'NFL Premium Package',
      league: 'NFL',
      price: 99.99,
      duration: 30,
      features: ['Live streaming', 'Money line betting', 'Radio access', 'Real-time odds'],
      active: true
    });

    this.packages.set('pkg-nba', {
      id: 'pkg-nba',
      name: 'NBA Premium Package',
      league: 'NBA',
      price: 89.99,
      duration: 30,
      features: ['Live streaming', 'Money line betting', 'Radio access', 'Real-time odds', 'NBA.com direct access'],
      active: true
    });

    this.packages.set('pkg-mlb', {
      id: 'pkg-mlb',
      name: 'MLB Premium Package',
      league: 'MLB',
      price: 79.99,
      duration: 30,
      features: ['Live streaming', 'Money line betting', 'Radio access', 'Real-time odds'],
      active: true
    });

    this.packages.set('pkg-nhl', {
      id: 'pkg-nhl',
      name: 'NHL Premium Package',
      league: 'NHL',
      price: 79.99,
      duration: 30,
      features: ['Live streaming', 'Money line betting', 'Radio access', 'Real-time odds'],
      active: true
    });

    this.packages.set('pkg-boxing', {
      id: 'pkg-boxing',
      name: 'Boxing Premium Package',
      league: 'Boxing',
      price: 49.99,
      duration: 30,
      features: ['PPV access', 'Money line betting', 'Radio access', 'Real-time odds'],
      active: true
    });

    this.packages.set('pkg-soccer', {
      id: 'pkg-soccer',
      name: 'Soccer Premium Package',
      league: 'Soccer',
      price: 89.99,
      duration: 30,
      features: ['Live streaming', 'Money line betting', 'Radio access', 'Real-time odds'],
      active: true
    });

    // All-access package with discount
    this.packages.set('pkg-all', {
      id: 'pkg-all',
      name: 'All Sports Premium Package',
      league: 'ALL',
      price: 299.99, // Discounted from $488.95
      duration: 30,
      features: [
        'All NFL games',
        'All NBA games with direct access',
        'All MLB games',
        'All NHL games',
        'Boxing PPV events',
        'All Soccer matches',
        'Priority streaming',
        'Advanced analytics',
        '24/7 support'
      ],
      active: true
    });
  }

  getAllPackages(): SportsPackage[] {
    return Array.from(this.packages.values());
  }

  getPackage(packageId: string): SportsPackage | null {
    return this.packages.get(packageId) || null;
  }

  getPackagesByLeague(league: string): SportsPackage[] {
    return Array.from(this.packages.values()).filter(
      pkg => pkg.league === league || pkg.league === 'ALL'
    );
  }

  purchasePackage(userId: string, packageId: string): { success: boolean; package?: UserPackage; error?: string } {
    const pkg = this.packages.get(packageId);
    if (!pkg) {
      return { success: false, error: 'Package not found' };
    }

    const account = accountService.getAccount(userId) || accountService.getAccountByUsername(userId);
    if (!account) {
      return { success: false, error: 'User account not found' };
    }

    if (account.walletBalance < pkg.price) {
      return { success: false, error: `Insufficient balance. Need $${pkg.price}, have $${account.walletBalance}` };
    }

    // Deduct from wallet
    const balanceUpdate = accountService.updateBalance(account.id, pkg.price, 'subtract');
    if (!balanceUpdate.success) {
      return { success: false, error: balanceUpdate.error };
    }

    // Create user package
    const now = new Date();
    const expiresAt = new Date(now.getTime() + pkg.duration * 24 * 60 * 60 * 1000);
    
    const userPackage: UserPackage = {
      userId: account.id,
      packageId: pkg.id,
      purchasedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      active: true
    };

    if (!this.userPackages.has(account.id)) {
      this.userPackages.set(account.id, []);
    }
    this.userPackages.get(account.id)!.push(userPackage);

    this.emit('packagePurchased', { userId: account.id, package: pkg, userPackage });

    return { success: true, package: userPackage };
  }

  getUserPackages(userId: string): UserPackage[] {
    const packages = this.userPackages.get(userId) || [];
    const now = new Date();

    // Update expired packages
    packages.forEach(pkg => {
      if (pkg.active && new Date(pkg.expiresAt) < now) {
        pkg.active = false;
      }
    });

    return packages;
  }

  hasActivePackage(userId: string, league?: string): boolean {
    const packages = this.getUserPackages(userId);
    const activePackages = packages.filter(pkg => pkg.active);

    if (!league) {
      return activePackages.length > 0;
    }

    return activePackages.some(userPkg => {
      const pkg = this.packages.get(userPkg.packageId);
      return pkg && (pkg.league === league || pkg.league === 'ALL');
    });
  }

  getActivePackageDetails(userId: string): Array<SportsPackage & { expiresAt: string }> {
    const userPackages = this.getUserPackages(userId).filter(pkg => pkg.active);
    
    return userPackages.map(userPkg => {
      const pkg = this.packages.get(userPkg.packageId)!;
      return {
        ...pkg,
        expiresAt: userPkg.expiresAt
      };
    });
  }
}

export const sportsPackageService = new SportsPackageService();
