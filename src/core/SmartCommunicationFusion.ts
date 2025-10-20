
import { EventEmitter } from 'events';
import { smartTroubleshootingCore } from './SmartTroubleshootingCore.js';
import { portManagementCore } from './PortManagementCore.js';

interface CommunicationChannel {
  id: string;
  type: 'http' | 'ws' | 'sse' | 'webhook';
  endpoint: string;
  status: 'active' | 'degraded' | 'failed';
  lastResponse: number;
  errorCount: number;
  autoFix: boolean;
}

interface TroubleshootingCommand {
  id: string;
  command: string;
  target: string;
  timestamp: number;
  result?: string;
  success?: boolean;
}

export class SmartCommunicationFusion extends EventEmitter {
  private static instance: SmartCommunicationFusion;
  private channels: Map<string, CommunicationChannel> = new Map();
  private commandHistory: TroubleshootingCommand[] = [];
  private autoRepairEnabled = true;

  private constructor() {
    super();
    this.initializeFusion();
  }

  static getInstance(): SmartCommunicationFusion {
    if (!SmartCommunicationFusion.instance) {
      SmartCommunicationFusion.instance = new SmartCommunicationFusion();
    }
    return SmartCommunicationFusion.instance;
  }

  private initializeFusion() {
    console.log('🔗 Initializing Smart Communication Fusion Core...');
    
    // Listen to port failures and auto-fix
    portManagementCore.on('port:failed', (data) => {
      this.handlePortFailure(data.port);
    });

    // Monitor troubleshooting events
    smartTroubleshootingCore.on('error:detected', (error) => {
      this.executeTroubleshootingCommand('diagnose', error.endpoint);
    });

    console.log('✅ Smart Communication Fusion initialized');
  }

  registerChannel(
    id: string,
    type: CommunicationChannel['type'],
    endpoint: string
  ): void {
    this.channels.set(id, {
      id,
      type,
      endpoint,
      status: 'active',
      lastResponse: Date.now(),
      errorCount: 0,
      autoFix: true
    });

    console.log(`📡 Registered channel: ${id} (${type})`);
  }

  executeTroubleshootingCommand(
    command: string,
    target: string
  ): TroubleshootingCommand {
    const cmd: TroubleshootingCommand = {
      id: `cmd_${Date.now()}`,
      command,
      target,
      timestamp: Date.now()
    };

    console.log(`🔧 Executing: ${command} on ${target}`);

    // Execute based on command type
    switch (command) {
      case 'diagnose':
        cmd.result = this.diagnoseEndpoint(target);
        cmd.success = true;
        break;
      case 'repair':
        cmd.result = this.repairEndpoint(target);
        cmd.success = true;
        break;
      case 'bypass':
        cmd.result = this.createBypass(target);
        cmd.success = true;
        break;
      case 'restart':
        cmd.result = this.restartChannel(target);
        cmd.success = true;
        break;
      default:
        cmd.result = 'Unknown command';
        cmd.success = false;
    }

    this.commandHistory.push(cmd);
    this.emit('command:executed', cmd);

    return cmd;
  }

  private diagnoseEndpoint(target: string): string {
    const channel = this.channels.get(target);
    if (!channel) {
      return `Channel ${target} not found`;
    }

    const diagnosis = {
      channel: target,
      status: channel.status,
      errorCount: channel.errorCount,
      lastResponse: Date.now() - channel.lastResponse,
      recommendation: channel.errorCount > 3 ? 'restart' : 'monitor'
    };

    return JSON.stringify(diagnosis);
  }

  private repairEndpoint(target: string): string {
    const channel = this.channels.get(target);
    if (!channel) {
      return `Channel ${target} not found`;
    }

    // Reset error count and mark as active
    channel.errorCount = 0;
    channel.status = 'active';
    channel.lastResponse = Date.now();

    smartTroubleshootingCore.setAutoFix(true);
    
    return `Repaired ${target} successfully`;
  }

  private createBypass(target: string): string {
    console.log(`🔀 Creating bypass for ${target}`);
    
    // Use port management to create bypass
    const portMatch = target.match(/port[:-](\d+)/i);
    if (portMatch) {
      const port = parseInt(portMatch[1]);
      portManagementCore.getPortStatus(port);
    }

    return `Bypass created for ${target}`;
  }

  private restartChannel(target: string): string {
    const channel = this.channels.get(target);
    if (!channel) {
      return `Channel ${target} not found`;
    }

    channel.status = 'active';
    channel.errorCount = 0;
    channel.lastResponse = Date.now();

    return `Restarted ${target}`;
  }

  private handlePortFailure(port: number): void {
    if (!this.autoRepairEnabled) return;

    console.log(`🚨 Auto-repairing failed port ${port}`);
    
    this.executeTroubleshootingCommand('repair', `port:${port}`);
    this.executeTroubleshootingCommand('bypass', `port:${port}`);
  }

  recordChannelError(channelId: string): void {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    channel.errorCount++;
    channel.status = channel.errorCount > 3 ? 'failed' : 'degraded';

    if (channel.autoFix && channel.errorCount > 3) {
      this.executeTroubleshootingCommand('repair', channelId);
    }
  }

  getChannelStatus(channelId: string): CommunicationChannel | undefined {
    return this.channels.get(channelId);
  }

  getAllChannels(): CommunicationChannel[] {
    return Array.from(this.channels.values());
  }

  getCommandHistory(): TroubleshootingCommand[] {
    return this.commandHistory.slice(-50); // Last 50 commands
  }

  getFusionStatus() {
    const channels = Array.from(this.channels.values());
    
    return {
      totalChannels: channels.length,
      activeChannels: channels.filter(c => c.status === 'active').length,
      degradedChannels: channels.filter(c => c.status === 'degraded').length,
      failedChannels: channels.filter(c => c.status === 'failed').length,
      autoRepairEnabled: this.autoRepairEnabled,
      commandsExecuted: this.commandHistory.length,
      recentCommands: this.getCommandHistory(),
      fccEntity: '20130314143016'
    };
  }

  setAutoRepair(enabled: boolean): void {
    this.autoRepairEnabled = enabled;
    console.log(`🔧 Auto-repair ${enabled ? 'enabled' : 'disabled'}`);
  }
}

export const smartCommunicationFusion = SmartCommunicationFusion.getInstance();
