
// Web3 Bridge Client - Young Meeat LLC
// FCC Entity: 20130314143016

const API_BASE = window.location.origin;

class Web3BridgeClient {
  constructor() {
    this.apiBase = API_BASE;
    this.connectedWallet = null;
  }

  async connectWallet(address, chainId = 1) {
    try {
      const response = await fetch(`${this.apiBase}/web3/wallet/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, chainId })
      });
      
      const data = await response.json();
      if (data.success) {
        this.connectedWallet = data.wallet;
        return data;
      }
      throw new Error(data.error || 'Failed to connect wallet');
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  }

  async getWalletBalance(address) {
    try {
      const response = await fetch(`${this.apiBase}/web3/wallet/${address}/balance`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Balance fetch error:', error);
      throw error;
    }
  }

  async createTransaction(txData) {
    try {
      const response = await fetch(`${this.apiBase}/web3/transaction/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txData)
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Transaction creation error:', error);
      throw error;
    }
  }

  async sendTransaction(txId) {
    try {
      const response = await fetch(`${this.apiBase}/web3/transaction/${txId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Transaction send error:', error);
      throw error;
    }
  }

  async verifyTransaction(hash) {
    try {
      const response = await fetch(`${this.apiBase}/web3/transaction/${hash}/verify`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Transaction verification error:', error);
      throw error;
    }
  }

  async getChainConfig() {
    try {
      const response = await fetch(`${this.apiBase}/web3/chain/config`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Chain config error:', error);
      throw error;
    }
  }

  async disconnectWallet(address) {
    try {
      const response = await fetch(`${this.apiBase}/web3/wallet/${address}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      if (data.success) {
        this.connectedWallet = null;
      }
      return data;
    } catch (error) {
      console.error('Wallet disconnect error:', error);
      throw error;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Web3BridgeClient;
}
