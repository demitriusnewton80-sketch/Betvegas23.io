
// Web3 Bridge Client - Handles blockchain integration with S3 data
// Young Meaat LLC - FCC Entity: 20130314143016

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
      this.s3Enabled = false;
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

    // Connect wallet with S3 data backup
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
          
          // Store wallet data in S3
          await this.storeWalletDataToS3(data.wallet);
          
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

    // Store wallet data to S3
    async storeWalletDataToS3(walletData) {
      try {
        const sessionId = this.getSessionId();
        if (!sessionId) return;

        const response = await fetch(`${getAPIBase()}/aws-data/store`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionId}`
          },
          body: JSON.stringify({
            dataType: 'web3-wallet',
            content: {
              address: walletData.address,
              balance: walletData.balance,
              chainId: walletData.chainId,
              connectedAt: new Date().toISOString()
            },
            encrypt: true
          }),
        });

        const data = await response.json();
        if (data.success) {
          this.s3Enabled = true;
          this.emit('s3:stored', { dataId: data.dataId });
        }
      } catch (error) {
        console.error('S3 storage error:', error);
      }
    }

    // Store transaction data to S3
    async storeTransactionToS3(txData) {
      try {
        const sessionId = this.getSessionId();
        if (!sessionId) return;

        const response = await fetch(`${getAPIBase()}/aws-data/store`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionId}`
          },
          body: JSON.stringify({
            dataType: 'web3-transaction',
            content: {
              txId: txData.id,
              hash: txData.hash,
              from: txData.from,
              to: txData.to,
              amount: txData.amount,
              status: txData.status,
              createdAt: txData.createdAt
            },
            encrypt: true
          }),
        });

        const data = await response.json();
        if (data.success) {
          this.emit('s3:tx-stored', { dataId: data.dataId });
        }
      } catch (error) {
        console.error('S3 transaction storage error:', error);
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

    // Create transaction with S3 backup
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
          // Store transaction to S3
          await this.storeTransactionToS3(data.transaction);
          
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

    // Send transaction with S3 update
    async sendTransaction(txId) {
      try {
        const response = await fetch(`${getAPIBase()}/web3/transaction/${txId}/send`, {
          method: 'POST',
        });

        const data = await response.json();

        if (data.success) {
          // Update transaction status in S3
          await this.storeTransactionToS3(data.transaction);
          
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

    // Get S3 stored data
    async getS3WalletData() {
      try {
        const sessionId = this.getSessionId();
        if (!sessionId) return null;

        const response = await fetch(`${getAPIBase()}/aws-data/list`, {
          headers: {
            'Authorization': `Bearer ${sessionId}`
          }
        });

        const data = await response.json();
        if (data.success) {
          return data.data.filter(item => item.dataType === 'web3-wallet');
        }
        return null;
      } catch (error) {
        console.error('S3 fetch error:', error);
        return null;
      }
    }

    // Get S3 transaction history
    async getS3TransactionHistory() {
      try {
        const sessionId = this.getSessionId();
        if (!sessionId) return null;

        const response = await fetch(`${getAPIBase()}/aws-data/list`, {
          headers: {
            'Authorization': `Bearer ${sessionId}`
          }
        });

        const data = await response.json();
        if (data.success) {
          return data.data.filter(item => item.dataType === 'web3-transaction');
        }
        return null;
      } catch (error) {
        console.error('S3 fetch error:', error);
        return null;
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
      this.s3Enabled = false;
    }

    // Helper to get session ID
    getSessionId() {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'session_id') {
          return value;
        }
      }
      return null;
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

    // Get S3 integration status
    getS3Status() {
      return {
        enabled: this.s3Enabled,
        walletBackup: this.isConnected && this.s3Enabled,
        transactionBackup: this.s3Enabled
      };
    }
  }

  // Export to window
  window.Web3BridgeClient = Web3BridgeClient;

})(window);
