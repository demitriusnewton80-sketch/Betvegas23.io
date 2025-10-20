interface TeamColors {
  primary: string;
  secondary: string;
  accent: string;
}

interface TeamLogoConfig {
  league: string;
  teamName: string;
  colors: TeamColors;
  abbreviation: string;
}

class TeamLogoService {
  private teamConfigs: Map<string, TeamLogoConfig> = new Map();

  constructor() {
    this.initializeTeamConfigs();
  }

  private initializeTeamConfigs() {
    // NFL Teams
    this.addTeam('NFL', 'Kansas City Chiefs', { primary: '#E31837', secondary: '#FFB612', accent: '#000000' }, 'KC');
    this.addTeam('NFL', 'Buffalo Bills', { primary: '#00338D', secondary: '#C60C30', accent: '#FFFFFF' }, 'BUF');
    this.addTeam('NFL', 'San Francisco 49ers', { primary: '#AA0000', secondary: '#B3995D', accent: '#000000' }, 'SF');
    this.addTeam('NFL', 'Dallas Cowboys', { primary: '#041E42', secondary: '#869397', accent: '#FFFFFF' }, 'DAL');
    this.addTeam('NFL', 'Philadelphia Eagles', { primary: '#004C54', secondary: '#A5ACAF', accent: '#000000' }, 'PHI');
    this.addTeam('NFL', 'Miami Dolphins', { primary: '#008E97', secondary: '#FC4C02', accent: '#005778' }, 'MIA');
    this.addTeam('NFL', 'Baltimore Ravens', { primary: '#241773', secondary: '#000000', accent: '#9E7C0C' }, 'BAL');
    this.addTeam('NFL', 'Cincinnati Bengals', { primary: '#FB4F14', secondary: '#000000', accent: '#FFFFFF' }, 'CIN');

    // NBA Teams
    this.addTeam('NBA', 'Los Angeles Lakers', { primary: '#552583', secondary: '#FDB927', accent: '#000000' }, 'LAL');
    this.addTeam('NBA', 'Boston Celtics', { primary: '#007A33', secondary: '#BA9653', accent: '#FFFFFF' }, 'BOS');
    this.addTeam('NBA', 'Golden State Warriors', { primary: '#1D428A', secondary: '#FFC72C', accent: '#FFFFFF' }, 'GSW');
    this.addTeam('NBA', 'Milwaukee Bucks', { primary: '#00471B', secondary: '#EEE1C6', accent: '#0077C0' }, 'MIL');
    this.addTeam('NBA', 'Phoenix Suns', { primary: '#1D1160', secondary: '#E56020', accent: '#F9AD1B' }, 'PHX');
    this.addTeam('NBA', 'Brooklyn Nets', { primary: '#000000', secondary: '#FFFFFF', accent: '#777D84' }, 'BKN');
    this.addTeam('NBA', 'Denver Nuggets', { primary: '#0E2240', secondary: '#FEC524', accent: '#8B2131' }, 'DEN');
    this.addTeam('NBA', 'Miami Heat', { primary: '#98002E', secondary: '#F9A01B', accent: '#000000' }, 'MIA');

    // MLB Teams
    this.addTeam('MLB', 'New York Yankees', { primary: '#003087', secondary: '#E4002B', accent: '#FFFFFF' }, 'NYY');
    this.addTeam('MLB', 'Boston Red Sox', { primary: '#BD3039', secondary: '#0C2340', accent: '#FFFFFF' }, 'BOS');
    this.addTeam('MLB', 'Los Angeles Dodgers', { primary: '#005A9C', secondary: '#EF3E42', accent: '#FFFFFF' }, 'LAD');
    this.addTeam('MLB', 'San Francisco Giants', { primary: '#FD5A1E', secondary: '#27251F', accent: '#EFD19F' }, 'SF');
    this.addTeam('MLB', 'Houston Astros', { primary: '#002D62', secondary: '#EB6E1F', accent: '#F4911E' }, 'HOU');
    this.addTeam('MLB', 'Atlanta Braves', { primary: '#CE1141', secondary: '#13274F', accent: '#EAAA00' }, 'ATL');
    this.addTeam('MLB', 'Chicago Cubs', { primary: '#0E3386', secondary: '#CC3433', accent: '#FFFFFF' }, 'CHC');
    this.addTeam('MLB', 'St. Louis Cardinals', { primary: '#C41E3A', secondary: '#0C2340', accent: '#FEDB00' }, 'STL');

    // NHL Teams
    this.addTeam('NHL', 'Toronto Maple Leafs', { primary: '#003E7E', secondary: '#FFFFFF', accent: '#003E7E' }, 'TOR');
    this.addTeam('NHL', 'Montreal Canadiens', { primary: '#AF1E2D', secondary: '#192168', accent: '#FFFFFF' }, 'MTL');
    this.addTeam('NHL', 'Edmonton Oilers', { primary: '#041E42', secondary: '#FF4C00', accent: '#FFFFFF' }, 'EDM');
    this.addTeam('NHL', 'Colorado Avalanche', { primary: '#6F263D', secondary: '#236192', accent: '#A2AAAD' }, 'COL');
    this.addTeam('NHL', 'Tampa Bay Lightning', { primary: '#002868', secondary: '#FFFFFF', accent: '#000000' }, 'TBL');
    this.addTeam('NHL', 'Boston Bruins', { primary: '#FFB81C', secondary: '#000000', accent: '#FFFFFF' }, 'BOS');
    this.addTeam('NHL', 'New York Rangers', { primary: '#0038A8', secondary: '#CE1126', accent: '#FFFFFF' }, 'NYR');
    this.addTeam('NHL', 'Vegas Golden Knights', { primary: '#B4975A', secondary: '#333F42', accent: '#C8102E' }, 'VGK');
  }

