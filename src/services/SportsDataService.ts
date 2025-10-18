
import { EventEmitter } from 'events';

interface MoneyLineOdds {
  home: number;
  away: number;
  draw?: number;
}

interface SportEvent {
  id: string;
  sport: 'NFL' | 'NBA' | 'MLB' | 'NHL' | 'Boxing';
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: 'upcoming' | 'live' | 'completed';
  moneyLine: MoneyLineOdds;
  radioLink?: string;
}

class SportsDataService extends EventEmitter {
  private events: Map<string, SportEvent> = new Map();

  constructor() {
    super();
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    // NFL Events
    this.addEvent({
      id: 'nfl-1',
      sport: 'NFL',
      homeTeam: 'Kansas City Chiefs',
      awayTeam: 'Buffalo Bills',
      startTime: new Date(Date.now() + 86400000).toISOString(),
      status: 'upcoming',
      moneyLine: { home: -150, away: +130 },
      radioLink: 'https://www.iheart.com/live/espn-radio-3959/'
    });

    this.addEvent({
      id: 'nfl-2',
      sport: 'NFL',
      homeTeam: 'San Francisco 49ers',
      awayTeam: 'Dallas Cowboys',
      startTime: new Date(Date.now() + 172800000).toISOString(),
      status: 'upcoming',
      moneyLine: { home: -110, away: -110 },
      radioLink: 'https://tunein.com/radio/ESPN-Radio-s20368/'
    });

    // NBA Events
    this.addEvent({
      id: 'nba-1',
      sport: 'NBA',
      homeTeam: 'Los Angeles Lakers',
      awayTeam: 'Boston Celtics',
      startTime: new Date(Date.now() + 43200000).toISOString(),
      status: 'upcoming',
      moneyLine: { home: +120, away: -140 },
      radioLink: 'https://www.nba.com/live'
    });

    this.addEvent({
      id: 'nba-2',
      sport: 'NBA',
      homeTeam: 'Golden State Warriors',
      awayTeam: 'Milwaukee Bucks',
      startTime: new Date(Date.now() + 129600000).toISOString(),
      status: 'upcoming',
      moneyLine: { home: -105, away: -115 },
      radioLink: 'https://www.nba.com/watch'
    });

    // MLB Events
    this.addEvent({
      id: 'mlb-1',
      sport: 'MLB',
      homeTeam: 'New York Yankees',
      awayTeam: 'Boston Red Sox',
      startTime: new Date(Date.now() + 259200000).toISOString(),
      status: 'upcoming',
      moneyLine: { home: -130, away: +110 },
      radioLink: 'https://www.mlb.com/tv'
    });

    this.addEvent({
      id: 'mlb-2',
      sport: 'MLB',
      homeTeam: 'Los Angeles Dodgers',
      awayTeam: 'San Francisco Giants',
      startTime: new Date(Date.now() + 345600000).toISOString(),
      status: 'upcoming',
      moneyLine: { home: -145, away: +125 },
      radioLink: 'https://www.mlb.com/tv'
    });

    // NHL Events
    this.addEvent({
      id: 'nhl-1',
      sport: 'NHL',
      homeTeam: 'Toronto Maple Leafs',
      awayTeam: 'Montreal Canadiens',
      startTime: new Date(Date.now() + 21600000).toISOString(),
      status: 'live',
      moneyLine: { home: -125, away: +105 },
      radioLink: 'https://www.nhl.com/tv'
    });

    this.addEvent({
      id: 'nhl-2',
      sport: 'NHL',
      homeTeam: 'Edmonton Oilers',
      awayTeam: 'Calgary Flames',
      startTime: new Date(Date.now() + 108000000).toISOString(),
      status: 'upcoming',
      moneyLine: { home: -110, away: -110 },
      radioLink: 'https://www.nhl.com/live'
    });

    // Boxing Events
    this.addEvent({
      id: 'box-1',
      sport: 'Boxing',
      homeTeam: 'Tyson Fury',
      awayTeam: 'Oleksandr Usyk',
      startTime: new Date(Date.now() + 604800000).toISOString(),
      status: 'upcoming',
      moneyLine: { home: -200, away: +170 },
      radioLink: 'https://www.espn.com/boxing/live'
    });

    this.addEvent({
      id: 'box-2',
      sport: 'Boxing',
      homeTeam: 'Canelo Alvarez',
      awayTeam: 'Dmitry Bivol',
      startTime: new Date(Date.now() + 1209600000).toISOString(),
      status: 'upcoming',
      moneyLine: { home: -180, away: +150 },
      radioLink: 'https://www.espn.com/boxing/live'
    });
  }

  private addEvent(event: SportEvent): void {
    this.events.set(event.id, event);
  }

  getAllEvents(): SportEvent[] {
    return Array.from(this.events.values());
  }

  getEventsBySport(sport: string): SportEvent[] {
    if (sport === 'all') {
      return this.getAllEvents();
    }
    return Array.from(this.events.values()).filter(e => e.sport === sport);
  }

  getEvent(eventId: string): SportEvent | undefined {
    return this.events.get(eventId);
  }

  updateMoneyLine(eventId: string, moneyLine: MoneyLineOdds): boolean {
    const event = this.events.get(eventId);
    if (event) {
      event.moneyLine = moneyLine;
      this.emit('moneyLineUpdate', { eventId, moneyLine });
      return true;
    }
    return false;
  }

  getRadioLink(eventId: string): string | undefined {
    const event = this.events.get(eventId);
    return event?.radioLink;
  }
}

export const sportsDataService = new SportsDataService();
