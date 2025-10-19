
export interface Web3Transaction {
  id: string;
  from: string;
  to: string;
  amount: string;
  currency: string;
  hash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  gasPrice?: string;
  gasLimit?: string;
  nonce?: number;
  blockNumber?: number;
  confirmations?: number;
}

export class Web3TransactionModel {
  private transaction: Web3Transaction;

  constructor(data: Partial<Web3Transaction>) {
    this.transaction = {
      id: data.id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: data.from || '',
      to: data.to || '',
      amount: data.amount || '0',
      currency: data.currency || 'MATIC',
      status: data.status || 'pending',
      timestamp: data.timestamp || Date.now(),
      hash: data.hash,
      gasPrice: data.gasPrice,
      gasLimit: data.gasLimit,
      nonce: data.nonce,
      blockNumber: data.blockNumber,
      confirmations: data.confirmations || 0
    };
  }

  getId(): string {
    return this.transaction.id;
  }

  getHash(): string | undefined {
    return this.transaction.hash;
  }

  setHash(hash: string): void {
    this.transaction.hash = hash;
  }

  getStatus(): string {
    return this.transaction.status;
  }

  setStatus(status: 'pending' | 'confirmed' | 'failed'): void {
    this.transaction.status = status;
  }

  addConfirmation(): void {
    this.transaction.confirmations = (this.transaction.confirmations || 0) + 1;
  }

  isConfirmed(): boolean {
    return this.transaction.status === 'confirmed' && (this.transaction.confirmations || 0) >= 12;
  }

  getData(): Web3Transaction {
    return { ...this.transaction };
  }

  toJSON(): Web3Transaction {
    return this.getData();
  }
}
