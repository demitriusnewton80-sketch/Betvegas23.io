
import express, { Request, Response } from 'express';

const router = express.Router();

interface TrafficMetrics {
  totalRequests: number;
  requestsByEndpoint: Map<string, number>;
  requestsByMethod: Map<string, number>;
  uniqueIPs: Set<string>;
  requestsByHour: Map<string, number>;
  lastRequests: Array<{
    timestamp: string;
    method: string;
    path: string;
    ip: string;
    userAgent: string;
  }>;
}

class TrafficMonitor {
  private metrics: TrafficMetrics = {
    totalRequests: 0,
    requestsByEndpoint: new Map(),
    requestsByMethod: new Map(),
    uniqueIPs: new Set(),
    requestsByHour: new Map(),
    lastRequests: []
  };

  trackRequest(req: Request) {
    const clientIP = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0').toString().split(',')[0].trim();
    const path = req.path;
    const method = req.method;
    const hour = new Date().toISOString().slice(0, 13);

    // Increment total requests
    this.metrics.totalRequests++;

    // Track by endpoint
    const currentEndpointCount = this.metrics.requestsByEndpoint.get(path) || 0;
    this.metrics.requestsByEndpoint.set(path, currentEndpointCount + 1);

    // Track by method
    const currentMethodCount = this.metrics.requestsByMethod.get(method) || 0;
    this.metrics.requestsByMethod.set(method, currentMethodCount + 1);

    // Track unique IPs
    this.metrics.uniqueIPs.add(clientIP);

    // Track by hour
    const currentHourCount = this.metrics.requestsByHour.get(hour) || 0;
    this.metrics.requestsByHour.set(hour, currentHourCount + 1);

    // Track last requests (keep last 100)
    this.metrics.lastRequests.unshift({
      timestamp: new Date().toISOString(),
      method,
      path,
      ip: clientIP,
      userAgent: req.headers['user-agent'] || 'Unknown'
    });

    if (this.metrics.lastRequests.length > 100) {
      this.metrics.lastRequests = this.metrics.lastRequests.slice(0, 100);
    }
  }

  getMetrics() {
    return {
      totalRequests: this.metrics.totalRequests,
      uniqueVisitors: this.metrics.uniqueIPs.size,
      topEndpoints: Array.from(this.metrics.requestsByEndpoint.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([path, count]) => ({ path, count })),
      requestsByMethod: Array.from(this.metrics.requestsByMethod.entries())
        .map(([method, count]) => ({ method, count })),
      requestsByHour: Array.from(this.metrics.requestsByHour.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([hour, count]) => ({ hour, count })),
      recentRequests: this.metrics.lastRequests.slice(0, 20)
    };
  }

  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      requestsByEndpoint: new Map(),
      requestsByMethod: new Map(),
      uniqueIPs: new Set(),
      requestsByHour: new Map(),
      lastRequests: []
    };
  }
}

export const trafficMonitor = new TrafficMonitor();

// Get current traffic metrics
router.get('/metrics', (req: Request, res: Response) => {
  const metrics = trafficMonitor.getMetrics();
  
  res.json({
    success: true,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    ...metrics
  });
});

// Get real-time traffic stream
router.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const interval = setInterval(() => {
    const metrics = trafficMonitor.getMetrics();
    res.write(`data: ${JSON.stringify(metrics)}\n\n`);
  }, 2000);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

// Reset metrics
router.post('/reset', (req: Request, res: Response) => {
  trafficMonitor.resetMetrics();
  
  res.json({
    success: true,
    message: 'Traffic metrics reset',
    timestamp: new Date().toISOString()
  });
});

export default router;
