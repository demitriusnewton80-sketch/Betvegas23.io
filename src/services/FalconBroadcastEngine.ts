
import { EventEmitter } from 'events';
import { streamingService } from './StreamingService.js';
import { appCore } from '../core/AppCore.js';

interface FalconReport {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  source: string;
}

interface BroadcastOutput {
  id: string;
  reportId: string;
  destination: string;
  status: 'pending' | 'broadcasting' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  data: any;
}

export class FalconBroadcastEngine extends EventEmitter {
  private static instance: FalconBroadcastEngine;
  private reports: Map<string, FalconReport> = new Map();
  private broadcasts: Map<string, BroadcastOutput> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private falconUrl = 'https://reports.falcon.ag/Report/Welcome.aspx?login=1';

  private constructor() {
    super();
    this.initializeEngine();
  }

  static getInstance(): FalconBroadcastEngine {
    if (!FalconBroadcastEngine.instance) {
      FalconBroadcastEngine.instance = new FalconBroadcastEngine();
    }
    return FalconBroadcastEngine.instance;
  }

  private initializeEngine() {
    console.log('🚀 Initializing Falcon Broadcast Engine...');

    // Start monitoring and broadcasting
    this.monitoringInterval = setInterval(() => {
      this.processReports();
      this.broadcastToCore();
    }, 5000);

    console.log('✅ Falcon Broadcast Engine initialized');
  }

  // Ingest report data
  ingestReport(type: string, data: any): string {
    const reportId = `falcon_report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const report: FalconReport = {
      id: reportId,
      type,
      data,
      timestamp: Date.now(),
      source: this.falconUrl
    };

    this.reports.set(reportId, report);
    console.log(`📥 Ingested Falcon report: ${reportId} (${type})`);
    this.emit('report:ingested', report);

    // Auto-create broadcast
    this.createBroadcast(reportId);

    return reportId;
  }

  // Create broadcast output
  private createBroadcast(reportId: string): string {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    const broadcastId = `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const broadcast: BroadcastOutput = {
      id: broadcastId,
      reportId,
      destination: 'core',
      status: 'pending',
      startTime: Date.now(),
      data: report.data
    };

    this.broadcasts.set(broadcastId, broadcast);
    console.log(`📡 Created broadcast: ${broadcastId} for report ${reportId}`);
    this.emit('broadcast:created', broadcast);

    return broadcastId;
  }

  // Process reports
  private processReports() {
    for (const [reportId, report] of this.reports) {
      // Transform report data for broadcasting
      const transformed = this.transformReportData(report);

      // Update associated broadcast
      const broadcast = Array.from(this.broadcasts.values())
        .find(b => b.reportId === reportId && b.status === 'pending');

      if (broadcast) {
        broadcast.data = transformed;
        broadcast.status = 'broadcasting';
      }
    }
  }

  // Transform report data
  private transformReportData(report: FalconReport): any {
    return {
      reportId: report.id,
      type: report.type,
      source: 'Falcon Reports',
      sourceUrl: this.falconUrl,
      timestamp: new Date(report.timestamp).toISOString(),
      content: report.data,
      fccEntity: '20130314143016',
      broadcastReady: true
    };
  }

  // Broadcast to core systems
  private broadcastToCore() {
    const pendingBroadcasts = Array.from(this.broadcasts.values())
      .filter(b => b.status === 'broadcasting');

    for (const broadcast of pendingBroadcasts) {
      try {
        // Broadcast to AppCore
        appCore.broadcastMessage('falcon:report', {
          broadcastId: broadcast.id,
          data: broadcast.data
        });

        // Broadcast to streaming partners
        const partners = streamingService.getStreamingPartners();
        for (const partner of partners) {
          if (partner.active) {
            this.emit('broadcast:partner', {
              partnerId: partner.id,
              partnerName: partner.name,
              data: broadcast.data
            });
          }
        }

        // Mark as completed
        broadcast.status = 'completed';
        broadcast.endTime = Date.now();

        console.log(`✅ Broadcast completed: ${broadcast.id}`);
        this.emit('broadcast:completed', broadcast);

      } catch (error) {
        broadcast.status = 'failed';
        broadcast.endTime = Date.now();
        console.error(`❌ Broadcast failed: ${broadcast.id}`, error);
        this.emit('broadcast:failed', { broadcast, error });
      }
    }
  }

  // Build report from external data
  async buildReport(reportType: string, externalData: any): Promise<string> {
    const enrichedData = {
      ...externalData,
      falconSource: this.falconUrl,
      buildTime: new Date().toISOString(),
      fccEntity: '20130314143016',
      integrated: true
    };

    return this.ingestReport(reportType, enrichedData);
  }

  // Get engine status
  getEngineStatus() {
    return {
      totalReports: this.reports.size,
      totalBroadcasts: this.broadcasts.size,
      pendingBroadcasts: Array.from(this.broadcasts.values())
        .filter(b => b.status === 'pending').length,
      broadcastingNow: Array.from(this.broadcasts.values())
        .filter(b => b.status === 'broadcasting').length,
      completedBroadcasts: Array.from(this.broadcasts.values())
        .filter(b => b.status === 'completed').length,
      failedBroadcasts: Array.from(this.broadcasts.values())
        .filter(b => b.status === 'failed').length,
      falconSource: this.falconUrl,
      fccEntity: '20130314143016',
      timestamp: Date.now()
    };
  }

  // Get all reports
  getReports() {
    return Array.from(this.reports.values());
  }

  // Get all broadcasts
  getBroadcasts() {
    return Array.from(this.broadcasts.values());
  }

  // Get broadcast by ID
  getBroadcast(broadcastId: string) {
    return this.broadcasts.get(broadcastId);
  }

  // Shutdown engine
  shutdown() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    console.log('🔌 Falcon Broadcast Engine shutdown');
  }
}

export const falconBroadcastEngine = FalconBroadcastEngine.getInstance();
