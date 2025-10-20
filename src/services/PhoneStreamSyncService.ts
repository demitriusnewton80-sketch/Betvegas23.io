
import { EventEmitter } from 'events';
import { espnTrackerService } from './ESPNSportsTrackerService.js';

export interface PhoneSubscription {
  phoneId: string;
  phoneNumber: string;
  sports: string[];
  teams: string[];
  notificationPreferences: {
    scoreUpdates: boolean;
    gameStart: boolean;
    gameEnd: boolean;
    breakingNews: boolean;
  };
  signalConnected: boolean;
  lastSync: string;
}

export interface StreamUpdate {
  updateId: string;
  type: 'score' | 'game_start' | 'game_end' | 'breaking_news';
  sport: string;
  gameId: string;
  message: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
}

class PhoneStreamSyncService extends EventEmitter {
  private subscriptions: Map<string, PhoneSubscription> = new Map();
  private updateQueue: StreamUpdate[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private signalConnections: Map<string, boolean> = new Map();

  constructor() {
    super();
    this.initializeStreamSync();
    this.connectToSportsTracker();
  }

  private initializeStreamSync() {
    // Start streaming updates every 5 seconds
    this.syncInterval = setInterval(() => {
      this.syncToPhones();
    }, 5000);
  }

  private connectToSportsTracker() {
    // Listen to ESPN tracker updates
    espnTrackerService.on('scoreUpdate', (update: any) => {
      this.handleSportsUpdate(update);
    });

    // Poll for updates
    setInterval(() => {
      const liveGames = espnTrackerService.getCurrentLiveGames();
      liveGames.forEach(game => {
        if (game.score) {
          this.queueUpdate({
            updateId: `score-${game.gameId}-${Date.now()}`,
            type: 'score',
            sport: game.league,
            gameId: game.gameId,
            message: `${game.awayTeam} ${game.score.away} @ ${game.homeTeam} ${game.score.home} - ${game.quarter || 'Live'}`,
            timestamp: new Date().toISOString(),
            priority: 'medium'
          });
        }
      });
    }, 10000);
  }

  private handleSportsUpdate(update: any) {
    const streamUpdate: StreamUpdate = {
      updateId: `update-${update.gameId}-${Date.now()}`,
      type: 'score',
      sport: update.game.league,
      gameId: update.gameId,
      message: `LIVE: ${update.game.awayTeam} ${update.game.score?.away || 0} @ ${update.game.homeTeam} ${update.game.score?.home || 0}`,
      timestamp: update.timestamp,
      priority: 'high'
    };

    this.queueUpdate(streamUpdate);
  }

  subscribePhone(subscription: PhoneSubscription): boolean {
    this.subscriptions.set(subscription.phoneId, subscription);
    
    if (subscription.signalConnected) {
      this.signalConnections.set(subscription.phoneId, true);
    }

    this.emit('phoneSubscribed', subscription);
    console.log(`Phone ${subscription.phoneNumber} subscribed to sports streams`);
    return true;
  }

  unsubscribePhone(phoneId: string): boolean {
    const removed = this.subscriptions.delete(phoneId);
    this.signalConnections.delete(phoneId);
    
    if (removed) {
      this.emit('phoneUnsubscribed', phoneId);
    }
    
    return removed;
  }

  private queueUpdate(update: StreamUpdate) {
    this.updateQueue.push(update);
    
    // Keep only last 1000 updates
    if (this.updateQueue.length > 1000) {
      this.updateQueue = this.updateQueue.slice(-1000);
    }

    this.emit('updateQueued', update);
  }

  private syncToPhones() {
    if (this.updateQueue.length === 0) return;

    const updates = [...this.updateQueue];
    this.updateQueue = [];

    this.subscriptions.forEach((subscription, phoneId) => {
      const relevantUpdates = updates.filter(update => {
        // Filter by sport preference
        if (subscription.sports.length > 0 && !subscription.sports.includes(update.sport)) {
          return false;
        }

        // Filter by notification preferences
        if (update.type === 'score' && !subscription.notificationPreferences.scoreUpdates) {
          return false;
        }
        if (update.type === 'game_start' && !subscription.notificationPreferences.gameStart) {
          return false;
        }
        if (update.type === 'game_end' && !subscription.notificationPreferences.gameEnd) {
          return false;
        }
        if (update.type === 'breaking_news' && !subscription.notificationPreferences.breakingNews) {
          return false;
        }

        return true;
      });

      if (relevantUpdates.length > 0) {
        this.pushToPhone(phoneId, subscription, relevantUpdates);
      }
    });
  }

  private async pushToPhone(phoneId: string, subscription: PhoneSubscription, updates: StreamUpdate[]) {
    try {
      // Update last sync time
      subscription.lastSync = new Date().toISOString();
      this.subscriptions.set(phoneId, subscription);

      // Emit to SSE streams
      this.emit('phoneUpdate', {
        phoneId,
        phoneNumber: subscription.phoneNumber,
        updates,
        timestamp: new Date().toISOString()
      });

      // Signal sync
      if (subscription.signalConnected) {
        this.syncToSignal(subscription.phoneNumber, updates);
      }

      console.log(`Pushed ${updates.length} updates to phone ${subscription.phoneNumber}`);
    } catch (error) {
      console.error(`Error pushing to phone ${phoneId}:`, error);
    }
  }

  private syncToSignal(phoneNumber: string, updates: StreamUpdate[]) {
    // Signal protocol integration
    const signalMessage = updates.map(u => u.message).join('\n');
    
    console.log(`[SIGNAL SYNC] To: ${phoneNumber}`);
    console.log(`[SIGNAL SYNC] Updates: ${updates.length}`);
    console.log(`[SIGNAL SYNC] Message:\n${signalMessage}`);

    // In production, integrate with Signal API
    // For now, we log and emit event
    this.emit('signalSync', {
      phoneNumber,
      message: signalMessage,
      updateCount: updates.length,
      timestamp: new Date().toISOString()
    });
  }

  getSubscription(phoneId: string): PhoneSubscription | undefined {
    return this.subscriptions.get(phoneId);
  }

  getAllSubscriptions(): PhoneSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  getQueuedUpdates(): StreamUpdate[] {
    return [...this.updateQueue];
  }

  getSignalConnections(): Map<string, boolean> {
    return new Map(this.signalConnections);
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

export const phoneStreamSyncService = new PhoneStreamSyncService();
