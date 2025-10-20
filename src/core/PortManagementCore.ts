
import { EventEmitter } from 'events';
import { functionalStructures } from './FunctionalStructures.js';
import { smartTroubleshootingCore } from './SmartTroubleshootingCore.js';

interface PortStatus {
  port: number;
  status: 'active' | 'inactive' | 'bypassed' | 'error';
  boundStructure?: string;
  responseTime: number;
  lastChecked: number;
  errorCount: number;
}

interface BypassRoute {
  id: string;
  fromPort: number;
  toPort: number;
  reason: string;
  createdAt: number;
  active: boolean;
}

export class PortManagementCore extends EventEmitter {
  private static instance: PortManagementCore;
  private portStatus: Map<number, PortStatus> = new Map();
  private bypassRoutes: Map<string, BypassRoute> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private availablePorts = [5000, 3000, 3001, 3002, 3003, 4200, 5173, 6000, 6800, 8000, 8008, 8080, 8081];

  private constructor() {
    super();
    this.initializePortManagement();
  }

  static getInstance(): PortManagementCore {
    if (!PortManagementCore.instance) {
      PortManagementCore.instance = new PortManagementCore();
    }
    return PortManagementCore.instance;
  }

  private initializePortManagement() {
    console.log('🔌 Initializing Microsoft-Style Port Management Core...');

    // Initialize port status tracking
    this.availablePorts.forEach(port => {
      this.portStatus.set(port, {
        port,
        status: 'inactive',
        responseTime: 0,
        lastChecked: Date.now(),
        errorCount: 0
      });
    });

    // Monitor ports every 10 seconds
    this.monitoringInterval = setInterval(() => {
      this.scanPorts();
      this.checkNonRespondingStructures();
      this.processBypassRoutes();
    }, 10000);

    console.log('✅ Port Management Core initialized');
  }

  private async scanPorts() {
    for (const port of this.availablePorts) {
      await this.checkPort(port);
    }
  }

  private async checkPort(port: number): Promise<void> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`http://0.0.0.0:${port}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        this.updatePortStatus(port, 'active', responseTime, 0);
      } else {
        throw new Error(`Port ${port} returned ${response.status}`);
      }
    } catch (error) {
      const currentStatus = this.portStatus.get(port);
      const errorCount = (currentStatus?.errorCount || 0) + 1;
      
      this.updatePortStatus(port, errorCount > 3 ? 'error' : 'inactive', 0, errorCount);

      if (errorCount >= 3) {
        this.emit('port:failed', { port, errorCount });
        this.createBypassRoute(port);
      }
    }
  }

  private updatePortStatus(
    port: number,
    status: PortStatus['status'],
    responseTime: number,
    errorCount: number
  ) {
    const currentStatus = this.portStatus.get(port);
    
    this.portStatus.set(port, {
      port,
      status,
      boundStructure: currentStatus?.boundStructure,
      responseTime,
      lastChecked: Date.now(),
      errorCount
    });
  }

  private checkNonRespondingStructures() {
    const structures = functionalStructures.getAllStructures();
    
    structures.forEach(structure => {
      if (!structure.operational) {
        console.log(`⚠️ Non-responding structure detected: ${structure.name}`);
        this.createStructureBypass(structure.id);
      }
    });
  }

  private createBypassRoute(fromPort: number) {
    // Find an available alternative port
    const alternativePort = this.findAvailablePort(fromPort);
    
    if (!alternativePort) {
      console.error(`❌ No alternative port available for ${fromPort}`);
      return;
    }

    const bypassId = `bypass-${fromPort}-${alternativePort}-${Date.now()}`;
    
    const bypass: BypassRoute = {
      id: bypassId,
      fromPort,
      toPort: alternativePort,
      reason: `Port ${fromPort} not responding`,
      createdAt: Date.now(),
      active: true
    };

    this.bypassRoutes.set(bypassId, bypass);
    
    const portStatus = this.portStatus.get(fromPort);
    if (portStatus) {
      portStatus.status = 'bypassed';
    }

    console.log(`🔀 Created bypass route: ${fromPort} → ${alternativePort}`);
    this.emit('bypass:created', bypass);

    return bypassId;
  }

  private createStructureBypass(structureId: string) {
    const structure = functionalStructures.getStructure(structureId);
    if (!structure) return;

    // Create troubleshooting session
    smartTroubleshootingCore.setAutoFix(true);
    
    console.log(`🔧 Creating bypass for structure: ${structure.name}`);
    this.emit('structure:bypassed', { structureId, name: structure.name });
  }

  private findAvailablePort(excludePort: number): number | null {
    for (const port of this.availablePorts) {
      if (port === excludePort) continue;
      
      const status = this.portStatus.get(port);
      if (status && status.status === 'active') {
        return port;
      }
    }
    return null;
  }

  private processBypassRoutes() {
    this.bypassRoutes.forEach((bypass, id) => {
      // Check if original port is back online
      const originalPort = this.portStatus.get(bypass.fromPort);
      
      if (originalPort && originalPort.status === 'active' && originalPort.errorCount === 0) {
        console.log(`✅ Port ${bypass.fromPort} recovered, removing bypass`);
        bypass.active = false;
        this.bypassRoutes.delete(id);
      }
    });
  }

  bindStructureToPort(structureId: string, port: number) {
    const structure = functionalStructures.getStructure(structureId);
    if (!structure) {
      return { success: false, error: 'Structure not found' };
    }

    const portStatus = this.portStatus.get(port);
    if (!portStatus) {
      return { success: false, error: 'Invalid port' };
    }

    portStatus.boundStructure = structureId;
    
    console.log(`🔗 Bound ${structure.name} to port ${port}`);
    
    return {
      success: true,
      structure: structure.name,
      port,
      timestamp: new Date().toISOString()
    };
  }

  getPortLandscape() {
    const ports = Array.from(this.portStatus.values());
    const bypasses = Array.from(this.bypassRoutes.values()).filter(b => b.active);

    return {
      totalPorts: ports.length,
      activePorts: ports.filter(p => p.status === 'active').length,
      bypassedPorts: ports.filter(p => p.status === 'bypassed').length,
      errorPorts: ports.filter(p => p.status === 'error').length,
      activeBypassRoutes: bypasses.length,
      ports: ports.map(p => ({
        port: p.port,
        status: p.status,
        boundStructure: p.boundStructure,
        responseTime: p.responseTime,
        errorCount: p.errorCount
      })),
      bypasses: bypasses.map(b => ({
        id: b.id,
        route: `${b.fromPort} → ${b.toPort}`,
        reason: b.reason,
        age: Math.floor((Date.now() - b.createdAt) / 1000)
      })),
      fccEntity: '20130314143016'
    };
  }

  getPortStatus(port: number) {
    return this.portStatus.get(port);
  }

  getAllBypassRoutes() {
    return Array.from(this.bypassRoutes.values());
  }

  shutdown() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
}

export const portManagementCore = PortManagementCore.getInstance();
