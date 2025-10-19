
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

  constructor() {
    super();
    this.initializeTeamLogos();
    this.initializeRadioStreams();
    this.startLiveUpdates();
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
    // NFL Live Radio Streams
    this.addRadioStream({
      id: 'nfl-radio-1',
      league: 'NFL',
      gameId: 'nfl-live-1',
      homeTeam: 'Kansas City Chiefs',
      awayTeam: 'Buffalo Bills',
      homeTeamLogo: this.getTeamLogo('NFL', 'Kansas City Chiefs'),
      awayTeamLogo: this.getTeamLogo('NFL', 'Buffalo Bills'),
      streamUrl: 'https://www.iheart.com/live/espn-radio-3959/',
      fallbackUrls: [
        'https://tunein.com/radio/ESPN-Radio-s20368/',
        'https://www.audacy.com/stations/sports'
      ],
      status: 'live',
      listeners: Math.floor(Math.random() * 50000) + 10000,
      quality: 'high'
    });

    // NBA Live Radio Streams
    this.addRadioStream({
      id: 'nba-radio-1',
      league: 'NBA',
      gameId: 'nba-live-1',
      homeTeam: 'Los Angeles Lakers',
      awayTeam: 'Boston Celtics',
      homeTeamLogo: this.getTeamLogo('NBA', 'Los Angeles Lakers'),
      awayTeamLogo: this.getTeamLogo('NBA', 'Boston Celtics'),
      streamUrl: 'https://www.nba.com/watch',
      fallbackUrls: [
        'https://tunein.com/radio/NBA-Radio-s231160/',
        'https://www.iheart.com/live/nba-radio/'
      ],
      status: 'live',
      listeners: Math.floor(Math.random() * 40000) + 8000,
      quality: 'high'
    });

    // MLB Live Radio Streams
    this.addRadioStream({
      id: 'mlb-radio-1',
      league: 'MLB',
      gameId: 'mlb-live-1',
      homeTeam: 'New York Yankees',
      awayTeam: 'Boston Red Sox',
      homeTeamLogo: this.getTeamLogo('MLB', 'New York Yankees'),
      awayTeamLogo: this.getTeamLogo('MLB', 'Boston Red Sox'),
      streamUrl: 'https://www.mlb.com/live-stream-games/subscribe',
      fallbackUrls: [
        'https://tunein.com/radio/MLB-Network-Radio-s230237/',
        'https://www.iheart.com/live/mlb-network-radio/'
      ],
      status: 'live',
      listeners: Math.floor(Math.random() * 30000) + 5000,
      quality: 'high'
    });

    // NHL Live Radio Streams
    this.addRadioStream({
      id: 'nhl-radio-1',
      league: 'NHL',
      gameId: 'nhl-live-1',
      homeTeam: 'Toronto Maple Leafs',
      awayTeam: 'Montreal Canadiens',
      homeTeamLogo: this.getTeamLogo('NHL', 'Toronto Maple Leafs'),
      awayTeamLogo: this.getTeamLogo('NHL', 'Montreal Canadiens'),
      streamUrl: 'https://www.nhl.com/tv',
      fallbackUrls: [
        'https://tunein.com/radio/NHL-Radio-s231161/',
        'https://www.siriusxm.com/channels/nhl-network-radio'
      ],
      status: 'live',
      listeners: Math.floor(Math.random() * 25000) + 4000,
      quality: 'high'
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
