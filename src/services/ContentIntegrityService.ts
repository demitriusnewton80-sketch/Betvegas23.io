
import { EventEmitter } from 'events';
import { portManagementCore } from '../core/PortManagementCore.js';
import { functionalStructures } from '../core/FunctionalStructures.js';
import { streamingService } from './StreamingService.js';

interface FailedConnection {
  id: string;
  sourcePort: number;
  targetEndpoint: string;
  failureReason: string;
  timestamp: number;
  retryCount: number;
  structureId?: string;
  integrityStatus: 'pending' | 'verified' | 'compromised';
}

interface IntegrityCheck {
  connectionId: string;
  structureId: string;
  checkType: 'port' | 'stream' | 'contract' | 'structure';
  result: 'pass' | 'fail' | 'warning';
  details: string;
  timestamp: number;
}

interface LandingPortal {
  id: string;
  name: string;
  port: number;
  status: 'active' | 'standby' | 'maintenance';
  failedConnections: string[];
  integrityScore: number;
  capacity: number;
  fccCompliant: boolean;
}

export class ContentIntegrityService extends EventEmitter {
  private static instance: ContentIntegrityService;
  private failedConnections: Map<string, FailedConnection> = new Map();
  private integrityChecks: Map<string, IntegrityCheck[]> = new Map();
  private landingPortals: Map<string, LandingPortal> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.initializeService();
  }

  static getInstance(): ContentIntegrityService {
    if (!ContentIntegrityService.instance) {
      ContentIntegrityService.instance = new ContentIntegrityService();
    }
    return ContentIntegrityService.instance;
  }

  private initializeService() {
    console.log('🔒 Initializing Content Integrity Service...');

    // Initialize landing portals
    this.createLandingPortals();

    // Monitor for failed connections
    this.startConnectionMonitoring();

    // Listen to port management events
    this.setupEventListeners();

    console.log('✅ Content Integrity Service initialized');
  }

  private createLandingPortals() {
    const portals: LandingPortal[] = [
      {
        id: 'portal-primary',
        name: 'Primary Landing Portal',
        port: 8000,
        status: 'active',
        failedConnections: [],
        integrityScore: 100,
        capacity: 1000,
        fccCompliant: true
      },
      {
        id: 'portal-secondary',
        name: 'Secondary Landing Portal',
        port: 8080,
        status: 'active',
        failedConnections: [],
        integrityScore: 100,
        capacity: 1000,
        fccCompliant: true
      },
      {
        id: 'portal-emergency',
        name: 'Emergency Recovery Portal',
        port: 8081,
        status: 'standby',
        failedConnections: [],
        integrityScore: 100,
        capacity: 500,
        fccCompliant: true
      }
    ];

    portals.forEach(portal => {
      this.landingPortals.set(portal.id, portal);
      console.log(`📍 Created landing portal: ${portal.name} on port ${portal.port}`);
    });
  }

  private setupEventListeners() {
    portManagementCore.on('port:failed', ({ port, errorCount }) => {
      this.handleFailedConnection(port, 'Port failure', errorCount);
    });

    portManagementCore.on('bypass:created', (bypass) => {
      console.log(`🔀 Bypass route created, validating integrity...`);
      this.validateBypassIntegrity(bypass);
    });
  }

  private startConnectionMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.validateAllConnections();
      this.updatePortalIntegrity();
      this.processFailedConnections();
    }, 10000);
  }

  private handleFailedConnection(port: number, reason: string, retryCount: number) {
    const connectionId = `failed-${port}-${Date.now()}`;
    
    const failedConnection: FailedConnection = {
      id: connectionId,
      sourcePort: port,
      targetEndpoint: `http://0.0.0.0:${port}`,
      failureReason: reason,
      timestamp: Date.now(),
      retryCount,
      integrityStatus: 'pending'
    };

    // Get bound structure if any
    const portStatus = portManagementCore.getPortStatus(port);
    if (portStatus?.boundStructure) {
      failedConnection.structureId = portStatus.boundStructure;
    }

    this.failedConnections.set(connectionId, failedConnection);
    
    // Route to landing portal
    this.routeToLandingPortal(failedConnection);

    this.emit('connection:failed', failedConnection);
    console.log(`❌ Connection failed: Port ${port} - ${reason}`);
  }

  private routeToLandingPortal(connection: FailedConnection) {
    // Find best available portal
    const portal = this.selectOptimalPortal();
    
    if (!portal) {
      console.error('❌ No landing portal available for failed connection');
      return;
    }

    portal.failedConnections.push(connection.id);
    
    // Perform integrity check
    this.performIntegrityCheck(connection, portal);

    console.log(`🚪 Routed failed connection ${connection.id} to ${portal.name}`);
    this.emit('connection:routed', { connection, portal });
  }

  private selectOptimalPortal(): LandingPortal | null {
    const activePortals = Array.from(this.landingPortals.values())
      .filter(p => p.status === 'active');

    if (activePortals.length === 0) {
      // Activate emergency portal
      const emergency = this.landingPortals.get('portal-emergency');
      if (emergency) {
        emergency.status = 'active';
        return emergency;
      }
      return null;
    }

    // Select portal with lowest load and highest integrity
    return activePortals.reduce((best, current) => {
      const bestScore = best.integrityScore - (best.failedConnections.length / best.capacity) * 100;
      const currentScore = current.integrityScore - (current.failedConnections.length / current.capacity) * 100;
      return currentScore > bestScore ? current : best;
    });
  }

  private async performIntegrityCheck(connection: FailedConnection, portal: LandingPortal) {
    const checks: IntegrityCheck[] = [];

    // Check 1: Port integrity
    const portCheck = await this.checkPortIntegrity(connection.sourcePort);
    checks.push(portCheck);

    // Check 2: Structure integrity (if bound)
    if (connection.structureId) {
      const structureCheck = this.checkStructureIntegrity(connection.structureId);
      checks.push(structureCheck);
    }

    // Check 3: Streaming integrity
    const streamCheck = this.checkStreamingIntegrity(connection.sourcePort);
    checks.push(streamCheck);

    // Store checks
    this.integrityChecks.set(connection.id, checks);

    // Update connection status
    const allPassed = checks.every(c => c.result === 'pass');
    const anyFailed = checks.some(c => c.result === 'fail');

    connection.integrityStatus = allPassed ? 'verified' : anyFailed ? 'compromised' : 'pending';

    // Update portal integrity score
    this.updatePortalIntegrityScore(portal, checks);

    console.log(`🔍 Integrity check completed for connection ${connection.id}: ${connection.integrityStatus}`);
  }

  private async checkPortIntegrity(port: number): Promise<IntegrityCheck> {
    const portStatus = portManagementCore.getPortStatus(port);
    
    return {
      connectionId: `port-${port}`,
      structureId: portStatus?.boundStructure || 'unbound',
      checkType: 'port',
      result: portStatus ? (portStatus.errorCount < 3 ? 'pass' : 'warning') : 'fail',
      details: portStatus ? `Port ${port}: ${portStatus.status}, errors: ${portStatus.errorCount}` : 'Port not found',
      timestamp: Date.now()
    };
  }

  private checkStructureIntegrity(structureId: string): IntegrityCheck {
    const structure = functionalStructures.getStructure(structureId);
    
    return {
      connectionId: structureId,
      structureId,
      checkType: 'structure',
      result: structure?.operational ? 'pass' : 'fail',
      details: structure ? `Structure ${structure.name}: ${structure.operational ? 'operational' : 'offline'}, power: ${structure.powerLevel}%` : 'Structure not found',
      timestamp: Date.now()
    };
  }

  private checkStreamingIntegrity(port: number): IntegrityCheck {
    const streams = streamingService.getActiveStreams();
    const activeStreams = streams.length;
    
    return {
      connectionId: `stream-${port}`,
      structureId: 'streaming',
      checkType: 'stream',
      result: activeStreams > 0 ? 'pass' : 'warning',
      details: `Active streams: ${activeStreams}`,
      timestamp: Date.now()
    };
  }

  private updatePortalIntegrityScore(portal: LandingPortal, checks: IntegrityCheck[]) {
    const passCount = checks.filter(c => c.result === 'pass').length;
    const totalChecks = checks.length;
    
    const checkScore = (passCount / totalChecks) * 100;
    const loadPenalty = (portal.failedConnections.length / portal.capacity) * 20;
    
    portal.integrityScore = Math.max(0, Math.min(100, checkScore - loadPenalty));
  }

  private async validateAllConnections() {
    const portLandscape = portManagementCore.getPortLandscape();
    
    for (const port of portLandscape.ports) {
      if (port.status === 'error' || port.errorCount > 2) {
        const existingConnection = Array.from(this.failedConnections.values())
          .find(fc => fc.sourcePort === port.port && fc.integrityStatus === 'pending');
        
        if (!existingConnection) {
          this.handleFailedConnection(port.port, `Port status: ${port.status}`, port.errorCount);
        }
      }
    }
  }

  private updatePortalIntegrity() {
    for (const portal of this.landingPortals.values()) {
      // Remove resolved connections
      portal.failedConnections = portal.failedConnections.filter(connId => {
        const connection = this.failedConnections.get(connId);
        return connection && connection.integrityStatus !== 'verified';
      });

      // Recalculate integrity score
      const totalChecks = portal.failedConnections.length;
      if (totalChecks === 0) {
        portal.integrityScore = 100;
      }
    }
  }

  private processFailedConnections() {
    for (const [connId, connection] of this.failedConnections) {
      if (connection.integrityStatus === 'verified' && connection.retryCount < 5) {
        // Attempt recovery
        console.log(`🔄 Attempting recovery for connection ${connId}`);
        this.attemptConnectionRecovery(connection);
      } else if (connection.retryCount >= 5) {
        // Mark as permanent failure
        connection.integrityStatus = 'compromised';
        console.log(`⚠️ Connection ${connId} marked as permanently failed`);
      }
    }
  }

  private async attemptConnectionRecovery(connection: FailedConnection) {
    const portStatus = portManagementCore.getPortStatus(connection.sourcePort);
    
    if (portStatus?.status === 'active' && portStatus.errorCount === 0) {
      // Connection recovered
      this.failedConnections.delete(connection.id);
      console.log(`✅ Connection ${connection.id} recovered successfully`);
      this.emit('connection:recovered', connection);
    }
  }

  private validateBypassIntegrity(bypass: any) {
    const integrityCheck: IntegrityCheck = {
      connectionId: bypass.id,
      structureId: 'bypass-route',
      checkType: 'port',
      result: bypass.active ? 'pass' : 'fail',
      details: `Bypass route: ${bypass.fromPort} → ${bypass.toPort}`,
      timestamp: Date.now()
    };

    console.log(`✅ Bypass integrity validated: ${integrityCheck.result}`);
  }

  // Public API
  getIntegrityReport() {
    const portals = Array.from(this.landingPortals.values());
    const connections = Array.from(this.failedConnections.values());

    return {
      portals: portals.map(p => ({
        id: p.id,
        name: p.name,
        port: p.port,
        status: p.status,
        integrityScore: p.integrityScore,
        failedConnectionsCount: p.failedConnections.length,
        capacity: p.capacity,
        utilization: Math.round((p.failedConnections.length / p.capacity) * 100)
      })),
      failedConnections: {
        total: connections.length,
        pending: connections.filter(c => c.integrityStatus === 'pending').length,
        verified: connections.filter(c => c.integrityStatus === 'verified').length,
        compromised: connections.filter(c => c.integrityStatus === 'compromised').length
      },
      integrityChecks: {
        total: Array.from(this.integrityChecks.values()).flat().length,
        passed: Array.from(this.integrityChecks.values()).flat().filter(c => c.result === 'pass').length,
        failed: Array.from(this.integrityChecks.values()).flat().filter(c => c.result === 'fail').length,
        warnings: Array.from(this.integrityChecks.values()).flat().filter(c => c.result === 'warning').length
      },
      fccEntity: '20130314143016',
      timestamp: Date.now()
    };
  }

  getPortalDetails(portalId: string) {
    const portal = this.landingPortals.get(portalId);
    if (!portal) return null;

    const connections = portal.failedConnections.map(connId => {
      const conn = this.failedConnections.get(connId);
      const checks = this.integrityChecks.get(connId) || [];
      return {
        connection: conn,
        integrityChecks: checks
      };
    });

    return {
      portal,
      connections,
      summary: {
        totalConnections: connections.length,
        averageIntegrity: portal.integrityScore,
        fccCompliant: portal.fccCompliant
      }
    };
  }

  getConnectionDetails(connectionId: string) {
    const connection = this.failedConnections.get(connectionId);
    const checks = this.integrityChecks.get(connectionId) || [];

    return {
      connection,
      integrityChecks: checks,
      recommendation: this.getRecoveryRecommendation(connection, checks)
    };
  }

  private getRecoveryRecommendation(connection: FailedConnection | undefined, checks: IntegrityCheck[]) {
    if (!connection) return 'Connection not found';

    const failedChecks = checks.filter(c => c.result === 'fail');
    
    if (failedChecks.length === 0) {
      return 'Connection can be safely retried';
    }

    if (failedChecks.some(c => c.checkType === 'structure')) {
      return 'Structure requires repair before retry';
    }

    if (failedChecks.some(c => c.checkType === 'port')) {
      return 'Port requires reset or bypass';
    }

    return 'Manual intervention required';
  }

  shutdown() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    console.log('🔌 Content Integrity Service shutdown');
  }
}

export const contentIntegrityService = ContentIntegrityService.getInstance();
