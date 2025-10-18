
import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface Account {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  walletBalance: number;
  kycStatus: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  preferences?: {
    notifications: boolean;
    emailAlerts: boolean;
    twoFactorEnabled: boolean;
  };
}

export interface AccountStats {
  totalBets: number;
  totalWagered: number;
  totalWon: number;
  winRate: number;
  currentStreak: number;
}

class AccountService extends EventEmitter {
  private accounts: Map<string, Account> = new Map();
  private accountStats: Map<string, AccountStats> = new Map();

  constructor() {
    super();
    
    // Initialize demo account
    this.createAccount({
      username: 'demo-user',
      email: 'demo@youngmeat.com',
      firstName: 'Demo',
      lastName: 'User',
      phoneNumber: '(445) 942-9173',
      address: {
        street: '2200 Benjamin Franklin Parkway',
        city: 'Philadelphia',
        state: 'PA',
        zipCode: '19130',
        country: 'United States'
      }
    });
  }

  // Create new account
  createAccount(data: {
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    address?: Account['address'];
  }): { success: boolean; account?: Account; error?: string } {
    // Check if username or email already exists
    const existingAccount = Array.from(this.accounts.values()).find(
      acc => acc.username === data.username || acc.email === data.email
    );

    if (existingAccount) {
      return { success: false, error: 'Username or email already exists' };
    }

    const accountId = crypto.randomUUID();
    const account: Account = {
      id: accountId,
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      address: data.address,
      walletBalance: 0,
      kycStatus: 'pending',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preferences: {
        notifications: true,
        emailAlerts: true,
        twoFactorEnabled: false
      }
    };

    this.accounts.set(accountId, account);
    this.accountStats.set(accountId, {
      totalBets: 0,
      totalWagered: 0,
      totalWon: 0,
      winRate: 0,
      currentStreak: 0
    });

    this.emit('accountCreated', account);
    return { success: true, account };
  }

  // Get account by ID
  getAccount(accountId: string): Account | null {
    return this.accounts.get(accountId) || null;
  }

  // Get account by username
  getAccountByUsername(username: string): Account | null {
    return Array.from(this.accounts.values()).find(
      acc => acc.username === username
    ) || null;
  }

  // Get account by email
  getAccountByEmail(email: string): Account | null {
    return Array.from(this.accounts.values()).find(
      acc => acc.email === email
    ) || null;
  }

  // Update account information
  updateAccount(
    accountId: string,
    updates: Partial<Account>
  ): { success: boolean; account?: Account; error?: string } {
    const account = this.accounts.get(accountId);

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    const updatedAccount = {
      ...account,
      ...updates,
      id: account.id, // Prevent ID change
      updatedAt: new Date().toISOString()
    };

    this.accounts.set(accountId, updatedAccount);
    this.emit('accountUpdated', updatedAccount);

    return { success: true, account: updatedAccount };
  }

  // Update wallet balance
  updateBalance(
    accountId: string,
    amount: number,
    operation: 'add' | 'subtract'
  ): { success: boolean; newBalance?: number; error?: string } {
    const account = this.accounts.get(accountId);

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    const newBalance = operation === 'add' 
      ? account.walletBalance + amount 
      : account.walletBalance - amount;

    if (newBalance < 0) {
      return { success: false, error: 'Insufficient balance' };
    }

    account.walletBalance = newBalance;
    account.updatedAt = new Date().toISOString();
    this.accounts.set(accountId, account);

    return { success: true, newBalance };
  }

  // Get account statistics
  getAccountStats(accountId: string): AccountStats | null {
    return this.accountStats.get(accountId) || null;
  }

  // Update account statistics
  updateStats(accountId: string, updates: Partial<AccountStats>): void {
    const stats = this.accountStats.get(accountId);
    if (stats) {
      const updatedStats = { ...stats, ...updates };
      if (updatedStats.totalBets > 0) {
        updatedStats.winRate = (updatedStats.totalWon / updatedStats.totalBets) * 100;
      }
      this.accountStats.set(accountId, updatedStats);
    }
  }

  // Update last login time
  recordLogin(accountId: string): void {
    const account = this.accounts.get(accountId);
    if (account) {
      account.lastLoginAt = new Date().toISOString();
      this.accounts.set(accountId, account);
    }
  }

  // Deactivate account
  deactivateAccount(accountId: string): { success: boolean; error?: string } {
    const account = this.accounts.get(accountId);

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    account.isActive = false;
    account.updatedAt = new Date().toISOString();
    this.accounts.set(accountId, account);
    this.emit('accountDeactivated', account);

    return { success: true };
  }

  // Reactivate account
  reactivateAccount(accountId: string): { success: boolean; error?: string } {
    const account = this.accounts.get(accountId);

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    account.isActive = true;
    account.updatedAt = new Date().toISOString();
    this.accounts.set(accountId, account);
    this.emit('accountReactivated', account);

    return { success: true };
  }

  // Update KYC status
  updateKYCStatus(
    accountId: string,
    status: 'pending' | 'approved' | 'rejected'
  ): { success: boolean; error?: string } {
    const account = this.accounts.get(accountId);

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    account.kycStatus = status;
    account.updatedAt = new Date().toISOString();
    this.accounts.set(accountId, account);
    this.emit('kycStatusUpdated', { accountId, status });

    return { success: true };
  }

  // Get all accounts (admin)
  getAllAccounts(): Account[] {
    return Array.from(this.accounts.values());
  }

  // Get active accounts count
  getActiveAccountsCount(): number {
    return Array.from(this.accounts.values()).filter(acc => acc.isActive).length;
  }
}

export const accountService = new AccountService();
