
import { ServiceContainer } from './ServiceContainer.js';
import { AppCore } from './AppCore.js';
import { EventEmitter } from 'events';

export interface ApplicationConfiguration {
  environment: string;
  fccEntity: string;
  fccRegistration: string;
  services: Map<string, any>;
  middleware: Array<(req: any, res: any, next: any) => void>;
}

export class ApplicationBuilder extends EventEmitter {
  private configuration: ApplicationConfiguration;
  private serviceContainer: ServiceContainer;

  constructor() {
    super();
    this.serviceContainer = ServiceContainer.getInstance();
    this.configuration = {
      environment: process.env.NODE_ENV || 'development',
      fccEntity: '20130314143016',
      fccRegistration: '0024454324',
      services: new Map(),
      middleware: []
    };
  }

  // Configure services (Microsoft-style)
  configureServices(configurator: (container: ServiceContainer) => void): this {
    configurator(this.serviceContainer);
    this.emit('services:configured');
    return this;
  }

  // Add middleware (ASP.NET Core style)
  use(middleware: (req: any, res: any, next: any) => void): this {
    this.configuration.middleware.push(middleware);
    this.emit('middleware:added');
    return this;
  }

  // Configure application settings
  configure(settings: Partial<ApplicationConfiguration>): this {
    Object.assign(this.configuration, settings);
    this.emit('app:configured', settings);
    return this;
  }

  // Build and initialize the application
  async build(): Promise<ApplicationConfiguration> {
    console.log('🏗️  Building application (Microsoft-style architecture)...');
    
    // Initialize core services
    const appCore = AppCore.getInstance();
    appCore.initialize();

    // Register core application services
    this.serviceContainer.register('AppCore', () => appCore, { singleton: true });
    this.serviceContainer.register('Configuration', () => this.configuration, { singleton: true });

    // Perform health check
    const health = await this.serviceContainer.healthCheck();
    const healthyServices = Array.from(health.entries()).filter(([, healthy]) => healthy).length;
    
    console.log(`✅ Application built successfully`);
    console.log(`📦 Services registered: ${this.serviceContainer.getServices().length}`);
    console.log(`💚 Healthy services: ${healthyServices}/${health.size}`);

    this.emit('app:built', {
      services: this.serviceContainer.getServices().length,
      middleware: this.configuration.middleware.length,
      health: healthyServices
    });

    return this.configuration;
  }

  // Get service container
  getServiceContainer(): ServiceContainer {
    return this.serviceContainer;
  }

  // Get configuration
  getConfiguration(): ApplicationConfiguration {
    return this.configuration;
  }guration;
  }

  // Run application startup tasks
  async startup(): Promise<void> {
    console.log('🚀 Running startup tasks...');
    
    // Initialize all singleton services
    const services = this.serviceContainer.getServices();
    for (const serviceName of services) {
      try {
        this.serviceContainer.resolve(serviceName);
      } catch (error) {
        console.error(`Failed to initialize ${serviceName}:`, error);
      }
    }

    this.emit('app:started');
    console.log('✨ Application startup complete');
  }
}

export function createApplicationBuilder(): ApplicationBuilder {
  return new ApplicationBuilder();
}
