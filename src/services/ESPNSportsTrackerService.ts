
import { EventEmitter } from 'events';

export interface TeamSchedule {
  teamId: string;
  teamName: string;
  league: 'NFL' | 'NBA' | 'MLB' | 'NHL' | 'Soccer';
  upcomingGames: ScheduledGame[];
  recentResults: GameResult[];
}

export interface ScheduledGame {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  scheduledStartTime: string;
  actualStartTime?: string;
  estimatedEndTime?: string;
  venue: string;
  status: 'scheduled' | 'live' | 'final' | 'postponed';
  score?: {
    home: number;
    away: number;
  };
  quarter?: string;
  timeRemaining?: string;
}

export interface GameResult {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  finalScore: {
    home: number;
    away: number;
  };
  completedAt: string;
}

export interface SportsNews {
  id: string;
  headline: string;
  summary: string;
  league: string;
  timestamp: string;
  category: 'breaking' | 'injury' | 'trade' | 'game-recap' | 'general';
}

class ESPNSportsTrackerService extends EventEmitter {
  private liveGames: Map<string, ScheduledGame> = new Map();
  private teamSchedules: Map<string, TeamSchedule> = new Map();
  private newsFeeds: SportsNews[] = [];
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializeSportsData();
    this.startLiveUpdates();
  }

  private initializeSportsData() {
    // NFL Games
    this.addLiveGame({
      gameId: 'nfl-live-1',
      homeTeam: 'Kansas City Chiefs',
      awayTeam: 'Buffalo Bills',
      league: 'NFL',
      scheduledStartTime: new Date(Date.now() - 3600000).toISOString(),
      actualStartTime: new Date(Date.now() - 3600000).toISOString(),
      estimatedEndTime: new Date(Date.now() + 7200000).toISOString(),
      venue: 'Arrowhead Stadium',
      status: 'live',
      score: { home: 21, away: 17 },
      quarter: 'Q3',
      timeRemaining: '8:45'
    });

    this.addLiveGame({
      gameId: 'nfl-upcoming-1',
      homeTeam: 'San Francisco 49ers',
      awayTeam: 'Dallas Cowboys',
      league: 'NFL',
      scheduledStartTime: new Date(Date.now() + 7200000).toISOString(),
      venue: 'Levi\'s Stadium',
      status: 'scheduled'
    });

    // NBA Games
    this.addLiveGame({
      gameId: 'nba-live-1',
      homeTeam: 'Los Angeles Lakers',
      awayTeam: 'Boston Celtics',
      league: 'NBA',
      scheduledStartTime: new Date(Date.now() - 1800000).toISOString(),
      actualStartTime: new Date(Date.now() - 1800000).toISOString(),
      estimatedEndTime: new Date(Date.now() + 5400000).toISOString(),
      venue: 'Crypto.com Arena',
      status: 'live',
      score: { home: 89, away: 85 },
      quarter: '3rd',
      timeRemaining: '5:23'
    });

    // MLB Games
    this.addLiveGame({
      gameId: 'mlb-live-1',
      homeTeam: 'New York Yankees',
      awayTeam: 'Boston Red Sox',
      league: 'MLB',
      scheduledStartTime: new Date(Date.now() - 7200000).toISOString(),
      actualStartTime: new Date(Date.now() - 7200000).toISOString(),
      estimatedEndTime: new Date(Date.now() + 3600000).toISOString(),
      venue: 'Yankee Stadium',
      status: 'live',
      score: { home: 4, away: 3 },
      quarter: 'Top 7th',
      timeRemaining: '2 outs'
    });

    // NHL Games
    this.addLiveGame({
      gameId: 'nhl-upcoming-1',
      homeTeam: 'Toronto Maple Leafs',
      awayTeam: 'Montreal Canadiens',
      league: 'NHL',
      scheduledStartTime: new Date(Date.now() + 10800000).toISOString(),
      venue: 'Scotiabank Arena',
      status: 'scheduled'
    });

    // Add news items
    this.addNewsItem({
      id: 'news-1',
      headline: 'Chiefs QB Patrick Mahomes leads comeback victory',
      summary: 'Mahomes throws 3 TDs in second half rally',
      league: 'NFL',
      timestamp: new Date().toISOString(),
      category: 'breaking'
    });

    this.addNewsItem({
      id: 'news-2',
      headline: 'Lakers star questionable for tonight\'s game',
      summary: 'Ankle injury may sideline key player',
      league: 'NBA',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      category: 'injury'
    });

    this.addNewsItem({
      id: 'news-3',
      headline: 'Yankees complete sweep of Red Sox',
      summary: 'Bronx Bombers extend division lead',
      league: 'MLB',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      category: 'game-recap'
    });
  }

  private addLiveGame(game: ScheduledGame) {
    this.liveGames.set(game.gameId, game);
  }

  private addNewsItem(news: SportsNews) {
    this.newsFeeds.unshift(news);
    if (this.newsFeeds.length > 50) {
      this.newsFeeds = this.newsFeeds.slice(0, 50);
    }
  }

  private startLiveUpdates() {
    // Update scores and times every 10 seconds
    this.updateInterval = setInterval(() => {
      this.liveGames.forEach((game, gameId) => {
        if (game.status === 'live' && game.score) {
          // Simulate score updates
          if (Math.random() > 0.8) {
            const homeOrAway = Math.random() > 0.5 ? 'home' : 'away';
            game.score[homeOrAway] += Math.floor(Math.random() * 7) + 1;
            
            this.emit('scoreUpdate', {
              gameId,
              game,
              timestamp: new Date().toISOString()
            });
          }

          // Update time remaining
          if (game.timeRemaining && game.timeRemaining.includes(':')) {
            const [minutes, seconds] = game.timeRemaining.split(':').map(Number);
            let newSeconds = seconds - 10;
            let newMinutes = minutes;
            
            if (newSeconds < 0) {
              newSeconds = 59;
              newMinutes -= 1;
            }
            
            if (newMinutes >= 0) {
              game.timeRemaining = `${newMinutes}:${newSeconds.toString().padStart(2, '0')}`;
            }
          }
        }
      });
    }, 10000);
  }

  getAllLiveGames(): ScheduledGame[] {
    return Array.from(this.liveGames.values());
  }

  getLiveGamesByLeague(league: string): ScheduledGame[] {
    return Array.from(this.liveGames.values()).filter(g => g.league === league);
  }

  getUpcomingGames(limit: number = 10): ScheduledGame[] {
    return Array.from(this.liveGames.values())
      .filter(g => g.status === 'scheduled')
      .sort((a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime())
      .slice(0, limit);
  }

  getCurrentLiveGames(): ScheduledGame[] {
    return Array.from(this.liveGames.values()).filter(g => g.status === 'live');
  }

  getRecentNews(limit: number = 10): SportsNews[] {
    return this.newsFeeds.slice(0, limit);
  }

  getNewsByLeague(league: string, limit: number = 10): SportsNews[] {
    return this.newsFeeds.filter(n => n.league === league).slice(0, limit);
  }

  getGame(gameId: string): ScheduledGame | undefined {
    return this.liveGames.get(gameId);
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

export const espnTrackerService = new ESPNSportsTrackerService();
