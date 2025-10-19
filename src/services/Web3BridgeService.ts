
import { EventEmitter } from 'events';
import fetch from 'node-fetch';

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

interface WalletConnection {
  address: string;
  chainId: number;
  balance: string;
  connectedAt: number;
}

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: string;
  hash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
}

class Web3BridgeService extends EventEmitter {
  private static instance: Web3BridgeService;
  private wallets: Map<string, WalletConnection>;
  private transactions: Map<string, Transaction>;
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
      
      const connection: WalletConnection = {
        address: address.toLowerCase(),
        chainId: this.config.chainId,
        balance,
        connectedAt: Date.now()
      };

      this.wallets.set(address.toLowerCase(), connection);
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
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const transaction: Transaction = {
      id: txId,
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      amount,
      status: 'pending',
      timestamp: Date.now()
    };

    this.transactions.set(txId, transaction);
    this.emit('transaction:created', transaction);

    return transaction;
  }

  async sendTransaction(txId: string): Promise<Transaction> {
    const tx = this.transactions.get(txId);
    
    if (!tx) {
      throw new Error('Transaction not found');
    }

    try {
      // Simulate transaction hash (in production, this would interact with Web3 provider)
      const hash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      tx.hash = hash;
      tx.status = 'confirmed';
      
      this.transactions.set(txId, tx);
      this.emit('transaction:confirmed', tx);

      return tx;
    } catch (error) {
      tx.status = 'failed';
      this.transactions.set(txId, tx);
      this.emit('transaction:failed', tx);
      throw error;
    }
  }

  getWallet(address: string): WalletConnection | undefined {
    return this.wallets.get(address.toLowerCase());
  }

  getTransaction(txId: string): Transaction | undefined {
    return this.transactions.get(txId);
  }

  getAllWallets(): WalletConnection[] {
    return Array.from(this.wallets.values());
  }

  getAllTransactions(): Transaction[] {
    return Array.from(this.transactions.values());
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
      pendingTransactions: Array.from(this.transactions.values()).filter(tx => tx.status === 'pending').length,
      confirmedTransactions: Array.from(this.transactions.values()).filter(tx => tx.status === 'confirmed').length,
      chainId: this.config.chainId,
      chainName: this.config.chainName
    };
  }
}

export const web3BridgeService = Web3BridgeService.getInstance();
