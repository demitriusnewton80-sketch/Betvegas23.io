
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

class StreamingService extends EventEmitter {
  private activeStreams: Map<string, NodeJS.Timeout> = new Map();

  startGameStream(gameId: string): void {
    if (this.activeStreams.has(gameId)) {
      return;
    }

    // Simulate live game updates every 5 seconds
    const interval = setInterval(() => {
      const update: LiveGameUpdate = {
        gameId,
        score: {
          home: Math.floor(Math.random() * 50),
          away: Math.floor(Math.random() * 50)
        },
        quarter: `Q${Math.floor(Math.random() * 4) + 1}`,
        timeRemaining: `${Math.floor(Math.random() * 12)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
        lastPlay: this.generateRandomPlay(),
        timestamp: new Date().toISOString()
      };

      this.emit('gameUpdate', update);
    }, 5000);

    this.activeStreams.set(gameId, interval);
  }

  stopGameStream(gameId: string): void {
    const interval = this.activeStreams.get(gameId);
    if (interval) {
      clearInterval(interval);
      this.activeStreams.delete(gameId);
    }
  }

  private generateRandomPlay(): string {
    const plays = [
      'Touchdown!',
      'Field Goal',
      '3-pointer!',
      'Turnover',
      'Penalty',
      'Interception',
      'Fumble recovered',
      'Basket made',
      'Free throw',
      'Goal scored!'
    ];
    return plays[Math.floor(Math.random() * plays.length)];
  }

  stopAllStreams(): void {
    this.activeStreams.forEach((interval) => clearInterval(interval));
    this.activeStreams.clear();
  }
}

export const streamingService = new StreamingService();
