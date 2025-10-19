
import { EventEmitter } from 'events';
import { phoneControlService } from './PhoneControlService.js';

export interface DeviceData {
  deviceId: string;
  userId: string;
  ipAddress: string;
  wifiStrength: number;
  connectionType: 'wifi' | 'cellular' | 'ethernet';
  location?: string;
  connectedAt: string;
}

export interface GameWinner {
  gameId: string;
  userId: string;
  betId: string;
  winAmount: number;
  gameType: 'sports' | 'ps5' | 'live';
  wonAt: string;
  deviceData: DeviceData;
}

export interface CashPayment {
  id: string;
  userId: string;
  winnerId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentMethod: 'direct_deposit' | 'paypal' | 'crypto' | 'check';
  deviceId: string;
  processedAt?: string;
  completedAt?: string;
}

class WinnerPayoutService extends EventEmitter {
  private deviceConnections: Map<string, DeviceData> = new Map();
  private gameWinners: Map<string, GameWinner[]> = new Map();
  private cashPayments: Map<string, CashPayment> = new Map();
  private revivalWinners: Set<string> = new Set(); // Users eligible for revival cash

  constructor() {
    super();
  }

  // Connect device to WiFi plugin network
  connectDevice(deviceData: DeviceData): boolean {
    this.deviceConnections.set(deviceData.deviceId, deviceData);
    
    // Connect user to network plugins
    phoneControlService.connectUserToPlugin(deviceData.userId, 'live-sportsbook');
    phoneControlService.connectUserToPlugin(deviceData.userId, 'ps5-betting');
    
    this.emit('deviceConnected', deviceData);
    return true;
  }

  // Get device connection data
  getDeviceData(deviceId: string): DeviceData | undefined {
    return this.deviceConnections.get(deviceId);
  }

  // Record game winner
  recordWinner(
    gameId: string,
    userId: string,
    betId: string,
    winAmount: number,
    gameType: 'sports' | 'ps5' | 'live',
    deviceId: string
  ): GameWinner {
    const deviceData = this.deviceConnections.get(deviceId);
    
    if (!deviceData) {
      throw new Error('Device not connected to network');
    }

    const winner: GameWinner = {
      gameId,
      userId,
      betId,
      winAmount,
      gameType,
      wonAt: new Date().toISOString(),
      deviceData
    };

    if (!this.gameWinners.has(userId)) {
      this.gameWinners.set(userId, []);
    }
    this.gameWinners.get(userId)!.push(winner);

    // Distribute benefits to network
    phoneControlService.distributeBenefits(gameId, winAmount * 0.05, gameType);

    // Mark for revival cash eligibility
    this.revivalWinners.add(userId);

    this.emit('winnerRecorded', winner);
    return winner;
  }

  // Process cash payment for winner
  processCashPayment(
    userId: string,
    winnerId: string,
    paymentMethod: 'direct_deposit' | 'paypal' | 'crypto' | 'check',
    deviceId: string
  ): CashPayment {
    const userWinners = this.gameWinners.get(userId);
    if (!userWinners) {
      throw new Error('No winning records found for user');
    }

    const winner = userWinners.find(w => `${w.gameId}-${w.betId}` === winnerId);
    if (!winner) {
      throw new Error('Winner record not found');
    }

    const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const payment: CashPayment = {
      id: paymentId,
      userId,
      winnerId,
      amount: winner.winAmount,
      status: 'processing',
      paymentMethod,
      deviceId,
      processedAt: new Date().toISOString()
    };

    this.cashPayments.set(paymentId, payment);

    // Simulate payment processing
    setTimeout(() => {
      this.completePayment(paymentId);
    }, 5000);

    this.emit('paymentInitiated', payment);
    return payment;
  }

  // Complete cash payment
  private completePayment(paymentId: string): void {
    const payment = this.cashPayments.get(paymentId);
    if (!payment) return;

    payment.status = 'completed';
    payment.completedAt = new Date().toISOString();

    this.emit('paymentCompleted', payment);
  }

  // Get revival cash eligibility
  isEligibleForRevivalCash(userId: string): boolean {
    return this.revivalWinners.has(userId);
  }

  // Process revival cash payment (bonus for winners)
  processRevivalCash(userId: string, deviceId: string): CashPayment | null {
    if (!this.isEligibleForRevivalCash(userId)) {
      return null;
    }

    const userWinners = this.gameWinners.get(userId);
    if (!userWinners || userWinners.length === 0) {
      return null;
    }

    // Revival cash is 10% of total winnings
    const totalWinnings = userWinners.reduce((sum, w) => sum + w.winAmount, 0);
    const revivalAmount = totalWinnings * 0.10;

    const paymentId = `revival-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const payment: CashPayment = {
      id: paymentId,
      userId,
      winnerId: 'revival-bonus',
      amount: revivalAmount,
      status: 'processing',
      paymentMethod: 'direct_deposit',
      deviceId,
      processedAt: new Date().toISOString()
    };

    this.cashPayments.set(paymentId, payment);

    setTimeout(() => {
      this.completePayment(paymentId);
    }, 3000);

    this.emit('revivalCashProcessed', payment);
    return payment;
  }

  // Get user's winning history
  getUserWinnings(userId: string): GameWinner[] {
    return this.gameWinners.get(userId) || [];
  }

  // Get user's payment history
  getUserPayments(userId: string): CashPayment[] {
    return Array.from(this.cashPayments.values()).filter(p => p.userId === userId);
  }

  // Get all connected devices
  getConnectedDevices(): DeviceData[] {
    return Array.from(this.deviceConnections.values());
  }

  // Get network statistics
  getNetworkStats(): any {
    const totalDevices = this.deviceConnections.size;
    const totalWinners = Array.from(this.gameWinners.values()).flat().length;
    const totalPayments = this.cashPayments.size;
    const totalPaidOut = Array.from(this.cashPayments.values())
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      connectedDevices: totalDevices,
      totalWinners,
      totalPayments,
      completedPayments: Array.from(this.cashPayments.values()).filter(p => p.status === 'completed').length,
      totalPaidOut,
      revivalEligible: this.revivalWinners.size,
      fccEntity: '20130314143016'
    };
  }
}

export const winnerPayoutService = new WinnerPayoutService();
