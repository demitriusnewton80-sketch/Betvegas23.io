
import { EventEmitter } from 'events';

export interface RadioStream {
  id: string;
  league: 'MLB' | 'NBA' | 'NHL' | 'NFL';
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  streamUrl: string;
  fallbackUrls: string[];
  status: 'live' | 'upcoming' | 'ended';
  listeners: number;
  quality: 'high' | 'medium' | 'low';
}

export interface TeamLogo {
  teamName: string;
  league: string;
  logoUrl: string;
  protected: boolean;
  watermark: string;
}

class SportsRadioService extends EventEmitter {
  private radioStreams: Map<string, RadioStream> = new Map();
  private teamLogos: Map<string, TeamLogo> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  private linkHealth: Map<string, boolean> = new Map();
  private backupStreams: Map<string, RadioStream> = new Map();

  constructor() {
    super();
    this.initializeTeamLogos();
    this.initializeRadioStreams();
    this.startLiveUpdates();
    this.startLinkHealthCheck();
  }

  private startLinkHealthCheck() {
    setInterval(() => {
      this.radioStreams.forEach((stream, id) => {
        try {
          new URL(stream.streamUrl);
          this.linkHealth.set(id, true);
        } catch {
          this.linkHealth.set(id, false);
          console.warn(`Broken link detected: ${stream.streamUrl}`);
        }
      });
    }, 60000); // Check every minute
  }

  createBackup() {
    this.backupStreams.clear();
    this.radioStreams.forEach((stream, id) => {
      this.backupStreams.set(id, { ...stream });
    });
  }

  rollbackStreams() {
    if (this.backupStreams.size > 0) {
      this.radioStreams.clear();
      this.backupStreams.forEach((stream, id) => {
        this.radioStreams.set(id, { ...stream });
      });
      return true;
    }
    return false;
  }

  validateAllLinks(): { valid: string[]; broken: string[] } {
    const valid: string[] = [];
    const broken: string[] = [];
    
    this.radioStreams.forEach(stream => {
      try {
        new URL(stream.streamUrl);
        valid.push(stream.streamUrl);
      } catch {
        broken.push(stream.streamUrl);
      }
    });
    
    return { valid, broken };
  }

  getMicrosoftHealthStatus() {
    const streams = Array.from(this.radioStreams.values());
    const links = this.validateAllLinks();
    
    return {
      totalStreams: streams.length,
      liveStreams: streams.filter(s => s.status === 'live').length,
      validLinks: links.valid.length,
      brokenLinks: links.broken.length,
      healthPercentage: Math.round((links.valid.length / streams.length) * 100)
    };
  }

  private initializeTeamLogos() {
    // NFL Team Logos
    const nflTeams = [
      'Kansas City Chiefs', 'Buffalo Bills', 'San Francisco 49ers', 'Dallas Cowboys',
      'Philadelphia Eagles', 'Miami Dolphins', 'Baltimore Ravens', 'Cincinnati Bengals'
    ];
    nflTeams.forEach(team => {
      this.teamLogos.set(`nfl-${team}`, {
        teamName: team,
        league: 'NFL',
        logoUrl: `/api/sports-radio/logo/nfl/${encodeURIComponent(team)}`,
        protected: true,
        watermark: 'Young Meeat LLC - FCC 20130314143016'
      });
    });

    // NBA Team Logos
    const nbaTeams = [
      'Los Angeles Lakers', 'Boston Celtics', 'Golden State Warriors', 'Milwaukee Bucks',
      'Phoenix Suns', 'Brooklyn Nets', 'Denver Nuggets', 'Miami Heat'
    ];
    nbaTeams.forEach(team => {
      this.teamLogos.set(`nba-${team}`, {
        teamName: team,
        league: 'NBA',
        logoUrl: `/api/sports-radio/logo/nba/${encodeURIComponent(team)}`,
        protected: true,
        watermark: 'Young Meeat LLC - FCC 20130314143016'
      });
    });

    // MLB Team Logos
    const mlbTeams = [
      'New York Yankees', 'Boston Red Sox', 'Los Angeles Dodgers', 'San Francisco Giants',
      'Houston Astros', 'Atlanta Braves', 'Chicago Cubs', 'St. Louis Cardinals'
    ];
    mlbTeams.forEach(team => {
      this.teamLogos.set(`mlb-${team}`, {
        teamName: team,
        league: 'MLB',
        logoUrl: `/api/sports-radio/logo/mlb/${encodeURIComponent(team)}`,
        protected: true,
        watermark: 'Young Meeat LLC - FCC 20130314143016'
      });
    });

    // NHL Team Logos
    const nhlTeams = [
      'Toronto Maple Leafs', 'Montreal Canadiens', 'Edmonton Oilers', 'Colorado Avalanche',
      'Tampa Bay Lightning', 'Boston Bruins', 'New York Rangers', 'Vegas Golden Knights'
    ];
    nhlTeams.forEach(team => {
      this.teamLogos.set(`nhl-${team}`, {
        teamName: team,
        league: 'NHL',
        logoUrl: `/api/sports-radio/logo/nhl/${encodeURIComponent(team)}`,
        protected: true,
        watermark: 'Young Meeat LLC - FCC 20130314143016'
      });
    });
  }

