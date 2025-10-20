
import { EventEmitter } from 'events';
import fetch from 'node-fetch';
import { WalletModel, WalletData } from '../models/Wallet.js';
import { Web3TransactionModel, Web3Transaction } from '../models/Web3Transaction.js';

interface Web3Config {
  rpcEndpoint: string;
  chainId: number;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

interface WalletConnection extends WalletData {}
interface Transaction extends Web3Transaction {}

class Web3BridgeService extends EventEmitter {
  private static instance: Web3BridgeService;
  private wallets: Map<string, WalletModel>;
  private transactions: Map<string, Web3TransactionModel>;
  private config: Web3Config;

  private constructor() {
    super();
    this.wallets = new Map();
    this.transactions = new Map();
    
    // Using QuickNode Polygon endpoint from existing service
    this.config = {
      rpcEndpoint: 'https://billowing-billowing-glitter.matic.quiknode.pro/f224c443c8bf109ec06dd0bc8bf741740ac83f42',
      chainId: 137,
      chainName: 'Polygon',
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
      }
    };

    console.log('🌉 Web3 Bridge initialized on', this.config.chainName);
  }

  static getInstance(): Web3BridgeService {
    if (!Web3BridgeService.instance) {
      Web3BridgeService.instance = new Web3BridgeService();
    }
    return Web3BridgeService.instance;
  }

  async connectWallet(address: string): Promise<WalletConnection> {
    try {
      const balance = await this.getBalance(address);
      
      const walletModel = new WalletModel(address, this.config.chainId, balance);
      this.wallets.set(address.toLowerCase(), walletModel);
      
      const connection = walletModel.toJSON();
      this.emit('wallet:connected', connection);

      return connection;
    } catch (error) {
      throw new Error(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      const response = await fetch(this.config.rpcEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1
        })
      });

      const data: any = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      // Convert hex balance to decimal (wei)
      const balanceWei = parseInt(data.result, 16);
      // Convert to MATIC (divide by 10^18)
      const balanceMatic = (balanceWei / 1e18).toFixed(4);
      
      return balanceMatic;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0';
    }
  }

  async createTransaction(from: string, to: string, amount: string): Promise<Transaction> {
    const walletModel = this.wallets.get(from.toLowerCase());
    
    const txModel = new Web3TransactionModel({
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      amount,
      currency: this.config.nativeCurrency.symbol,
      nonce: walletModel?.getNonce()
    });

    if (walletModel) {
      walletModel.incrementNonce();
    }

    this.transactions.set(txModel.getId(), txModel);
    this.emit('transaction:created', txModel.toJSON());

    return txModel.toJSON();
  }

  async sendTransaction(txId: string): Promise<Transaction> {
    const txModel = this.transactions.get(txId);
    
    if (!txModel) {
      throw new Error('Transaction not found');
    }

    try {
      // Simulate transaction hash (in production, this would interact with Web3 provider)
      const hash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      txModel.setHash(hash);
      txModel.setStatus('confirmed');
      
      // Add confirmations
      for (let i = 0; i < 12; i++) {
        txModel.addConfirmation();
      }
      
      this.emit('transaction:confirmed', txModel.toJSON());

      return txModel.toJSON();
    } catch (error) {
      txModel.setStatus('failed');
      this.emit('transaction:failed', txModel.toJSON());
      throw error;
    }
  }

  getWallet(address: string): WalletConnection | undefined {
    const walletModel = this.wallets.get(address.toLowerCase());
    return walletModel?.toJSON();
  }

  getTransaction(txId: string): Transaction | undefined {
    const txModel = this.transactions.get(txId);
    return txModel?.toJSON();
  }

  getAllWallets(): WalletConnection[] {
    return Array.from(this.wallets.values()).map(w => w.toJSON());
  }

  getAllTransactions(): Transaction[] {
    return Array.from(this.transactions.values()).map(tx => tx.toJSON());
  }

  disconnectWallet(address: string): boolean {
    const deleted = this.wallets.delete(address.toLowerCase());
    if (deleted) {
      this.emit('wallet:disconnected', { address });
    }
    return deleted;
  }

  getChainConfig(): Web3Config {
    return this.config;
  }

  async verifyTransaction(hash: string): Promise<boolean> {
    try {
      const response = await fetch(this.config.rpcEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionReceipt',
          params: [hash],
          id: 1
        })
      });

      const data: any = await response.json();
      
      return data.result && data.result.status === '0x1';
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return false;
    }
  }

  getStats() {
    return {
      totalWallets: this.wallets.size,
      totalTransactions: this.transactions.size,
      pendingTransactions: Array.from(this.transactions.values()).filter(tx => tx.getStatus() === 'pending').length,
      confirmedTransactions: Array.from(this.transactions.values()).filter(tx => tx.getStatus() === 'confirmed').length,
      chainId: this.config.chainId,
      chainName: this.config.chainName,
      coinStatsPortfolio: 'https://coinstats.app/p/TGct2H',
      portfolioIntegration: true
    };
  }

  getCoinStatsPortfolio(): string {
    return 'https://coinstats.app/p/TGct2H';
  }
}

export const web3BridgeService = Web3BridgeService.getInstance();
