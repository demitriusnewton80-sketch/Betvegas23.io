
import { EventEmitter } from 'events';

interface StreamingPartner {
  id: string;
  name: string;
  type: string;
  active: boolean;
}

interface ActiveStream {
  id: string;
  name: string;
  sport: string;
  status: 'active' | 'paused' | 'ended';
  viewers: number;
  startTime: number;
}

interface ExternalSportsbook {
  id: string;
  name: string;
  url: string;
  active: boolean;
  type: 'streaming' | 'betting' | 'gaming';
}

export class StreamingService extends EventEmitter {
  private static instance: StreamingService;
  private partners: StreamingPartner[] = [
    { id: 'partner-1', name: 'ESPN Sportsbook', type: 'video', active: true },
    { id: 'partner-2', name: 'Unified Sports Hub', type: 'video', active: true },
    { id: 'partner-3', name: 'Enhanced Sportsbook', type: 'video', active: true },
    { id: 'partner-4', name: 'Mobile Sportsbook Hub', type: 'mobile', active: true },
    { id: 'partner-5', name: 'PS5 Betting', type: 'console', active: false },
    { id: 'partner-6', name: 'Boxing & UFC Hub', type: 'video', active: false }
  ];

  private activeStreams: Map<string, ActiveStream> = new Map();
  private externalSportsbooks: ExternalSportsbook[] = [
    { id: 'draftkings', name: 'DraftKings', url: 'https://sportsbook.draftkings.com', active: true, type: 'betting' },
    { id: 'fanduel', name: 'FanDuel', url: 'https://sportsbook.fanduel.com', active: true, type: 'betting' },
    { id: 'betmgm', name: 'BetMGM', url: 'https://sports.betmgm.com', active: true, type: 'betting' }
  ];

  private constructor() {
    super();
    this.initializeStreams();
  }

  static getInstance(): StreamingService {
    if (!StreamingService.instance) {
      StreamingService.instance = new StreamingService();
    }
    return StreamingService.instance;
  }

  private initializeStreams() {
    console.log('📺 Initializing Streaming Service...');
    
    // Create initial active streams
    const initialStreams: ActiveStream[] = [
      {
        id: 'stream-nfl-1',
        name: 'NFL Sunday Night Football',
        sport: 'NFL',
        status: 'active',
        viewers: 15420,
        startTime: Date.now()
      },
      {
        id: 'stream-nba-1',
        name: 'NBA Lakers vs Warriors',
        sport: 'NBA',
        status: 'active',
        viewers: 8930,
        startTime: Date.now()
      }
    ];

    initialStreams.forEach(stream => {
      this.activeStreams.set(stream.id, stream);
    });

    console.log('✅ Streaming Service initialized');
  }

  getStreamingPartners(): StreamingPartner[] {
    return this.partners;
  }

  getActiveStreams(): ActiveStream[] {
    return Array.from(this.activeStreams.values());
  }

  getExternalSportsbooks(): ExternalSportsbook[] {
    return this.externalSportsbooks;
  }

  createStream(name: string, sport: string): string {
    const streamId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const stream: ActiveStream = {
      id: streamId,
      name,
      sport,
      status: 'active',
      viewers: 0,
      startTime: Date.now()
    };

    this.activeStreams.set(streamId, stream);
    this.emit('stream:created', stream);
    
    return streamId;
  }

  getStream(streamId: string): ActiveStream | undefined {
    return this.activeStreams.get(streamId);
  }

  updateStreamViewers(streamId: string, viewers: number): void {
    const stream = this.activeStreams.get(streamId);
    if (stream) {
      stream.viewers = viewers;
      this.emit('stream:updated', stream);
    }
  }

  endStream(streamId: string): void {
    const stream = this.activeStreams.get(streamId);
    if (stream) {
      stream.status = 'ended';
      this.emit('stream:ended', stream);
      this.activeStreams.delete(streamId);
    }
  }

  getStatus() {
    return {
      totalPartners: this.partners.length,
      activePartners: this.partners.filter(p => p.active).length,
      totalStreams: this.activeStreams.size,
      totalViewers: Array.from(this.activeStreams.values()).reduce((sum, s) => sum + s.viewers, 0),
      externalSportsbooks: this.externalSportsbooks.length,
      fccEntity: '20130314143016'
    };
  }
}

export const streamingService = StreamingService.getInstance();
