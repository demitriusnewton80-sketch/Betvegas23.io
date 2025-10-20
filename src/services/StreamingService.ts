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
  amazonPrimeUrl?: string;
}

interface StreamAccess {
  userId: string;
  gameId: string;
  accessGrantedAt: string;
  betId: string;
  amazonPrimeStreamUrl: string;
}

interface ExternalSportsbook {
  id: string;
  name: string;
  apiKey: string;
  webhookUrl: string;
  active: boolean;
  allowedIPs: string[];
  registeredAt: string;
  githubProject?: string;
  fccRegistration?: string; // Added to match usage in constructor
}

class StreamingService extends EventEmitter {
  private activeStreams: Map<string, NodeJS.Timeout> = new Map();
  private streamFailures: Map<string, number> = new Map();
  private externalSportsbooks: Map<string, ExternalSportsbook> = new Map();
  private sharedStreams: Map<string, Set<string>> = new Map(); // gameId -> Set of sportsbook IDs
  private streamAccess: Map<string, StreamAccess[]> = new Map(); // userId -> StreamAccess[]

  constructor() {
    super();
    // Initialize with sample external sportsbooks
    this.externalSportsbooks.set('sb-001', {
      id: 'sb-001',
      name: 'BetPartner Pro',
      apiKey: 'demo-key-001',
      webhookUrl: 'https://api.betpartner.example/streams',
      active: true,
      allowedIPs: ['192.168.1.100', '10.0.0.50'],
      registeredAt: new Date().toISOString(),
      githubProject: 'https://github.com/betvages23/betvages23.in'
    });
    this.externalSportsbooks.set('sb-002', {
      id: 'sb-002',
      name: 'OddsExchange',
      apiKey: 'demo-key-002',
      webhookUrl: 'https://api.oddsexchange.example/feeds',
      active: true,
      allowedIPs: ['203.0.113.45'],
      registeredAt: new Date().toISOString()
    });

    // Add NBA.com direct integration under FCC registration
    this.externalSportsbooks.set('nba-direct', {
      id: 'nba-direct',
      name: 'NBA Official - 20130314143016',
      apiKey: 'fcc-0024454324',
      webhookUrl: 'https://www.nba.com/live',
      active: true,
      allowedIPs: [],
      registeredAt: '03/25/2015',
      fccRegistration: '0024454324'
    });
  }

  // Get NBA direct control access
  getNBADirectControl(userId: string, gameId: string): any {
    return {
      userId,
      gameId,
      streamUrl: 'https://www.nba.com/live',
      controlEntity: '20130314143016',
      fccCompliant: true,
      accessLevel: 'full',
      grantedAt: new Date().toISOString()
    };
  }

  // Validate IP address against sportsbook's allowed IPs
  validateIPAccess(sportsbookId: string, clientIP: string): boolean {
    const sportsbook = this.externalSportsbooks.get(sportsbookId);
    if (!sportsbook || !sportsbook.active) {
      return false;
    }

    // Allow access if IP is in allowed list
    return sportsbook.allowedIPs.includes(clientIP);
  }

  // Register callback URL with IP whitelist
  registerCallback(sportsbookId: string, callbackUrl: string, allowedIPs: string[]): boolean {
    const sportsbook = this.externalSportsbooks.get(sportsbookId);
    if (sportsbook) {
      sportsbook.webhookUrl = callbackUrl;
      sportsbook.allowedIPs = allowedIPs;
      return true;
    }
    return false;
  }

