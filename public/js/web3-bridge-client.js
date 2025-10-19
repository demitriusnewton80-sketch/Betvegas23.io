
// Web3 Bridge Client - Handles blockchain integration
// Young Meeat LLC - FCC Entity: 20130314143016

(function() {
  'use strict';

  const API_BASE = window.location.origin;

  class Web3BridgeClient {
    constructor() {
      this.walletAddress = null;
      this.isConnected = false;
      this.chainId = null;
    }

    // Connect wallet
    async connectWallet(address) {
      try {
        const response = await fetch(`${API_BASE}/web3/wallet/connect`, {
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
        const response = await fetch(`${API_BASE}/web3/wallet/${address}/balance`);
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
        const response = await fetch(`${API_BASE}/web3/status`);
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
        const response = await fetch(`${API_BASE}/web3/transaction/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transactionData),
        });

        const data = await response.json();

        if (data.success) {
          return data.transaction;
        } else {
          throw new Error(data.error || 'Failed to create transaction');
        }
      } catch (error) {
        console.error('Transaction creation error:', error);
        throw error;
      }
    }

    // Disconnect wallet
    async disconnectWallet() {
      if (this.walletAddress) {
        try {
          await fetch(`${API_BASE}/web3/wallet/${this.walletAddress}/disconnect`, {
            method: 'POST',
          });
        } catch (error) {
          console.error('Disconnect error:', error);
        }
      }

      this.walletAddress = null;
      this.isConnected = false;
    }
  }

  // Export for use in other scripts
  if (typeof window !== 'undefined') {
    window.Web3BridgeClient = Web3BridgeClient;
  }

  // Also support module exports if needed
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Web3BridgeClient;
  }
})();
