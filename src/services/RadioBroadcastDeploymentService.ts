
import { EventEmitter } from 'events';
import { sportsRadioService } from './SportsRadioService.js';
import { streamingService } from './StreamingService.js';

interface RadioDeployment {
  id: string;
  sportsbookId: string;
  sportsbookName: string;
  radioStreams: string[];
  status: 'pending' | 'deploying' | 'active' | 'failed';
  deployedAt?: number;
  listeners: number;
}

interface DeploymentSummary {
  totalSportsbooks: number;
  successfulDeployments: number;
  failedDeployments: number;
  totalRadioStreams: number;
  totalListeners: number;
  timestamp: number;
}

export class RadioBroadcastDeploymentService extends EventEmitter {
  private static instance: RadioBroadcastDeploymentService;
  private deployments: Map<string, RadioDeployment> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.initializeService();
  }

  static getInstance(): RadioBroadcastDeploymentService {
    if (!RadioBroadcastDeploymentService.instance) {
      RadioBroadcastDeploymentService.instance = new RadioBroadcastDeploymentService();
    }
    return RadioBroadcastDeploymentService.instance;
  }

  private initializeService() {
    console.log('📻 Initializing Radio Broadcast Deployment Service...');

    // Start monitoring deployments
    this.monitoringInterval = setInterval(() => {
      this.updateDeploymentMetrics();
    }, 10000);

    console.log('✅ Radio Broadcast Deployment Service initialized');
  }

  async deployToAllSportsbooks(): Promise<DeploymentSummary> {
    console.log('🚀 Starting radio broadcast deployment to all sportsbooks...');

    // Get all sportsbooks
    const sportsbooks = streamingService.getStreamingPartners();
    const radioStreams = sportsRadioService.getLiveRadioStreams();

    let successCount = 0;
    let failCount = 0;

    // Deploy to each sportsbook
    for (const sportsbook of sportsbooks) {
      try {
        const deploymentId = await this.deployToSportsbook(sportsbook.id, sportsbook.name, radioStreams);
        
        if (deploymentId) {
          successCount++;
          console.log(`✅ Deployed radio to ${sportsbook.name}`);
        } else {
          failCount++;
          console.log(`❌ Failed to deploy radio to ${sportsbook.name}`);
        }
      } catch (error) {
        failCount++;
        console.error(`❌ Error deploying to ${sportsbook.name}:`, error);
      }
    }

    const summary: DeploymentSummary = {
      totalSportsbooks: sportsbooks.length,
      successfulDeployments: successCount,
      failedDeployments: failCount,
      totalRadioStreams: radioStreams.length,
      totalListeners: this.getTotalListeners(),
      timestamp: Date.now()
    };

    this.emit('deployment:complete', summary);
    console.log(`📊 Deployment complete: ${successCount}/${sportsbooks.length} successful`);

    return summary;
  }

  private async deployToSportsbook(
    sportsbookId: string,
    sportsbookName: string,
    radioStreams: any[]
  ): Promise<string | null> {
    const deploymentId = `radio_deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const deployment: RadioDeployment = {
      id: deploymentId,
      sportsbookId,
      sportsbookName,
      radioStreams: radioStreams.map(s => s.id),
      status: 'pending',
      listeners: 0
    };

    this.deployments.set(deploymentId, deployment);

    // Simulate deployment process
    deployment.status = 'deploying';
    this.emit('deployment:started', deployment);

    // Wait for deployment to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mark as active
    deployment.status = 'active';
    deployment.deployedAt = Date.now();
    deployment.listeners = Math.floor(Math.random() * 10000) + 1000;

    this.emit('deployment:activated', deployment);

    return deploymentId;
  }

  async deploySingleSportsbook(sportsbookId: string): Promise<string | null> {
    const sportsbooks = streamingService.getStreamingPartners();
    const sportsbook = sportsbooks.find(s => s.id === sportsbookId);

    if (!sportsbook) {
      throw new Error('Sportsbook not found');
    }

    const radioStreams = sportsRadioService.getLiveRadioStreams();
    return this.deployToSportsbook(sportsbookId, sportsbook.name, radioStreams);
  }

  async deployByLeague(league: string): Promise<DeploymentSummary> {
    console.log(`📻 Deploying ${league} radio streams to all sportsbooks...`);

    const sportsbooks = streamingService.getStreamingPartners();
    const radioStreams = sportsRadioService.getRadioStreamsByLeague(league);

    let successCount = 0;
    let failCount = 0;

    for (const sportsbook of sportsbooks) {
      try {
        const deploymentId = await this.deployToSportsbook(sportsbook.id, sportsbook.name, radioStreams);
        if (deploymentId) successCount++;
        else failCount++;
      } catch (error) {
        failCount++;
      }
    }

    return {
      totalSportsbooks: sportsbooks.length,
      successfulDeployments: successCount,
      failedDeployments: failCount,
      totalRadioStreams: radioStreams.length,
      totalListeners: this.getTotalListeners(),
      timestamp: Date.now()
    };
  }

  private updateDeploymentMetrics() {
    for (const [id, deployment] of this.deployments) {
      if (deployment.status === 'active') {
        // Update listener counts
        const variance = Math.floor(Math.random() * 200) - 100;
        deployment.listeners = Math.max(100, deployment.listeners + variance);
      }
    }
  }

  getDeploymentStatus(): {
    totalDeployments: number;
    activeDeployments: number;
    totalListeners: number;
    deployments: RadioDeployment[];
  } {
    const deployments = Array.from(this.deployments.values());

    return {
      totalDeployments: deployments.length,
      activeDeployments: deployments.filter(d => d.status === 'active').length,
      totalListeners: this.getTotalListeners(),
      deployments
    };
  }

  private getTotalListeners(): number {
    return Array.from(this.deployments.values())
      .filter(d => d.status === 'active')
      .reduce((sum, d) => sum + d.listeners, 0);
  }

  getDeployment(deploymentId: string): RadioDeployment | undefined {
    return this.deployments.get(deploymentId);
  }

  getAllDeployments(): RadioDeployment[] {
    return Array.from(this.deployments.values());
  }

  shutdown() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    console.log('🛑 Radio Broadcast Deployment Service shutdown');
  }
}

export const radioBroadcastDeploymentService = RadioBroadcastDeploymentService.getInstance();
