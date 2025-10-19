
import { Request, Response, NextFunction } from 'express';

interface DomainProtectionConfig {
  allowedDomains: string[];
  fccEntity: string;
  requireAuth: boolean;
}

const config: DomainProtectionConfig = {
  allowedDomains: [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '.replit.app',
    '.replit.dev',
    // Add your custom domain here when ready
  ],
  fccEntity: '20130314143016',
  requireAuth: false
};

export const domainProtection = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin || req.headers.host || '';
  const host = req.headers.host || '';
  
  // Check if domain is allowed
  const isAllowed = config.allowedDomains.some(domain => {
    if (domain.startsWith('.')) {
      return host.endsWith(domain) || origin.includes(domain);
    }
    return host.includes(domain) || origin.includes(domain);
  });

  if (!isAllowed && process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Domain not authorized',
      fccEntity: config.fccEntity,
      message: 'This domain is not authorized to access streaming services',
      contact: 'gbemeeat@gmail.com'
    });
  }

  // Add security headers
  res.setHeader('X-FCC-Entity', config.fccEntity);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add CORS headers for allowed domains
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  next();
};

export const addCustomDomain = (domain: string) => {
  if (!config.allowedDomains.includes(domain)) {
    config.allowedDomains.push(domain);
    console.log(`✅ Custom domain added: ${domain}`);
  }
};

export const removeCustomDomain = (domain: string) => {
  const index = config.allowedDomains.indexOf(domain);
  if (index > -1) {
    config.allowedDomains.splice(index, 1);
    console.log(`❌ Custom domain removed: ${domain}`);
  }
};

export const getAllowedDomains = () => config.allowedDomains;