  private initializeRadioStreams() {
    const nflGames = [
      { home: 'Kansas City Chiefs', away: 'Buffalo Bills' },
      { home: 'San Francisco 49ers', away: 'Dallas Cowboys' },
      { home: 'Philadelphia Eagles', away: 'Miami Dolphins' },
      { home: 'Baltimore Ravens', away: 'Cincinnati Bengals' }
    ];

    const nbaGames = [
      { home: 'Los Angeles Lakers', away: 'Boston Celtics' },
      { home: 'Golden State Warriors', away: 'Milwaukee Bucks' },
      { home: 'Phoenix Suns', away: 'Brooklyn Nets' },
      { home: 'Denver Nuggets', away: 'Miami Heat' }
    ];

    const mlbGames = [
      { home: 'New York Yankees', away: 'Boston Red Sox' },
      { home: 'Los Angeles Dodgers', away: 'San Francisco Giants' },
      { home: 'Houston Astros', away: 'Atlanta Braves' },
      { home: 'Chicago Cubs', away: 'St. Louis Cardinals' }
    ];

    const nhlGames = [
      { home: 'Toronto Maple Leafs', away: 'Montreal Canadiens' },
      { home: 'Edmonton Oilers', away: 'Colorado Avalanche' },
      { home: 'Tampa Bay Lightning', away: 'Boston Bruins' },
      { home: 'New York Rangers', away: 'Vegas Golden Knights' }
    ];

    // NFL Live Streams
    nflGames.forEach((game, index) => {
      this.addRadioStream({
        id: `nfl-radio-${index + 1}`,
        league: 'NFL',
        gameId: `nfl-live-${index + 1}`,
        homeTeam: game.home,
        awayTeam: game.away,
        homeTeamLogo: this.getTeamLogo('NFL', game.home),
        awayTeamLogo: this.getTeamLogo('NFL', game.away),
        streamUrl: 'https://www.iheart.com/live/espn-radio-3959/',
        fallbackUrls: [
          'https://tunein.com/radio/ESPN-Radio-s20368/',
          'https://www.audacy.com/stations/sports',
          'https://player.radio.com/listen/station/nfl-live'
        ],
        status: 'live',
        listeners: Math.floor(Math.random() * 50000) + 10000,
        quality: 'high'
      });
    });

    // NBA Live Streams
    nbaGames.forEach((game, index) => {
      this.addRadioStream({
        id: `nba-radio-${index + 1}`,
        league: 'NBA',
        gameId: `nba-live-${index + 1}`,
        homeTeam: game.home,
        awayTeam: game.away,
        homeTeamLogo: this.getTeamLogo('NBA', game.home),
        awayTeamLogo: this.getTeamLogo('NBA', game.away),
        streamUrl: 'https://www.nba.com/watch',
        fallbackUrls: [
          'https://tunein.com/radio/NBA-Radio-s231160/',
          'https://www.iheart.com/live/nba-radio/',
          'https://www.siriusxm.com/channels/nba-radio'
        ],
        status: 'live',
        listeners: Math.floor(Math.random() * 40000) + 8000,
        quality: 'high'
      });
    });

    // MLB Live Streams
    mlbGames.forEach((game, index) => {
      this.addRadioStream({
        id: `mlb-radio-${index + 1}`,
        league: 'MLB',
        gameId: `mlb-live-${index + 1}`,
        homeTeam: game.home,
        awayTeam: game.away,
        homeTeamLogo: this.getTeamLogo('MLB', game.home),
        awayTeamLogo: this.getTeamLogo('MLB', game.away),
        streamUrl: 'https://www.mlb.com/live-stream-games/subscribe',
        fallbackUrls: [
          'https://tunein.com/radio/MLB-Network-Radio-s230237/',
          'https://www.iheart.com/live/mlb-network-radio/',
          'https://www.siriusxm.com/channels/mlb-network-radio'
        ],
        status: 'live',
        listeners: Math.floor(Math.random() * 30000) + 5000,
        quality: 'high'
      });
    });

    // NHL Live Streams
    nhlGames.forEach((game, index) => {
      this.addRadioStream({
        id: `nhl-radio-${index + 1}`,
        league: 'NHL',
        gameId: `nhl-live-${index + 1}`,
        homeTeam: game.home,
        awayTeam: game.away,
        homeTeamLogo: this.getTeamLogo('NHL', game.home),
        awayTeamLogo: this.getTeamLogo('NHL', game.away),
        streamUrl: 'https://www.nhl.com/tv',
        fallbackUrls: [
          'https://tunein.com/radio/NHL-Radio-s231161/',
          'https://www.siriusxm.com/channels/nhl-network-radio',
          'https://www.iheart.com/live/nhl-network-radio/'
        ],
        status: 'live',
        listeners: Math.floor(Math.random() * 25000) + 4000,
        quality: 'high'
      });
    });
  }

