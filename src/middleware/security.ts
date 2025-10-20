
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Input sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potential XSS and SQL injection patterns
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/('|(\\')|(;)|(--)|(\/\*))/g, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        obj[key] = sanitize(obj[key]);
      });
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

// Request validation
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  // Check request size
  const contentLength = parseInt(req.headers['content-length'] || '0');
  if (contentLength > 10 * 1024 * 1024) { // 10MB limit
    return res.status(413).json({ error: 'Request too large' });
  }

  // Validate content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (contentType && !contentType.includes('application/json') && 
        !contentType.includes('application/x-www-form-urlencoded') &&
        !contentType.includes('multipart/form-data')) {
      return res.status(415).json({ error: 'Unsupported media type' });
    }
  }

  next();
};

// API key validation for sensitive endpoints
export const validateAPIKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  const validKeys = (process.env.API_KEYS || '').split(',').filter(k => k.length > 0);

  // Allow requests without API key for public endpoints
  if (req.path.startsWith('/health') || req.path.startsWith('/api')) {
    return next();
  }

  if (validKeys.length > 0 && !apiKey) {
    return res.status(401).json({
      error: 'API key required',
      fccEntity: '20130314143016'
    });
  }

  if (validKeys.length > 0 && !validKeys.includes(String(apiKey))) {
    console.warn(`🚨 Invalid API key attempt from ${req.ip}`);
    return res.status(403).json({
      error: 'Invalid API key',
      fccEntity: '20130314143016'
    });
  }

  next();
};

// Email validation for phone control endpoints
export const validateAuthorizedEmail = (authorizedEmails: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email || !authorizedEmails.includes(email.toLowerCase())) {
      console.warn(`🚨 Unauthorized email access attempt: ${email} from ${req.ip}`);
      return res.status(403).json({
        error: 'Unauthorized email address',
        fccEntity: '20130314143016'
      });
    }

    next();
  };
};

// Audit logging for sensitive operations
export const auditLog = (operation: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      operation,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      path: req.path,
      method: req.method,
      fccEntity: '20130314143016'
    };

    console.log(`📋 AUDIT: ${JSON.stringify(logEntry)}`);
    next();
  };
};

// Prevent brute force attacks
const loginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();

export const bruteForceProtection = (req: Request, res: Response, next: NextFunction) => {
  const ip = String(req.ip || req.socket.remoteAddress);
  const now = Date.now();
  const attempts = loginAttempts.get(ip);

  if (attempts) {
    const timeDiff = now - attempts.lastAttempt;
    
    // Reset after 15 minutes
    if (timeDiff > 900000) {
      loginAttempts.delete(ip);
      return next();
    }

    // Block after 5 failed attempts within 15 minutes
    if (attempts.count >= 5) {
      console.warn(`🚨 Brute force attempt detected: ${ip}`);
      return res.status(429).json({
        error: 'Too many login attempts',
        retryAfter: Math.ceil((900000 - timeDiff) / 1000)
      });
    }

    attempts.count++;
    attempts.lastAttempt = now;
  } else {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
  }

  next();
};

// Cleanup old login attempts every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of loginAttempts.entries()) {
    if (now - data.lastAttempt > 900000) {
      loginAttempts.delete(ip);
    }
  }
}, 1800000);
