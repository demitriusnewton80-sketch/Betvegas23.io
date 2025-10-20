
import { EventEmitter } from 'events';
import { terminalBridgeCore } from './TerminalBridgeCore.js';
import { portManagementCore } from './PortManagementCore.js';
import { fusionAssemblyCore } from './FusionAssemblyCore.js';
import { appCore } from './AppCore.js';

interface CorePosition {
  id: string;
  type: 'think-or-swim' | 'trading' | 'deployment' | 'bridge' | 'port';
  mappingId: string;
  active: boolean;
  syncStatus: 'synced' | 'pending' | 'failed';
  timestamp: number;
}

interface BridgePortMapping {
  id: string;
  bridgeCommand: string;
  portNumber: number;
  deploymentControl: string;
  corePosition: CorePosition;
  fusionStatus: 'active' | 'inactive' | 'syncing';
}

interface DeploymentControl {
  id: string;
  command: string;
  targetPort: number;
  bridgeLinked: boolean;
  mappingComplete: boolean;
  thinkOrSwimPosition?: any;
}

export class BridgePortFusionCore extends EventEmitter {
  private static instance: BridgePortFusionCore;
  private mappings: Map<string, BridgePortMapping> = new Map();
  private corePositions: Map<string, CorePosition> = new Map();
  private deploymentControls: Map<string, DeploymentControl> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private fusionActive = false;

  private constructor() {
    super();
    this.initializeFusion();
  }

  static getInstance(): BridgePortFusionCore {
    if (!BridgePortFusionCore.instance) {
      BridgePortFusionCore.instance = new BridgePortFusionCore();
    }
    return BridgePortFusionCore.instance;
  }

  private initializeFusion() {
    console.log('🔗 Initializing Bridge-Port Fusion Core...');

    // Listen to terminal bridge events
    terminalBridgeCore.on('command:completed', (cmd) => {
      this.syncBridgeToPort(cmd);
    });

    // Listen to port management events
    portManagementCore.on('port:failed', (data) => {
      this.handlePortFailure(data);
    });

    // Listen to fusion assembly events
    fusionAssemblyCore.on('assembly:completed', (assembly) => {
      this.integrateAssembly(assembly);
    });

    // Start continuous sync
    this.syncInterval = setInterval(() => {
      this.syncAllMappings();
    }, 5000);

    this.fusionActive = true;
    console.log('✅ Bridge-Port Fusion Core initialized');
  }

  // Create core position mapping (Think or Swim style)
  async createCorePosition(type: CorePosition['type'], metadata: any): Promise<string> {
    const positionId = `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const position: CorePosition = {
      id: positionId,
      type,
      mappingId: '',
      active: true,
      syncStatus: 'pending',
      timestamp: Date.now()
    };

    this.corePositions.set(positionId, position);

    // Sync to fusion assembly
    await fusionAssemblyCore.sync('core-position', {
      positionId,
      type,
      metadata,
      timestamp: new Date().toISOString()
    });

    console.log(`📊 Core position created: ${positionId} (${type})`);
    this.emit('position:created', position);

    return positionId;
  }

  // Map bridge command to port with deployment control
  async mapBridgeToPort(
    bridgeCommand: string,
    portNumber: number,
    deploymentCommand: string
  ): Promise<string> {
    const mappingId = `map_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create core position for this mapping
    const positionId = await this.createCorePosition('deployment', {
      bridgeCommand,
      portNumber,
      deploymentCommand
    });

    const position = this.corePositions.get(positionId)!;
    position.mappingId = mappingId;

    const mapping: BridgePortMapping = {
      id: mappingId,
      bridgeCommand,
      portNumber,
      deploymentControl: deploymentCommand,
      corePosition: position,
      fusionStatus: 'syncing'
    };

    this.mappings.set(mappingId, mapping);

    // Execute bridge command
    await terminalBridgeCore.executeCommand(bridgeCommand, 'deployment');

    // Bind to port
    const portStatus = portManagementCore.getPortStatus(portNumber);
    if (!portStatus) {
      console.warn(`⚠️ Port ${portNumber} not available, finding alternative...`);
      // Port management will auto-create bypass if needed
    }

    // Create deployment control
    await this.createDeploymentControl(mappingId, deploymentCommand, portNumber);

    mapping.fusionStatus = 'active';
    position.syncStatus = 'synced';

    console.log(`🔗 Bridge-Port mapping created: ${mappingId}`);
    this.emit('mapping:created', mapping);

    return mappingId;
  }

