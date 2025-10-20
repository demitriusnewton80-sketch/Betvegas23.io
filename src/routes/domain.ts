
import express, { Request, Response } from 'express';
import { domainProtection, addCustomDomain, getAllowedDomains } from '../middleware/domainProtection.js';

const router = express.Router();

// Authorized emails for domain management
const AUTHORIZED_EMAILS = ['gbemeeat@gmail.com', 'meeatupt215@gmail.com', 'meeat21555@gmail.com'];

// Get domain status
router.get('/status', (req: Request, res: Response) => {
  const host = req.headers.host || '';
  
  res.json({
    currentDomain: host,
    protection: 'active',
    fccEntity: '20130314143016',
    allowedDomains: getAllowedDomains(),
    timestamp: new Date().toISOString(),
    awsIntegration: 'active',
    githubRepo: 'https://github.com/betvages23/betvages23.in'
  });
});

// Add custom domain
router.post('/add', (req: Request, res: Response) => {
  const { email, domain } = req.body;

  if (!email || !domain) {
    return res.status(400).json({ 
      success: false, 
      error: 'Email and domain are required' 
    });
  }

  if (!AUTHORIZED_EMAILS.includes(email.toLowerCase())) {
    return res.status(403).json({ 
      success: false, 
      error: 'Unauthorized email address' 
    });
  }

  // Validate domain format
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid domain format' 
    });
  }

  // Add domain to allowed list
  addCustomDomain(domain);

  res.json({
    success: true,
    domain,
    email,
    message: 'Domain added successfully',
    dnsRecords: {
      type: 'A',
      name: '@',
      value: '0.0.0.0',
      ttl: 3600
    },
    instructions: 'Add the DNS A record to your domain registrar pointing to this server'
  });
});

// Create phone-based domain
router.post('/phone/create', (req: Request, res: Response) => {
  const { phoneNumber, userId, email } = req.body;

  if (!phoneNumber || !userId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Phone number and user ID are required' 
    });
  }

  if (email && !AUTHORIZED_EMAILS.includes(email.toLowerCase())) {
    return res.status(403).json({ 
      success: false, 
      error: 'Unauthorized email address' 
    });
  }

  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const domain = `${cleanPhone}.youngmeeat.net`;
  const accessUrl = `https://${domain}`;

  // Add to allowed domains
  addCustomDomain(domain);

  res.json({
    success: true,
    domain,
    phoneNumber: cleanPhone,
    userId,
    accessUrl,
    vpnIP: '10.0.0.' + (Math.floor(Math.random() * 254) + 1),
    serverIP: '0.0.0.0:5000',
    fccEntity: '20130314143016',
    awsAccount: 'meeat21555@gmail.com',
    githubRepo: 'https://github.com/betvages23/betvages23.in'
  });
});

// AWS domain provisioning
router.post('/aws/provision', (req: Request, res: Response) => {
  const { domain, awsAccountEmail } = req.body;

  if (awsAccountEmail !== 'meaat21555@gmail.com') {
    return res.status(403).json({ 
      success: false, 
      error: 'Unauthorized AWS account' 
    });
  }

  if (!domain) {
    return res.status(400).json({ 
      success: false, 
      error: 'Domain is required' 
    });
  }

  addCustomDomain(domain);

  res.json({
    success: true,
    domain,
    awsAccount: awsAccountEmail,
    route53Config: {
      hostedZoneId: `Z${Date.now()}`,
      nameServers: [
        'ns-1.awsdns-01.com',
        'ns-2.awsdns-02.org',
        'ns-3.awsdns-03.net',
        'ns-4.awsdns-04.co.uk'
      ]
    },
    cloudFrontDistribution: `d${Date.now()}.cloudfront.net`,
    s3Bucket: `youngmeeat-${domain.replace(/\./g, '-')}`,
    certificateArn: `arn:aws:acm:us-east-1:123456789012:certificate/${Date.now()}`,
    fccEntity: '20130314143016'
  });
});

// GitHub Pages integration
router.post('/github/setup', (req: Request, res: Response) => {
  const { domain, repository } = req.body;

  if (!domain || !repository) {
    return res.status(400).json({ 
      success: false, 
      error: 'Domain and repository are required' 
    });
  }

  addCustomDomain(domain);

  res.json({
    success: true,
    domain,
    repository: repository || 'https://github.com/betvages23/betvages23.in',
    githubPagesUrl: `https://${domain}`,
    cnameRecord: domain,
    instructions: {
      step1: 'Create CNAME file in repository root with domain name',
      step2: 'Add A records to DNS: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153',
      step3: 'Enable GitHub Pages in repository settings',
      step4: 'Add custom domain in GitHub Pages settings'
    },
    fccEntity: '20130314143016'
  });
});

// List all active domains
router.get('/list', (req: Request, res: Response) => {
  res.json({
    domains: getAllowedDomains(),
    count: getAllowedDomains().length,
    awsAccount: 'meaat21555@gmail.com',
    githubRepo: 'https://github.com/betvages23/betvages23.in',
    fccEntity: '20130314143016'
  });
});

export default router;
