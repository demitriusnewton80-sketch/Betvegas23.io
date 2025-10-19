
// Web3 Bridge Client - Handles blockchain integration
// Young Meeat LLC - FCC Entity: 20130314143016

(function(window) {
  'use strict';

  // Prevent redeclaration
  if (window.Web3BridgeClient) {
    return;
  }

  // Use CloudConfig if available, otherwise fallback
  const getAPIBase = () => {
    return window.CloudConfig ? window.CloudConfig.getAPIBase() : window.location.origin;
  };

  class Web3BridgeClient extends EventTarget {
    constructor() {
      super();
      this.walletAddress = null;
      this.isConnected = false;
      this.chainId = null;
      this.eventListeners = {};
    }

    // Event emitter compatibility
    on(event, callback) {
      this.addEventListener(event, callback);
    }

    off(event, callback) {
      this.removeEventListener(event, callback);
    }

    emit(event, data) {
      this.dispatchEvent(new CustomEvent(event, { detail: data }));
    }

    // Connect wallet
    async connectWallet(address) {
      try {
        const response = await fetch(`${getAPIBase()}/web3/wallet/connect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address }),
        });

        const data = await response.json();

        if (data.success) {
          this.walletAddress = address;
          this.isConnected = true;
          this.emit('wallet:connected', data.wallet);
          return data.wallet;
        } else {
          throw new Error(data.error || 'Failed to connect wallet');
        }
      } catch (error) {
        console.error('Wallet connection error:', error);
        throw error;
      }
    }

    // Get wallet balance
    async getBalance(address) {
      try {
        const response = await fetch(`${getAPIBase()}/web3/wallet/${address}/balance`);
        const data = await response.json();

        if (data.success) {
          return data.balance;
        } else {
          throw new Error(data.error || 'Failed to get balance');
        }
      } catch (error) {
        console.error('Balance fetch error:', error);
        throw error;
      }
    }

    // Get bridge status
    async getStatus() {
      try {
        const response = await fetch(`${getAPIBase()}/web3/status`);
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Status fetch error:', error);
        throw error;
      }
    }

    // Create transaction
    async createTransaction(transactionData) {
      try {
        const response = await fetch(`${getAPIBase()}/web3/transaction/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transactionData),
        });

        const data = await response.json();

        if (data.success) {
          this.emit('transaction:created', data.transaction);
          return data.transaction;
        } else {
          throw new Error(data.error || 'Failed to create transaction');
        }
      } catch (error) {
        console.error('Transaction creation error:', error);
        throw error;
      }
    }

    // Send transaction
    async sendTransaction(txId) {
      try {
        const response = await fetch(`${getAPIBase()}/web3/transaction/${txId}/send`, {
          method: 'POST',
        });

        const data = await response.json();

        if (data.success) {
          this.emit('transaction:sent', data.transaction);
          return data.transaction;
        } else {
          throw new Error(data.error || 'Failed to send transaction');
        }
      } catch (error) {
        console.error('Transaction send error:', error);
        throw error;
      }
    }

    // Get all transactions
    async getTransactions() {
      try {
        const response = await fetch(`${getAPIBase()}/web3/transactions`);
        const data = await response.json();

        if (data.success) {
          return data.transactions;
        } else {
          return [];
        }
      } catch (error) {
        console.error('Transactions fetch error:', error);
        return [];
      }
    }

    // Disconnect wallet
    async disconnectWallet() {
      if (this.walletAddress) {
        try {
          await fetch(`${getAPIBase()}/web3/wallet/${this.walletAddress}/disconnect`, {
            method: 'POST',
          });
        } catch (error) {
          console.error('Disconnect error:', error);
        }
      }

      this.walletAddress = null;
      this.isConnected = false;
    }

    // Utility: Shorten address for display
    shortenAddress(address, chars = 4) {
      if (!address) return '';
      return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
    }

    // Utility: Format balance
    formatBalance(balance) {
      return parseFloat(balance).toFixed(4);
    }
  }

  // Export to window
  window.Web3BridgeClient = Web3BridgeClient;

})(window);