  private addTeam(league: string, teamName: string, colors: TeamColors, abbreviation: string) {
    this.teamConfigs.set(`${league.toLowerCase()}-${teamName}`, {
      league,
      teamName,
      colors,
      abbreviation
    });
  }

  generateLogoSVG(league: string, teamName: string): string {
    const config = this.teamConfigs.get(`${league.toLowerCase()}-${teamName}`);

    if (!config) {
      return this.generateDefaultLogo(league, teamName);
    }

    const { colors, abbreviation } = config;

    // Use player23.ag logo URL with fallback
    const player23LogoUrl = this.getPlayer23LogoUrl(league, teamName);

    // Generate SVG logo with player23.ag image and team colors
    return `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad-${abbreviation}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
          </linearGradient>
          <filter id="shadow-${abbreviation}">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
          </filter>
        </defs>

        <!-- Shield/Circle Background -->
        <circle cx="100" cy="100" r="90" fill="url(#grad-${abbreviation})" filter="url(#shadow-${abbreviation})"/>
        <circle cx="100" cy="100" r="85" fill="none" stroke="${colors.accent}" stroke-width="3"/>

        <!-- Team Logo from player23.ag -->
        <image href="${player23LogoUrl}" x="50" y="50" width="100" height="100" 
               onerror="this.style.display='none'"/>

        <!-- Fallback Team Abbreviation -->
        <text x="100" y="120" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
              text-anchor="middle" fill="${colors.accent}" 
              stroke="${colors.primary === '#FFFFFF' ? '#000000' : '#FFFFFF'}" 
              stroke-width="1" class="fallback-text">
          ${abbreviation}
        </text>

        <!-- League Badge -->
        <rect x="70" y="155" width="60" height="20" rx="10" fill="${colors.accent}" opacity="0.9"/>
        <text x="100" y="169" font-family="Arial, sans-serif" font-size="12" font-weight="bold" 
              text-anchor="middle" fill="${colors.primary}">
          ${league}
        </text>

        <!-- FCC Watermark -->
        <text x="100" y="190" font-family="Arial, sans-serif" font-size="8" 
              text-anchor="middle" fill="${colors.accent}" opacity="0.6">
          Young Meeat LLC • player23.ag
        </text>
      </svg>
    `.trim();
  }

  private getPlayer23LogoUrl(league: string, teamName: string): string {
    // Generate player23.ag logo URL
    const sanitizedTeam = teamName.toLowerCase().replace(/\s+/g, '-');
    const leaguePath = league.toLowerCase();
    return `https://player23.ag/assets/logos/${leaguePath}/${sanitizedTeam}.png`;
  }

  private generateDefaultLogo(league: string, teamName: string): string {
    const initial = teamName.charAt(0);
    return `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="90" fill="#374151"/>
        <circle cx="100" cy="100" r="85" fill="none" stroke="#9CA3AF" stroke-width="3"/>
        <text x="100" y="120" font-family="Arial, sans-serif" font-size="60" font-weight="bold" 
              text-anchor="middle" fill="#FFFFFF">
          ${initial}
        </text>
        <text x="100" y="165" font-family="Arial, sans-serif" font-size="12" 
              text-anchor="middle" fill="#9CA3AF">
          ${league}
        </text>
      </svg>
    `.trim();
  }

  getTeamConfig(league: string, teamName: string): TeamLogoConfig | undefined {
    return this.teamConfigs.get(`${league.toLowerCase()}-${teamName}`);
  }

  getAllTeamConfigs(): TeamLogoConfig[] {
    return Array.from(this.teamConfigs.values());
  }
}

export const teamLogoService = new TeamLogoService();