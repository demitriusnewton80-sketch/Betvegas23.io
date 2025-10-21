
import { EventEmitter } from 'events';

interface CookieIntel {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: Date;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  isBadIntel: boolean;
  reason?: string;
}

export class CookieSanitizer extends EventEmitter {
  private static instance: CookieSanitizer;
  private badIntelPatterns: RegExp[] = [];
  private sanitizedCookies: Map<string, CookieIntel> = new Map();
  private blockedCookies: Set<string> = new Set();

  private constructor() {
    super();
    this.initializeSanitizer();
  }

  static getInstance(): CookieSanitizer {
    if (!CookieSanitizer.instance) {
      CookieSanitizer.instance = new CookieSanitizer();
    }
    return CookieSanitizer.instance;
  }

  private initializeSanitizer() {
    console.log('🧹 Initializing Cookie Sanitizer...');

    // Define patterns for bad intel
    this.badIntelPatterns = [
      /tracking/i,
      /analytics/i,
      /advertisement/i,
      /malicious/i,
      /inject/i,
      /xss/i,
      /script/i,
      /<script>/i,
      /javascript:/i,
      /onerror=/i,
      /onclick=/i
    ];

    console.log('✅ Cookie Sanitizer initialized');
  }

  analyzeCookie(name: string, value: string, options?: any): CookieIntel {
    const intel: CookieIntel = {
      name,
      value,
      ...options,
      isBadIntel: false
    };

    // Check for bad intel patterns
    for (const pattern of this.badIntelPatterns) {
      if (pattern.test(name) || pattern.test(value)) {
        intel.isBadIntel = true;
        intel.reason = `Matched suspicious pattern: ${pattern}`;
        break;
      }
    }

    // Check for XSS attempts
    if (value.includes('<') || value.includes('>') || value.includes('javascript:')) {
      intel.isBadIntel = true;
      intel.reason = 'Potential XSS attempt detected';
    }

    // Check for SQL injection patterns
    if (value.includes('DROP TABLE') || value.includes('SELECT *') || value.includes('UNION SELECT')) {
      intel.isBadIntel = true;
      intel.reason = 'Potential SQL injection detected';
    }

    return intel;
  }

  sanitizeCookie(name: string, value: string, options?: any): CookieIntel | null {
    const intel = this.analyzeCookie(name, value, options);

    if (intel.isBadIntel) {
      this.blockedCookies.add(name);
      console.log(`🚫 Blocked bad intel cookie: ${name} - ${intel.reason}`);
      this.emit('cookie:blocked', intel);
      return null;
    }

    // Sanitize the value
    const sanitizedValue = value
      .replace(/[<>]/g, '') // Remove HTML brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers

    const sanitizedIntel: CookieIntel = {
      ...intel,
      value: sanitizedValue,
      isBadIntel: false
    };

    this.sanitizedCookies.set(name, sanitizedIntel);
    this.emit('cookie:sanitized', sanitizedIntel);

    return sanitizedIntel;
  }

  clearBadIntel(): number {
    const count = this.blockedCookies.size;
    this.blockedCookies.clear();
    console.log(`🧹 Cleared ${count} bad intel cookies`);
    return count;
  }

  getStats() {
    return {
      sanitizedCookies: this.sanitizedCookies.size,
      blockedCookies: this.blockedCookies.size,
      badIntelPatterns: this.badIntelPatterns.length
    };
  }
}

export const cookieSanitizer = CookieSanitizer.getInstance();
