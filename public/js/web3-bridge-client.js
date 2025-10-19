
class Web3BridgeClient {
  constructor(baseUrl = window.location.origin) {
    this.baseUrl = baseUrl;
    this.connectedWallet = null;
    this.eventHandlers = new Map();
  }

  async getStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/web3/status`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching bridge status:', error);
      throw error;
    }
  }

  async connectWallet(address) {
    if (!this.isValidAddress(address)) {
      throw new Error('Invalid wallet address format');
    }

    try {
      const response = await fetch(`${this.baseUrl}/web3/wallet/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });

      const data = await response.json();

      if (data.success) {
        this.connectedWallet = data.wallet;
        this.emit('wallet:connected', data.wallet);
        return data.wallet;
      } else {
        throw new Error(data.error || 'Failed to connect wallet');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  async disconnectWallet(address) {
    try {
      const response = await fetch(`${this.baseUrl}/web3/wallet/${address}/disconnect`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        if (this.connectedWallet?.address === address) {
          this.connectedWallet = null;
        }
        this.emit('wallet:disconnected', { address });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  }

  async getBalance(address) {
    try {
      const response = await fetch(`${this.baseUrl}/web3/wallet/${address}/balance`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  }

  async createTransaction(from, to, amount) {
    try {
      const response = await fetch(`${this.baseUrl}/web3/transaction/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, amount })
      });

      const data = await response.json();

      if (data.success) {
        this.emit('transaction:created', data.transaction);
        return data.transaction;
      } else {
        throw new Error(data.error || 'Failed to create transaction');
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async sendTransaction(txId) {
    try {
      const response = await fetch(`${this.baseUrl}/web3/transaction/${txId}/send`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        this.emit('transaction:sent', data.transaction);
        return data.transaction;
      } else {
        throw new Error(data.error || 'Failed to send transaction');
      }
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  async getTransaction(txId) {
    try {
      const response = await fetch(`${this.baseUrl}/web3/transaction/${txId}`);
      const data = await response.json();
      return data.transaction;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  async getTransactions() {
    try {
      const response = await fetch(`${this.baseUrl}/web3/transactions`);
      const data = await response.json();
      return data.transactions || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  async verifyTransaction(hash) {
    try {
      const response = await fetch(`${this.baseUrl}/web3/transaction/${hash}/verify`);
      const data = await response.json();
      return data.verified;
    } catch (error) {
      console.error('Error verifying transaction:', error);
      throw error;
    }
  }

  async getChainConfig() {
    try {
      const response = await fetch(`${this.baseUrl}/web3/chain/config`);
      const data = await response.json();
      return data.config;
    } catch (error) {
      console.error('Error fetching chain config:', error);
      throw error;
    }
  }

  isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  formatBalance(balance, decimals = 4) {
    return parseFloat(balance).toFixed(decimals);
  }

  shortenAddress(address, chars = 4) {
    if (!this.isValidAddress(address)) return address;
    return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  off(event, handler) {
    if (!this.eventHandlers.has(event)) return;
    const handlers = this.eventHandlers.get(event);
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.eventHandlers.has(event)) return;
    const handlers = this.eventHandlers.get(event);
    handlers.forEach(handler => handler(data));
  }

  getConnectedWallet() {
    return this.connectedWallet;
  }

  isConnected() {
    return this.connectedWallet !== null;
  }
}

// Export for use in HTML pages
if (typeof window !== 'undefined') {
  window.Web3BridgeClient = Web3BridgeClient;
}
