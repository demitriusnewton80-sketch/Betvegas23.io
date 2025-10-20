
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

interface EnvironmentVariable {
  key: string;
  value: string;
  source: 'file' | 'env' | 'default';
  category: 'aws' | 'iot' | 'fcc' | 'general';
}

export class EnvironmentLoaderService extends EventEmitter {
  private static instance: EnvironmentLoaderService;
  private variables: Map<string, EnvironmentVariable> = new Map();
  private loaded = false;

  private constructor() {
    super();
  }

  static getInstance(): EnvironmentLoaderService {
    if (!EnvironmentLoaderService.instance) {
      EnvironmentLoaderService.instance = new EnvironmentLoaderService();
    }
    return EnvironmentLoaderService.instance;
  }

  async loadFromCertificate(): Promise<void> {
    console.log('📋 Loading environment from AWS IoT certificate...');

    const certPath = path.join(process.cwd(), 'attached_assets', 'device.pem_1761002939640.crt');
    const rootCAPath = path.join(process.cwd(), 'attached_assets', 'AmazonRootCA1_1761002495172.pem');

    // Load certificate-based environment variables
    const envVars: EnvironmentVariable[] = [
      {
        key: 'AWS_IOT_CERTIFICATE_PATH',
        value: certPath,
        source: 'file',
        category: 'iot'
      },
      {
        key: 'AWS_IOT_ROOT_CA_PATH',
        value: rootCAPath,
        source: 'file',
        category: 'iot'
      },
      {
        key: 'AWS_IOT_THING_NAME',
        value: process.env.AWS_IOT_THING_NAME || 'BettingSites-IoT-Device',
        source: process.env.AWS_IOT_THING_NAME ? 'env' : 'default',
        category: 'iot'
      },
      {
        key: 'AWS_REGION',
        value: process.env.AWS_REGION || 'us-east-1',
        source: process.env.AWS_REGION ? 'env' : 'default',
        category: 'aws'
      },
      {
        key: 'FCC_ENTITY',
        value: '20130314143016',
        source: 'default',
        category: 'fcc'
      },
      {
        key: 'FCC_REGISTRATION',
        value: '0024454324',
        source: 'default',
        category: 'fcc'
      }
    ];

    // Add AWS service defaults
    const awsServices = ['S3', 'DYNAMODB', 'LAMBDA', 'EC2', 'RDS'];
    awsServices.forEach(service => {
      envVars.push({
        key: `AWS_${service}_ENABLED`,
        value: 'true',
        source: 'default',
        category: 'aws'
      });
    });

    // Store all variables
    envVars.forEach(envVar => {
      this.variables.set(envVar.key, envVar);
      // Set process.env for backward compatibility
      if (!process.env[envVar.key]) {
        process.env[envVar.key] = envVar.value;
      }
    });

    this.loaded = true;
    console.log(`✅ Loaded ${envVars.length} environment variables`);
    this.emit('loaded', { count: envVars.length });
  }

  get(key: string): string | undefined {
    const envVar = this.variables.get(key);
    return envVar?.value || process.env[key];
  }

  getAll(): EnvironmentVariable[] {
    return Array.from(this.variables.values());
  }

  getByCategory(category: EnvironmentVariable['category']): EnvironmentVariable[] {
    return Array.from(this.variables.values()).filter(v => v.category === category);
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  getStatus() {
    return {
      loaded: this.loaded,
      totalVariables: this.variables.size,
      byCategory: {
        aws: this.getByCategory('aws').length,
        iot: this.getByCategory('iot').length,
        fcc: this.getByCategory('fcc').length,
        general: this.getByCategory('general').length
      },
      bySource: {
        file: Array.from(this.variables.values()).filter(v => v.source === 'file').length,
        env: Array.from(this.variables.values()).filter(v => v.source === 'env').length,
        default: Array.from(this.variables.values()).filter(v => v.source === 'default').length
      }
    };
  }
}

export const environmentLoader = EnvironmentLoaderService.getInstance();
