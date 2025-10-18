
import { EventEmitter } from 'events';

export interface LiveGameUpdate {
  gameId: string;
  score: {
    home: number;
    away: number;
  };
  quarter?: string;
  period?: string;
  timeRemaining?: string;
  lastPlay?: string;
  timestamp: string;
}

interface ExternalSportsbook {
  id: string;
  name: string;
  apiKey: string;
  webhookUrl: string;
  active: boolean;
}

class StreamingService extends EventEmitter {
  private activeStreams: Map<string, NodeJS.Timeout> = new Map();
  private streamFailures: Map<string, number> = new Map();
  private externalSportsbooks: Map<string, ExternalSportsbook> = new Map();
  private sharedStreams: Map<string, Set<string>> = new Map(); // gameId -> Set of sportsbook IDs

  constructor() {
    super();
    // Initialize with sample external sportsbooks
    this.externalSportsbooks.set('sb-001', {
      id: 'sb-001',
      name: 'BetPartner Pro',
      apiKey: 'demo-key-001',
      webhookUrl: 'https://api.betpartner.example/streams',
      active: true
    });
    this.externalSportsbooks.set('sb-002', {
      id: 'sb-002',
      name: 'OddsExchange',
      apiKey: 'demo-key-002',
      webhookUrl: 'https://api.oddsexchange.example/feeds',
      active: true
    });
  }

  startGameStream(gameId: string): void {
    if (this.activeStreams.has(gameId)) {
      return;
    }

    console.log(`Live stream started for game ${gameId}`);
    this.streamFailures.delete(gameId);
    
    // Placeholder - replace with actual data source integration
    this.activeStreams.set(gameId, undefined as any);
  }

  // Method to push live updates from external source
  pushGameUpdate(update: LiveGameUpdate): void {
    this.emit('gameUpdate', update);
    
    // Share update with external sportsbooks if stream is being shared
    const sharedWith = this.sharedStreams.get(update.gameId);
    if (sharedWith && sharedWith.size > 0) {
      this.distributeToExternalSportsbooks(update, sharedWith);
    }
  }

  // Record stream failure and activate sharing if threshold reached
  recordStreamFailure(gameId: string): void {
    const failures = (this.streamFailures.get(gameId) || 0) + 1;
    this.streamFailures.set(gameId, failures);
    
    console.log(`Stream failure recorded for game ${gameId}. Total failures: ${failures}`);
    
    // If connection fails, activate stream sharing to external sportsbooks
    if (failures >= 1) {
      this.activateStreamSharing(gameId);
    }
  }

  // Activate sharing this game's stream with external sportsbooks
  private activateStreamSharing(gameId: string): void {
    if (!this.sharedStreams.has(gameId)) {
      this.sharedStreams.set(gameId, new Set());
    }
    
    const activeBooks = Array.from(this.externalSportsbooks.values())
      .filter(sb => sb.active);
    
    activeBooks.forEach(sportsbook => {
      this.sharedStreams.get(gameId)!.add(sportsbook.id);
    });
    
    console.log(`Stream sharing activated for game ${gameId} with ${activeBooks.length} external sportsbooks`);
    this.emit('streamSharingActivated', { gameId, sportsbooksCount: activeBooks.length });
  }

  // Distribute stream data to external sportsbooks
  private async distributeToExternalSportsbooks(update: LiveGameUpdate, sportsbookIds: Set<string>): Promise<void> {
    const promises = Array.from(sportsbookIds).map(async (sbId) => {
      const sportsbook = this.externalSportsbooks.get(sbId);
      if (!sportsbook || !sportsbook.active) return;

      try {
        // In production, send actual HTTP request to webhook
        console.log(`Sharing stream data for game ${update.gameId} with ${sportsbook.name}`);
        
        // Simulated webhook call - replace with actual fetch in production
        // await fetch(sportsbook.webhookUrl, {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'X-API-Key': sportsbook.apiKey
        //   },
        //   body: JSON.stringify({
        //     source: 'Young Meat LLC',
        //     gameUpdate: update,
        //     timestamp: new Date().toISOString()
        //   })
        // });
      } catch (error) {
        console.error(`Failed to share stream with ${sportsbook.name}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  // Get sharing status for a game
  getSharingStatus(gameId: string): { isShared: boolean; sportsbooksCount: number; sportsbooks: string[] } {
    const sharedWith = this.sharedStreams.get(gameId);
    if (!sharedWith || sharedWith.size === 0) {
      return { isShared: false, sportsbooksCount: 0, sportsbooks: [] };
    }

    const sportsbookNames = Array.from(sharedWith)
      .map(id => this.externalSportsbooks.get(id)?.name)
      .filter(name => name !== undefined) as string[];

    return {
      isShared: true,
      sportsbooksCount: sharedWith.size,
      sportsbooks: sportsbookNames
    };
  }

  // Add new external sportsbook
  addExternalSportsbook(sportsbook: ExternalSportsbook): void {
    this.externalSportsbooks.set(sportsbook.id, sportsbook);
  }

  // Get all external sportsbooks
  getExternalSportsbooks(): ExternalSportsbook[] {
    return Array.from(this.externalSportsbooks.values());
  }

  stopGameStream(gameId: string): void {
    if (this.activeStreams.has(gameId)) {
      console.log(`Live stream stopped for game ${gameId}`);
      this.activeStreams.delete(gameId);
      this.sharedStreams.delete(gameId);
      this.streamFailures.delete(gameId);
    }
  }

  stopAllStreams(): void {
    this.activeStreams.forEach((_, gameId) => {
      console.log(`Stopping stream for game ${gameId}`);
    });
    this.activeStreams.clear();
    this.sharedStreams.clear();
    this.streamFailures.clear();
  }
}

export const streamingService = new StreamingService();
