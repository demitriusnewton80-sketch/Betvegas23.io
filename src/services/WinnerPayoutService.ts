import { EventEmitter } from 'events';
import { phoneControlService } from './PhoneControlService.js';

interface DeviceData {
  deviceId: string;
  userId: string;
  ipAddress: string;
  wifiStrength: number;
  connectionType: string;
  location?: string;
  connectedAt: string;
}

interface GameWinner {
  gameId: string;
  userId: string;
  betId: string;
  winAmount: number;
  gameType: 'sports' | 'ps5' | 'live';
  wonAt: string;
  deviceData: DeviceData;
}

interface CashPayment {
  id: string;
  userId: string;
  winnerId: string;
  amount: number;
  paymentMethod: string;
  deviceId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  initiatedAt: string;
  completedAt?: string;
}

class WinnerPayoutService extends EventEmitter {
  private deviceConnections: Map<string, DeviceData> = new Map();
  private gameWinners: Map<string, GameWinner[]> = new Map();
  private cashPayments: Map<string, CashPayment> = new Map();
  private revivalWinners: Set<string> = new Set();

  constructor() {
    super();
  }

  connectDevice(deviceData: DeviceData): boolean {
    this.deviceConnections.set(deviceData.deviceId, deviceData);

    phoneControlService.connectUserToPlugin(deviceData.userId, 'live-sportsbook');
    phoneControlService.connectUserToPlugin(deviceData.userId, 'ps5-betting');
    phoneControlService.connectUserToPlugin(deviceData.userId, 'winner-payout');

    this.emit('deviceConnected', deviceData);
    return true;
  }

  getDeviceData(deviceId: string): DeviceData | undefined {
    return this.deviceConnections.get(deviceId);
  }

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

    const totalWins = this.gameWinners.get(userId)!.length;
    if (totalWins >= 3) {
      this.revivalWinners.add(userId);
    }

    this.emit('winnerRecorded', winner);
    return winner;
  }

  getUserWinnings(userId: string): GameWinner[] {
    return this.gameWinners.get(userId) || [];
  }

  processCashout(
    userId: string,
    winnerId: string,
    paymentMethod: string,
    deviceId: string
  ): CashPayment {
    const winnings = this.getUserWinnings(userId);
    const winner = winnings.find(w => `${w.gameId}-${w.betId}` === winnerId);

    if (!winner) {
      throw new Error('Winner record not found');
    }

    const payment: CashPayment = {
      id: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      winnerId,
      amount: winner.winAmount,
      paymentMethod,
      deviceId,
      status: 'processing',
      initiatedAt: new Date().toISOString()
    };

    this.cashPayments.set(payment.id, payment);

    setTimeout(() => {
      payment.status = 'completed';
      payment.completedAt = new Date().toISOString();
      this.emit('paymentCompleted', payment);
    }, 5000);

    this.emit('paymentInitiated', payment);
    return payment;
  }

  processRevivalCash(userId: string, deviceId: string): any {
    if (!this.revivalWinners.has(userId)) {
      return {
        eligible: false,
        message: 'Not eligible for revival cash. Win 3 games to qualify.'
      };
    }

    const winnings = this.getUserWinnings(userId);
    const bonusAmount = winnings.reduce((sum, w) => sum + w.winAmount, 0) * 0.1;

    const payment: CashPayment = {
      id: `REVIVAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      winnerId: 'revival-bonus',
      amount: bonusAmount,
      paymentMethod: 'revival_cash_bonus',
      deviceId,
      status: 'processing',
      initiatedAt: new Date().toISOString()
    };

    this.cashPayments.set(payment.id, payment);

    setTimeout(() => {
      payment.status = 'completed';
      payment.completedAt = new Date().toISOString();
      this.emit('revivalCashCompleted', payment);
    }, 3000);

    this.revivalWinners.delete(userId);

    return {
      eligible: true,
      payment,
      message: 'Revival cash bonus activated! 10% of total winnings credited.'
    };
  }

  getPayoutHistory(userId: string): CashPayment[] {
    return Array.from(this.cashPayments.values())
      .filter(p => p.userId === userId)
      .sort((a, b) => new Date(b.initiatedAt).getTime() - new Date(a.initiatedAt).getTime());
  }
}

export const winnerPayoutService = new WinnerPayoutService();