  // Create deployment control linked to bridge and port
  private async createDeploymentControl(
    mappingId: string,
    command: string,
    targetPort: number
  ): Promise<void> {
    const controlId = `ctrl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const control: DeploymentControl = {
      id: controlId,
      command,
      targetPort,
      bridgeLinked: false,
      mappingComplete: false
    };

    this.deploymentControls.set(controlId, control);

    // Fuse deployment controls into terminal bridge
    await terminalBridgeCore.fuseDeploymentControls();

    // Link to bridge
    control.bridgeLinked = true;

    // Execute deployment command through bridge
    await terminalBridgeCore.executeDeploymentCommand({
      controlId,
      command,
      targetPort,
      mappingId
    });

    control.mappingComplete = true;

    // Broadcast to app core
    appCore.broadcastMessage('deployment:control:fused', {
      controlId,
      mappingId,
      targetPort,
      command
    });

    console.log(`🚀 Deployment control created: ${controlId}`);
    this.emit('control:created', control);
  }

  // Sync bridge command execution to port
  private async syncBridgeToPort(cmd: any): Promise<void> {
    // Find mappings that use this command
    for (const [mappingId, mapping] of this.mappings.entries()) {
      if (mapping.bridgeCommand === cmd.command) {
        console.log(`🔄 Syncing bridge command to port ${mapping.portNumber}`);

        // Update port status
        const portStatus = portManagementCore.getPortStatus(mapping.portNumber);
        if (portStatus) {
          // Port is active, sync successful
          mapping.fusionStatus = 'active';
          mapping.corePosition.syncStatus = 'synced';
        } else {
          // Port issue, mark for resync
          mapping.fusionStatus = 'syncing';
          mapping.corePosition.syncStatus = 'pending';
        }

        this.emit('sync:completed', { mappingId, cmd });
      }
    }
  }

  // Handle port failures with bridge rerouting
  private async handlePortFailure(data: any): Promise<void> {
    const { port } = data;

    // Find mappings using this port
    for (const [mappingId, mapping] of this.mappings.entries()) {
      if (mapping.portNumber === port) {
        console.log(`⚠️ Port ${port} failed, rerouting bridge...`);

        // Get bypass route
        const bypasses = portManagementCore.getAllBypassRoutes();
        const bypass = bypasses.find(b => b.fromPort === port && b.active);

        if (bypass) {
          // Update mapping to new port
          mapping.portNumber = bypass.toPort;
          mapping.fusionStatus = 'syncing';

          // Re-execute bridge command to new port
          await terminalBridgeCore.executeCommand(
            mapping.bridgeCommand,
            'deployment'
          );

          console.log(`✅ Bridge rerouted: ${port} → ${bypass.toPort}`);
          this.emit('reroute:completed', { mappingId, oldPort: port, newPort: bypass.toPort });
        }
      }
    }
  }

  // Integrate fusion assembly results
  private async integrateAssembly(assembly: any): Promise<void> {
    console.log(`📦 Integrating assembly into bridge-port fusion: ${assembly.id}`);

    // Create core position for assembly
    const positionId = await this.createCorePosition('bridge', {
      assemblyId: assembly.id,
      components: assembly.components?.length || 0
    });

    // Sync assembly results to all active mappings
    for (const [mappingId, mapping] of this.mappings.entries()) {
      if (mapping.fusionStatus === 'active') {
        // Update mapping with assembly data
        mapping.corePosition.syncStatus = 'synced';

        this.emit('assembly:integrated', { mappingId, assemblyId: assembly.id });
      }
    }
  }

  // Sync all mappings continuously
  private async syncAllMappings(): Promise<void> {
    for (const [mappingId, mapping] of this.mappings.entries()) {
      if (mapping.fusionStatus === 'syncing') {
        // Check bridge status
        const bridgeStatus = terminalBridgeCore.getStatus();
        
        // Check port status
        const portStatus = portManagementCore.getPortStatus(mapping.portNumber);

        if (bridgeStatus.bridgeActive && portStatus && portStatus.status === 'active') {
          mapping.fusionStatus = 'active';
          mapping.corePosition.syncStatus = 'synced';
        }
      }
    }
  }

  // Build Think or Swim style position programming
  async buildThinkOrSwimPosition(
    strategy: string,
    parameters: any
  ): Promise<string> {
    const positionId = await this.createCorePosition('think-or-swim', {
      strategy,
      parameters,
      timestamp: new Date().toISOString()
    });

    const position = this.corePositions.get(positionId)!;

    // Map to deployment control
    const deploymentCommand = `echo "Executing ${strategy} with params: ${JSON.stringify(parameters)}"`;
    const mappingId = await this.mapBridgeToPort(
      deploymentCommand,
      5000,
      deploymentCommand
    );

    // Link position to deployment control
    const controls = Array.from(this.deploymentControls.values());
    const latestControl = controls[controls.length - 1];
    if (latestControl) {
      latestControl.thinkOrSwimPosition = {
        positionId,
        strategy,
        parameters
      };
    }

    console.log(`📊 Think or Swim position built: ${positionId}`);
    return positionId;
  }

  // Get comprehensive fusion status
  getStatus() {
    const mappings = Array.from(this.mappings.values());
    const positions = Array.from(this.corePositions.values());
    const controls = Array.from(this.deploymentControls.values());

    return {
      fusionActive: this.fusionActive,
      mappings: {
        total: mappings.length,
        active: mappings.filter(m => m.fusionStatus === 'active').length,
        syncing: mappings.filter(m => m.fusionStatus === 'syncing').length,
        inactive: mappings.filter(m => m.fusionStatus === 'inactive').length
      },
      corePositions: {
        total: positions.length,
        synced: positions.filter(p => p.syncStatus === 'synced').length,
        pending: positions.filter(p => p.syncStatus === 'pending').length,
        byType: this.groupByType(positions)
      },
      deploymentControls: {
        total: controls.length,
        bridgeLinked: controls.filter(c => c.bridgeLinked).length,
        mappingComplete: controls.filter(c => c.mappingComplete).length
      },
      integrations: {
        terminalBridge: terminalBridgeCore.getStatus().bridgeActive,
        portManagement: portManagementCore.getPortLandscape().activePorts,
        fusionAssembly: fusionAssemblyCore.getStatus().assemblies.completed
      },
      fccEntity: '20130314143016'
    };
  }

  private groupByType(positions: CorePosition[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    positions.forEach(p => {
      grouped[p.type] = (grouped[p.type] || 0) + 1;
    });
    return grouped;
  }

  // Get all mappings
  getAllMappings(): BridgePortMapping[] {
    return Array.from(this.mappings.values());
  }

  // Get all core positions
  getAllPositions(): CorePosition[] {
    return Array.from(this.corePositions.values());
  }

  // Get all deployment controls
  getAllControls(): DeploymentControl[] {
    return Array.from(this.deploymentControls.values());
  }

  shutdown() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.fusionActive = false;
    console.log('🛑 Bridge-Port Fusion Core shutdown');
  }
}

export const bridgePortFusionCore = BridgePortFusionCore.getInstance();
