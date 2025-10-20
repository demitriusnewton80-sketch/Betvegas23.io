
import { EventEmitter } from 'events';

export interface ServiceDescriptor {
  name: string;
  instance: any;
  singleton: boolean;
  dependencies?: string[];
}

export class ServiceContainer extends EventEmitter {
  private static instance: ServiceContainer;
  private services: Map<string, ServiceDescriptor>;
  private singletons: Map<string, any>;

  private constructor() {
    super();
    this.services = new Map();
    this.singletons = new Map();
  }

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  // Register a service with Microsoft-style dependency injection
  register<T>(
    name: string,
    factory: (...deps: any[]) => T,
    options: { singleton?: boolean; dependencies?: string[] } = {}
  ): void {
    this.services.set(name, {
      name,
      instance: factory,
      singleton: options.singleton ?? true,
      dependencies: options.dependencies ?? []
    });

    this.emit('service:registered', { name, options });
  }

  // Resolve a service with dependency injection
  resolve<T>(name: string): T {
    if (this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    const descriptor = this.services.get(name);
    if (!descriptor) {
      throw new Error(`Service '${name}' not found in container`);
    }

    // Resolve dependencies first
    const deps = (descriptor.dependencies || []).map(dep => this.resolve(dep));
    
    // Create instance
    const instance = descriptor.instance(...deps);

    // Cache singleton
    if (descriptor.singleton) {
      this.singletons.set(name, instance);
    }

    this.emit('service:resolved', { name, singleton: descriptor.singleton });
    return instance;
  }

  // Get all registered services
  getServices(): string[] {
    return Array.from(this.services.keys());
  }

  // Health check for all services
  async healthCheck(): Promise<Map<string, boolean>> {
    const health = new Map<string, boolean>();
    
    for (const [name, descriptor] of this.services) {
      try {
        const instance = this.resolve(name);
        health.set(name, instance ? true : false);
      } catch (error) {
        health.set(name, false);
      }
    }

    return health;
  }

  // Clear all services (for testing)
  clear(): void {
    this.services.clear();
    this.singletons.clear();
    this.emit('container:cleared');
  }
}

export const serviceContainer = ServiceContainer.getInstance();
