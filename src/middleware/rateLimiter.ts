
import { Request, Response } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    violations: number;
    blocked: boolean;
    blockUntil?: number;
  };
}

const store: RateLimitStore = {};
const blockedIPs: Set<string> = new Set();
const suspiciousPatterns: RegExp[] = [
  /(\.\.|%2e%2e|%252e%252e)/i, // Path traversal
  /(union|select|insert|drop|delete|update|exec|script)/i, // SQL injection
  /(<script|javascript:|onerror=|onclick=)/i, // XSS
  /(wget|curl|python|perl|ruby|bash)/i, // Command injection
];

export const rateLimiter = (maxRequests: number = 100, windowMs: number = 60000) => {
  return (req: Request, res: Response, next: Function) => {
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
    const key = `${ip}`;
    const now = Date.now();
    
    // Check if IP is permanently blocked
    if (blockedIPs.has(ip)) {
      console.warn(`🚨 Blocked IP attempted access: ${ip}`);
      return res.status(403).json({
        error: 'Access denied',
        reason: 'IP blocked due to security violations'
      });
    }
    
    // Check for suspicious patterns
    const fullUrl = `${req.path}${JSON.stringify(req.query)}${JSON.stringify(req.body)}`;
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(fullUrl));
    
    if (isSuspicious) {
      console.warn(`🚨 Suspicious request detected from ${ip}: ${req.path}`);
      if (!store[key]) {
        store[key] = { count: 0, resetTime: now + windowMs, violations: 0, blocked: false };
      }
      store[key].violations++;
      
      // Block IP after 3 violations
      if (store[key].violations >= 3) {
        blockedIPs.add(ip);
        console.error(`🛑 IP BLOCKED: ${ip} - Multiple security violations`);
      }
      
      return res.status(400).json({
        error: 'Invalid request',
        fccEntity: '20130314143016'
      });
    }
    
    if (!store[key] || now > store[key].resetTime) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
        violations: store[key]?.violations || 0,
        blocked: false
      };
      return next();
    }
    
    // Check if temporarily blocked
    if (store[key].blocked && store[key].blockUntil && now < store[key].blockUntil) {
      return res.status(429).json({
        error: 'Temporarily blocked',
        retryAfter: Math.ceil((store[key].blockUntil - now) / 1000)
      });
    }
    
    store[key].count++;
    
    if (store[key].count > maxRequests) {
      // Temporary block for 15 minutes
      store[key].blocked = true;
      store[key].blockUntil = now + 900000;
      console.warn(`⚠️ Rate limit exceeded: ${ip} - Temporary block`);
      
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
      });
    }
    
    next();
  };
};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (now > store[key].resetTime) {
      delete store[key];
    }
  });
}, 300000);

// Export for manual IP blocking
export const blockIP = (ip: string) => {
  blockedIPs.add(ip);
  console.error(`🛑 IP manually blocked: ${ip}`);
};

export const unblockIP = (ip: string) => {
  blockedIPs.delete(ip);
  if (store[ip]) {
    store[ip].violations = 0;
    store[ip].blocked = false;
  }
  console.log(`✅ IP unblocked: ${ip}`);
};

export const getBlockedIPs = () => Array.from(blockedIPs);
