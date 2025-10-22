
import { EventEmitter } from 'events';
import { falconBroadcastEngine } from './FalconBroadcastEngine.js';
import { radioBroadcastDeploymentService } from './RadioBroadcastDeploymentService.js';
import { streamingService } from './StreamingService.js';
import { sportsRadioService } from './SportsRadioService.js';

interface BroadcastExport {
  exportId: string;
  timestamp: number;
  fccEntity: string;
  exportType: 'full' | 'streaming' | 'radio' | 'falcon';
  format: 'json' | 'xml' | 'csv';
  data: any;
}

interface ExportSummary {
  totalBroadcasts: number;
  activeBroadcasts: number;
  totalListeners: number;
  totalSportsbooks: number;
  exportTimestamp: string;
}

export class BroadcastExportService extends EventEmitter {
  private static instance: BroadcastExportService;
  private exports: Map<string, BroadcastExport> = new Map();

  private constructor() {
    super();
    console.log('📤 Initializing Broadcast Export Service...');
  }

  static getInstance(): BroadcastExportService {
    if (!BroadcastExportService.instance) {
      BroadcastExportService.instance = new BroadcastExportService();
    }
    return BroadcastExportService.instance;
  }

  // Export full broadcasting data
  async exportFullBroadcast(format: 'json' | 'xml' | 'csv' = 'json'): Promise<BroadcastExport> {
    const exportId = `broadcast_export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Gather all broadcasting data
    const falconStatus = falconBroadcastEngine.getEngineStatus();
    const falconBroadcasts = falconBroadcastEngine.getBroadcasts();
    const falconReports = falconBroadcastEngine.getReports();

    const radioDeployments = radioBroadcastDeploymentService.getAllDeployments();
    const radioStatus = radioBroadcastDeploymentService.getDeploymentStatus();

    const streamingPartners = streamingService.getStreamingPartners();
    const streamingContracts = streamingService.getActiveStreams();

    const radioStreams = sportsRadioService.getLiveRadioStreams();
    const radioByLeague = {
      NFL: sportsRadioService.getRadioStreamsByLeague('NFL'),
      NBA: sportsRadioService.getRadioStreamsByLeague('NBA'),
      MLB: sportsRadioService.getRadioStreamsByLeague('MLB'),
      NHL: sportsRadioService.getRadioStreamsByLeague('NHL')
    };

    const exportData = {
      exportId,
      exportTimestamp: new Date().toISOString(),
      fccEntity: '20130314143016',
      
      // Falcon Broadcasting
      falconBroadcasting: {
        status: falconStatus,
        broadcasts: falconBroadcasts,
        reports: falconReports,
        totalReports: falconReports.length,
        activeBroadcasts: falconBroadcasts.filter(b => b.status === 'broadcasting').length,
        completedBroadcasts: falconBroadcasts.filter(b => b.status === 'completed').length
      },

      // Radio Broadcasting
      radioBroadcasting: {
        status: radioStatus,
        deployments: radioDeployments,
        liveStreams: radioStreams,
        byLeague: radioByLeague,
        totalDeployments: radioDeployments.length,
        totalListeners: radioStatus.totalListeners
      },

      // Video Streaming
      videoStreaming: {
        partners: streamingPartners,
        contracts: streamingContracts,
        totalPartners: streamingPartners.length,
        activePartners: streamingPartners.filter(p => p.active).length
      },

      // Summary
      summary: {
        totalBroadcasts: falconBroadcasts.length + radioDeployments.length,
        activeBroadcasts: falconBroadcasts.filter(b => b.status === 'broadcasting').length + radioDeployments.filter(d => d.status === 'active').length,
        totalListeners: radioStatus.totalListeners,
        totalSportsbooks: streamingPartners.length,
        totalRadioStreams: radioStreams.length,
        exportDate: new Date().toISOString()
      }
    };

    const broadcastExport: BroadcastExport = {
      exportId,
      timestamp: Date.now(),
      fccEntity: '20130314143016',
      exportType: 'full',
      format,
      data: format === 'json' ? exportData : 
            format === 'xml' ? this.convertToXML(exportData) :
            this.convertToCSV(exportData)
    };

    this.exports.set(exportId, broadcastExport);
    this.emit('export:created', broadcastExport);

    console.log(`📤 Full broadcast export created: ${exportId}`);
    return broadcastExport;
  }

  // Export streaming broadcasts only
  async exportStreamingBroadcasts(format: 'json' | 'xml' | 'csv' = 'json'): Promise<BroadcastExport> {
    const exportId = `streaming_export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const partners = streamingService.getStreamingPartners();
    const contracts = streamingService.getActiveStreams();

    const exportData = {
      exportId,
      exportTimestamp: new Date().toISOString(),
      fccEntity: '20130314143016',
      streamingPartners: partners,
      activeContracts: contracts,
      totalPartners: partners.length,
      activePartners: partners.filter(p => p.active).length,
      totalContracts: contracts.length
    };

    const broadcastExport: BroadcastExport = {
      exportId,
      timestamp: Date.now(),
      fccEntity: '20130314143016',
      exportType: 'streaming',
      format,
      data: format === 'json' ? exportData : 
            format === 'xml' ? this.convertToXML(exportData) :
            this.convertToCSV(exportData)
    };

    this.exports.set(exportId, broadcastExport);
    return broadcastExport;
  }