  private addRadioStream(stream: RadioStream) {
    this.radioStreams.set(stream.id, stream);
  }

  private getTeamLogo(league: string, teamName: string): string {
    const logo = this.teamLogos.get(`${league.toLowerCase()}-${teamName}`);
    return logo ? logo.logoUrl : '/api/sports-radio/logo/default';
  }

  private startLiveUpdates() {
    this.updateInterval = setInterval(() => {
      this.radioStreams.forEach((stream, id) => {
        if (stream.status === 'live') {
          // Update listener count
          stream.listeners += Math.floor(Math.random() * 1000) - 500;
          stream.listeners = Math.max(1000, stream.listeners);

          this.emit('radioUpdate', {
            streamId: id,
            stream,
            timestamp: new Date().toISOString()
          });
        }
      });
    }, 15000);
  }

  getAllRadioStreams(): RadioStream[] {
    return Array.from(this.radioStreams.values());
  }

  getLiveRadioStreams(): RadioStream[] {
    return Array.from(this.radioStreams.values()).filter(s => s.status === 'live');
  }

  getRadioStreamsByLeague(league: string): RadioStream[] {
    return Array.from(this.radioStreams.values()).filter(s => s.league === league.toUpperCase());
  }

  getRadioStream(streamId: string): RadioStream | undefined {
    return this.radioStreams.get(streamId);
  }

  getTeamLogoInfo(league: string, teamName: string): TeamLogo | undefined {
    return this.teamLogos.get(`${league.toLowerCase()}-${teamName}`);
  }

  getAllProtectedLogos(): TeamLogo[] {
    return Array.from(this.teamLogos.values());
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

export const sportsRadioService = new SportsRadioService();
