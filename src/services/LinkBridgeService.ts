
import { EventEmitter } from 'events';

interface RouteMapping {
  frontend: string;
  backend: string;
  method: string;
  active: boolean;
}

class LinkBridgeService extends EventEmitter {
  private routeMappings: Map<string, RouteMapping> = new Map();
  private brokenLinks: Set<string> = new Set();

  constructor() {
    super();
    this.initializeRouteMappings();
  }

  private initializeRouteMappings() {
    // Core routes
    this.addRoute('/health', '/health', 'GET');
    this.addRoute('/api', '/api', 'GET');
    
    // Sportsbook routes
    this.addRoute('/sportsbook/games', '/sportsbook/games', 'GET');
    this.addRoute('/sportsbook/bet', '/sportsbook/bet', 'POST');
    
    // Streaming routes
    this.addRoute('/streaming/partners', '/streaming/partners', 'GET');
    this.addRoute('/streaming/wifi-hub/status', '/streaming/wifi-hub/status', 'GET');
    this.addRoute('/streaming/radio/:gameId', '/streaming/radio/:gameId', 'GET');
    
    // Sports Radio routes
    this.addRoute('/sports-radio/live', '/sports-radio/live', 'GET');
    this.addRoute('/sports-radio/streams', '/sports-radio/streams', 'GET');
    this.addRoute('/sports-radio/logo/:league/:teamName', '/sports-radio/logo/:league/:teamName', 'GET');
    
    // PS5 routes
    this.addRoute('/ps5/games', '/ps5/games', 'GET');
    this.addRoute('/ps5/plugin/status', '/ps5/plugin/status', 'GET');
    
    // Web3 routes
    this.addRoute('/web3/status', '/web3/status', 'GET');
    
    // VPN routes
    this.addRoute('/vpn/status', '/vpn/status', 'GET');
    
    // Auth routes
    this.addRoute('/auth/login', '/auth/login', 'GET');
    this.addRoute('/auth/status', '/auth/status', 'GET');
    
    // SSO Plugin routes
    this.addRoute('/sso-plugin/plugins', '/sso-plugin/plugins', 'GET');
    
    // SAM.gov routes
    this.addRoute('/sam/entity/young-meeat-llc', '/sam/entity/young-meeat-llc', 'GET');
    
    // Backup routes
    this.addRoute('/backup/status', '/backup/status', 'GET');
    
    // Phone control routes
    this.addRoute('/phone-control/stats', '/phone-control/stats', 'GET');
    
    // Core status routes
    this.addRoute('/api/core/status', '/api/core/status', 'GET');
    this.addRoute('/domain/status', '/domain/status', 'GET');
  }

  private addRoute(frontend: string, backend: string, method: string) {
    this.routeMappings.set(frontend, {
      frontend,
      backend,
      method,
      active: true
    });
  }

  getRouteMapping(path: string): RouteMapping | undefined {
    return this.routeMappings.get(path);
  }

  getAllRouteMappings(): RouteMapping[] {
    return Array.from(this.routeMappings.values());
  }

  reportBrokenLink(link: string): void {
    this.brokenLinks.add(link);
    this.emit('brokenLink', { link, timestamp: new Date().toISOString() });
  }

  getBrokenLinks(): string[] {
    return Array.from(this.brokenLinks);
  }

  validateRoutes(): { valid: string[]; broken: string[] } {
    const valid: string[] = [];
    const broken: string[] = [];

    this.routeMappings.forEach((route, path) => {
      if (route.active) {
        valid.push(path);
      } else {
        broken.push(path);
      }
    });

    return { valid, broken };
  }

  healthCheck(): {
    totalRoutes: number;
    activeRoutes: number;
    brokenLinks: number;
    status: string;
  } {
    const total = this.routeMappings.size;
    const active = Array.from(this.routeMappings.values()).filter(r => r.active).length;
    
    return {
      totalRoutes: total,
      activeRoutes: active,
      brokenLinks: this.brokenLinks.size,
      status: active === total ? 'healthy' : 'degraded'
    };
  }
}

export const linkBridgeService = new LinkBridgeService();