  // Export radio broadcasts only
  async exportRadioBroadcasts(format: 'json' | 'xml' | 'csv' = 'json'): Promise<BroadcastExport> {
    const exportId = `radio_export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const deployments = radioBroadcastDeploymentService.getAllDeployments();
    const status = radioBroadcastDeploymentService.getDeploymentStatus();
    const radioStreams = sportsRadioService.getLiveRadioStreams();

    const exportData = {
      exportId,
      exportTimestamp: new Date().toISOString(),
      fccEntity: '20130314143016',
      deployments,
      liveStreams: radioStreams,
      status,
      totalDeployments: deployments.length,
      activeDeployments: deployments.filter(d => d.status === 'active').length,
      totalListeners: status.totalListeners
    };

    const broadcastExport: BroadcastExport = {
      exportId,
      timestamp: Date.now(),
      fccEntity: '20130314143016',
      exportType: 'radio',
      format,
      data: format === 'json' ? exportData : 
            format === 'xml' ? this.convertToXML(exportData) :
            this.convertToCSV(exportData)
    };

    this.exports.set(exportId, broadcastExport);
    return broadcastExport;
  }

  // Convert to XML format
  private convertToXML(data: any): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<BroadcastExport>\n';
    xml += this.objectToXML(data, 1);
    xml += '</BroadcastExport>';
    return xml;
  }

  private objectToXML(obj: any, indent: number): string {
    let xml = '';
    const spaces = '  '.repeat(indent);

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;

      if (Array.isArray(value)) {
        xml += `${spaces}<${key}>\n`;
        value.forEach(item => {
          xml += `${spaces}  <item>\n`;
          xml += this.objectToXML(item, indent + 2);
          xml += `${spaces}  </item>\n`;
        });
        xml += `${spaces}</${key}>\n`;
      } else if (typeof value === 'object') {
        xml += `${spaces}<${key}>\n`;
        xml += this.objectToXML(value, indent + 1);
        xml += `${spaces}</${key}>\n`;
      } else {
        xml += `${spaces}<${key}>${this.escapeXML(String(value))}</${key}>\n`;
      }
    }

    return xml;
  }

  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Convert to CSV format
  private convertToCSV(data: any): string {
    const rows: string[] = [];
    
    // Add header
    rows.push('Type,ID,Name,Status,Timestamp,Details');

    // Add data rows
    if (data.falconBroadcasting?.broadcasts) {
      data.falconBroadcasting.broadcasts.forEach((b: any) => {
        rows.push(`Falcon Broadcast,${b.id},${b.destination},${b.status},${new Date(b.startTime).toISOString()},Report: ${b.reportId}`);
      });
    }

    if (data.radioBroadcasting?.deployments) {
      data.radioBroadcasting.deployments.forEach((d: any) => {
        rows.push(`Radio Deployment,${d.id},${d.sportsbookName},${d.status},${d.deployedAt ? new Date(d.deployedAt).toISOString() : 'N/A'},Listeners: ${d.listeners}`);
      });
    }

    if (data.videoStreaming?.partners) {
      data.videoStreaming.partners.forEach((p: any) => {
        rows.push(`Streaming Partner,${p.id},${p.name},${p.active ? 'active' : 'inactive'},${p.registeredAt},${p.webhookUrl}`);
      });
    }

    return rows.join('\n');
  }

  // Get export by ID
  getExport(exportId: string): BroadcastExport | undefined {
    return this.exports.get(exportId);
  }

  // Get all exports
  getAllExports(): BroadcastExport[] {
    return Array.from(this.exports.values());
  }

  // Get export summary
  getExportSummary(): ExportSummary {
    const falconStatus = falconBroadcastEngine.getEngineStatus();
    const radioStatus = radioBroadcastDeploymentService.getDeploymentStatus();
    const partners = streamingService.getStreamingPartners();

    return {
      totalBroadcasts: falconStatus.totalBroadcasts + radioStatus.totalDeployments,
      activeBroadcasts: falconStatus.broadcastingNow + radioStatus.activeDeployments,
      totalListeners: radioStatus.totalListeners,
      totalSportsbooks: partners.length,
      exportTimestamp: new Date().toISOString()
    };
  }
}

export const broadcastExportService = BroadcastExportService.getInstance();