  startGameStream(gameId: string): void {
    if (this.activeStreams.has(gameId)) {
      return;
    }

    console.log(`Live stream started for game ${gameId}`);
    this.streamFailures.delete(gameId);

    // Simulate live game updates with proper error handling
    const interval = setInterval(() => {
      try {
        const update: LiveGameUpdate = {
          gameId,
          score: {
            home: Math.floor(Math.random() * 100),
            away: Math.floor(Math.random() * 100)
          },
          quarter: `Q${Math.floor(Math.random() * 4) + 1}`,
          timeRemaining: `${Math.floor(Math.random() * 12)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
          lastPlay: 'Play in progress',
          timestamp: new Date().toISOString()
        };

        this.pushGameUpdate(update);
      } catch (error) {
        console.error(`Error generating update for game ${gameId}:`, error);
        this.recordStreamFailure(gameId);
      }
    }, 3000);

    this.activeStreams.set(gameId, interval);
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

  // Get active streams for API responses
  getActiveStreams(): Array<{id: string, name: string, sport: string, status: string, url: string}> {
    const streams: Array<{id: string, name: string, sport: string, status: string, url: string}> = [];
    
    this.activeStreams.forEach((_, gameId) => {
      streams.push({
        id: gameId,
        name: `Game ${gameId}`,
        sport: 'NBA',
        status: 'live',
        url: `/streaming/game/${gameId}`
      });
    });

    // Add external sportsbook streams
    this.externalSportsbooks.forEach(sb => {
      if (sb.active) {
        streams.push({
          id: sb.id,
          name: sb.name,
          sport: 'Multi-Sport',
          status: 'streaming',
          url: sb.webhookUrl
        });
      }
    });

    return streams;
  }

  stopGameStream(gameId: string): void {
    const interval = this.activeStreams.get(gameId);
    if (interval) {
      clearInterval(interval);
      console.log(`Live stream stopped for game ${gameId}`);
      this.activeStreams.delete(gameId);
      this.sharedStreams.delete(gameId);
      this.streamFailures.delete(gameId);
    }
  }

  stopAllStreams(): void {
    this.activeStreams.forEach((interval, gameId) => {
      if (interval) {
        clearInterval(interval);
      }
      console.log(`Stopping stream for game ${gameId}`);
    });
    this.activeStreams.clear();
    this.sharedStreams.clear();
    this.streamFailures.clear();
  }

  // Grant Amazon Prime stream access when user places a bet
  grantStreamAccess(userId: string, gameId: string, betId: string): StreamAccess {
    const amazonPrimeStreamUrl = this.generateAmazonPrimeUrl(gameId);

    const access: StreamAccess = {
      userId,
      gameId,
      accessGrantedAt: new Date().toISOString(),
      betId,
      amazonPrimeStreamUrl
    };

    if (!this.streamAccess.has(userId)) {
      this.streamAccess.set(userId, []);
    }

    this.streamAccess.get(userId)!.push(access);

    console.log(`Amazon Prime stream access granted to user ${userId} for game ${gameId}`);
    this.emit('streamAccessGranted', access);

    return access;
  }

  // Generate Amazon Prime Video URL for game stream
  private generateAmazonPrimeUrl(gameId: string): string {
    // In production, this would integrate with Amazon Prime Video API
    // Using independent writer partnership deal credentials
    const baseUrl = 'https://www.amazon.com/gp/video/detail';
    const streamToken = Buffer.from(`youngmeat-${gameId}-${Date.now()}`).toString('base64');

    return `${baseUrl}/${gameId}?autoplay=1&token=${streamToken}&partner=youngmeat-llc`;
  }

  // Check if user has stream access for a game
  hasStreamAccess(userId: string, gameId: string): boolean {
    const userAccess = this.streamAccess.get(userId);
    if (!userAccess) return false;

    return userAccess.some(access => access.gameId === gameId);
  }

  // Get Amazon Prime stream URL for user and game
  getAmazonPrimeUrl(userId: string, gameId: string): string | null {
    const userAccess = this.streamAccess.get(userId);
    if (!userAccess) return null;

    const access = userAccess.find(a => a.gameId === gameId);
    return access ? access.amazonPrimeStreamUrl : null;
  }

  // Get all stream access for a user
  getUserStreamAccess(userId: string): StreamAccess[] {
    return this.streamAccess.get(userId) || [];
  }
}

export const streamingService = new StreamingService();