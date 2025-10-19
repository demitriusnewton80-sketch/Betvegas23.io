
export interface WalletData {
  address: string;
  chainId: number;
  balance: string;
  nonce: number;
  connectedAt: number;
  lastActivity: number;
  network: string;
  tokenBalances?: Map<string, string>;
}

export class WalletModel {
  private wallet: WalletData;

  constructor(address: string, chainId: number, balance: string = '0') {
    this.wallet = {
      address: address.toLowerCase(),
      chainId,
      balance,
      nonce: 0,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      network: this.getNetworkName(chainId),
      tokenBalances: new Map()
    };
  }

  private getNetworkName(chainId: number): string {
    const networks: Record<number, string> = {
      1: 'Ethereum Mainnet',
      137: 'Polygon',
      56: 'BSC',
      43114: 'Avalanche',
      42161: 'Arbitrum',
      10: 'Optimism'
    };
    return networks[chainId] || 'Unknown Network';
  }

  getAddress(): string {
    return this.wallet.address;
  }

  getBalance(): string {
    return this.wallet.balance;
  }

  setBalance(balance: string): void {
    this.wallet.balance = balance;
    this.updateActivity();
  }

  getNonce(): number {
    return this.wallet.nonce;
  }

  incrementNonce(): void {
    this.wallet.nonce++;
    this.updateActivity();
  }

  getChainId(): number {
    return this.wallet.chainId;
  }

  getNetwork(): string {
    return this.wallet.network;
  }

  updateActivity(): void {
    this.wallet.lastActivity = Date.now();
  }

  setTokenBalance(tokenAddress: string, balance: string): void {
    if (!this.wallet.tokenBalances) {
      this.wallet.tokenBalances = new Map();
    }
    this.wallet.tokenBalances.set(tokenAddress.toLowerCase(), balance);
    this.updateActivity();
  }

  getTokenBalance(tokenAddress: string): string | undefined {
    return this.wallet.tokenBalances?.get(tokenAddress.toLowerCase());
  }

  getAllTokenBalances(): Record<string, string> {
    const tokens: Record<string, string> = {};
    this.wallet.tokenBalances?.forEach((balance, address) => {
      tokens[address] = balance;
    });
    return tokens;
  }

  isActive(inactivityThreshold: number = 3600000): boolean {
    return Date.now() - this.wallet.lastActivity < inactivityThreshold;
  }

  getData(): WalletData {
    return {
      ...this.wallet,
      tokenBalances: new Map(this.wallet.tokenBalances)
    };
  }

  toJSON(): any {
    return {
      address: this.wallet.address,
      chainId: this.wallet.chainId,
      balance: this.wallet.balance,
      nonce: this.wallet.nonce,
      connectedAt: this.wallet.connectedAt,
      lastActivity: this.wallet.lastActivity,
      network: this.wallet.network,
      tokenBalances: this.getAllTokenBalances()
    };
  }
}
