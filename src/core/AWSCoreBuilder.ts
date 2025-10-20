
import { EventEmitter } from 'events';
import { arnFinderService } from '../services/ARNFinderService.js';
import { ecommerceService } from '../services/ECommerceService.js';
import { appCore } from './AppCore.js';
import { fusionAssemblyCore } from './FusionAssemblyCore.js';
import { bridgePortFusionCore } from './BridgePortFusionCore.js';
import fs from 'fs/promises';
import path from 'path';

interface AWSCoreConnection {
  id: string;
  accountId: string;
  region: string;
  rootCA: string;
  arns: string[];
  coreBuilt: boolean;
  timestamp: number;
}

interface AWSResource {
  arn: string;
  service: string;
  resourceType: string;
  region: string;
  status: 'active' | 'pending' | 'failed';
}

export class AWSCoreBuilder extends EventEmitter {
  private static instance: AWSCoreBuilder;
  private connections: Map<string, AWSCoreConnection> = new Map();
  private resources: Map<string, AWSResource> = new Map();
  private rootCAPath: string;
  private coreActive = false;

  private constructor() {
    super();
    this.rootCAPath = path.join(process.cwd(), 'attached_assets', 'AmazonRootCA1_1761002495172.pem');
    this.initializeCore();
  }

  static getInstance(): AWSCoreBuilder {
    if (!AWSCoreBuilder.instance) {
      AWSCoreBuilder.instance = new AWSCoreBuilder();
    }
    return AWSCoreBuilder.instance;
  }

  private async initializeCore() {
    console.log('🔗 Initializing AWS Core Builder...');

    // Verify Root CA exists
    try {
      await fs.access(this.rootCAPath);
      console.log('✅ Amazon Root CA verified');
    } catch (error) {
      console.warn('⚠️ Amazon Root CA not found at expected path');
    }

    // Verify IoT device certificate
    const deviceCertPath = path.join(process.cwd(), 'attached_assets', 'device.pem_1761002939640.crt');
    try {
      await fs.access(deviceCertPath);
      console.log('✅ AWS IoT device certificate verified');
    } catch (error) {
      console.warn('⚠️ AWS IoT device certificate not found');
    }

    // Register with app core
    appCore.registerBackgroundService('aws-core-builder', 'backup');

    // Listen to ARN finder events
    arnFinderService.on('arn:cached', (arn) => {
      this.handleARNDiscovery(arn);
    });

    this.coreActive = true;
    console.log('✅ AWS Core Builder initialized');
  }

  // Build AWS core connection using ARN
  async buildCoreConnection(
    userId: string,
    accountId: string,
    region: string
  ): Promise<string> {
    const connectionId = `aws-core-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Read Root CA certificate
    let rootCA = '';
    try {
      rootCA = await fs.readFile(this.rootCAPath, 'utf-8');
    } catch (error) {
      console.warn('⚠️ Could not read Root CA, proceeding without certificate');
    }

    const connection: AWSCoreConnection = {
      id: connectionId,
      accountId,
      region,
      rootCA,
      arns: [],
      coreBuilt: false,
      timestamp: Date.now()
    };

    this.connections.set(connectionId, connection);

    // Connect AWS in ecommerce service
    ecommerceService.connectAWS(userId, accountId, region, []);

    // Create base ARN for the account
    const baseARN = arnFinderService.buildARN('iam', region, accountId, 'root', '');
    
    if (arnFinderService.validateARN(baseARN)) {
      connection.arns.push(baseARN);
      
      // Parse and cache the ARN
      const parsed = arnFinderService.parseARN(baseARN);
      if (parsed) {
        console.log(`📋 Base ARN created: ${baseARN}`);
      }
    }

    // Sync to fusion assembly
    await fusionAssemblyCore.sync('aws-core-connection', {
      connectionId,
      accountId,
      region,
      rootCA: rootCA ? 'verified' : 'missing',
      timestamp: new Date().toISOString()
    });

    // Create core position in bridge-port fusion
    await bridgePortFusionCore.createCorePosition('bridge', {
      connectionId,
      awsAccountId: accountId,
      region,
      service: 'aws-core'
    });

    connection.coreBuilt = true;

    console.log(`🏗️ AWS Core connection built: ${connectionId}`);
    this.emit('core:built', connection);

    return connectionId;
  }

  // Add AWS resource using ARN
  async addResource(
    connectionId: string,
    service: string,
    resourceType: string,
    resourceId: string
  ): Promise<string> {
    const connection = this.connections.get(connectionId);
    
    if (!connection) {
      throw new Error('AWS Core connection not found');
    }

    // Build ARN for the resource
    const arn = arnFinderService.buildARN(
      service,
      connection.region,
      connection.accountId,
      resourceType,
      resourceId
    );

    if (!arnFinderService.validateARN(arn)) {
      throw new Error('Invalid ARN generated');
    }

    const resource: AWSResource = {
      arn,
      service,
      resourceType,
      region: connection.region,
      status: 'pending'
    };

    this.resources.set(arn, resource);
    connection.arns.push(arn);

    // Parse and analyze the ARN
    const parsed = arnFinderService.parseARN(arn);
    
    // Sync to fusion assembly
    await fusionAssemblyCore.sync('aws-resource', {
      arn,
      service,
      resourceType,
      connectionId,
      timestamp: new Date().toISOString()
    });

    resource.status = 'active';

    console.log(`✅ AWS Resource added: ${arn}`);
    this.emit('resource:added', resource);

    return arn;
  }

  // Discover existing ARNs in project and connect them
  async discoverAndConnect(userId: string): Promise<{
    totalFound: number;
    connected: number;
    arns: string[];
  }> {
    console.log('🔍 Discovering ARNs in project...');

    // Search project for ARNs
    const projectRoot = path.join(process.cwd());
    const searchResults = await arnFinderService.findARNsInDirectory(projectRoot, true);

    const connectedARNs: string[] = [];

    // Group by account
    const byAccount = arnFinderService.groupByAccount(searchResults.arns);

    // Create connections for each account found
    for (const [accountId, arns] of Object.entries(byAccount)) {
      if (arns.length > 0) {
        const region = arns[0].region || 'us-east-1';
        
        try {
          const connectionId = await this.buildCoreConnection(userId, accountId, region);
          
          // Add each ARN as a resource
          for (const arnInfo of arns) {
            const resource: AWSResource = {
              arn: arnInfo.arn,
              service: arnInfo.service,
              resourceType: arnInfo.resourceType,
              region: arnInfo.region,
              status: 'active'
            };
            
            this.resources.set(arnInfo.arn, resource);
            connectedARNs.push(arnInfo.arn);
          }
        } catch (error) {
          console.error(`Failed to connect account ${accountId}:`, error);
        }
      }
    }

    console.log(`✅ Discovered ${searchResults.totalFound} ARNs, connected ${connectedARNs.length}`);
    
    return {
      totalFound: searchResults.totalFound,
      connected: connectedARNs.length,
      arns: connectedARNs
    };
  }

  // Handle ARN discovery from ARN finder service
  private handleARNDiscovery(arnData: any) {
    if (arnData.arn && arnData.accountId) {
      // Check if we have a connection for this account
      const connection = Array.from(this.connections.values()).find(
        c => c.accountId === arnData.accountId
      );

      if (connection && !connection.arns.includes(arnData.arn)) {
        connection.arns.push(arnData.arn);
        
        const resource: AWSResource = {
          arn: arnData.arn,
          service: arnData.service || 'unknown',
          resourceType: arnData.resourceType || 'unknown',
          region: arnData.region || connection.region,
          status: 'active'
        };
        
        this.resources.set(arnData.arn, resource);
        
        console.log(`📡 Auto-connected discovered ARN: ${arnData.arn}`);
      }
    }
  }

  // Build core infrastructure for specific AWS services
  async buildServiceCore(
    connectionId: string,
    service: 's3' | 'ec2' | 'lambda' | 'dynamodb' | 'rds'
  ): Promise<string[]> {
    const connection = this.connections.get(connectionId);
    
    if (!connection) {
      throw new Error('AWS Core connection not found');
    }

    const createdARNs: string[] = [];

    // Service-specific resource patterns
    const servicePatterns: Record<string, string[]> = {
      s3: ['bucket/streaming-data', 'bucket/backup-data', 'bucket/public-content'],
      ec2: ['instance/app-server', 'instance/api-server'],
      lambda: ['function/data-processor', 'function/event-handler'],
      dynamodb: ['table/users', 'table/sessions', 'table/analytics'],
      rds: ['db/production', 'db/analytics']
    };

    const patterns = servicePatterns[service] || [];

    for (const pattern of patterns) {
      const [resourceType, resourceId] = pattern.split('/');
      
      try {
        const arn = await this.addResource(
          connectionId,
          service,
          resourceType,
          resourceId
        );
        
        createdARNs.push(arn);
      } catch (error) {
        console.error(`Failed to create ${service} resource ${pattern}:`, error);
      }
    }

    console.log(`🏗️ Built ${service} core with ${createdARNs.length} resources`);
    return createdARNs;
  }

  // Get core status
  getStatus() {
    const connections = Array.from(this.connections.values());
    const resources = Array.from(this.resources.values());

    return {
      coreActive: this.coreActive,
      totalConnections: connections.length,
      builtConnections: connections.filter(c => c.coreBuilt).length,
      totalResources: resources.length,
      activeResources: resources.filter(r => r.status === 'active').length,
      byService: this.groupResourcesByService(),
      byRegion: this.groupResourcesByRegion(),
      connections: connections.map(c => ({
        id: c.id,
        accountId: c.accountId,
        region: c.region,
        arnCount: c.arns.length,
        coreBuilt: c.coreBuilt,
        hasRootCA: !!c.rootCA
      })),
      fccEntity: '20130314143016'
    };
  }

  private groupResourcesByService(): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    this.resources.forEach(resource => {
      grouped[resource.service] = (grouped[resource.service] || 0) + 1;
    });
    
    return grouped;
  }

  private groupResourcesByRegion(): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    this.resources.forEach(resource => {
      grouped[resource.region] = (grouped[resource.region] || 0) + 1;
    });
    
    return grouped;
  }

  // Get all connections
  getConnections(): AWSCoreConnection[] {
    return Array.from(this.connections.values());
  }

  // Get all resources
  getResources(): AWSResource[] {
    return Array.from(this.resources.values());
  }

  // Get connection by ID
  getConnection(connectionId: string): AWSCoreConnection | undefined {
    return this.connections.get(connectionId);
  }

  // Get resource by ARN
  getResource(arn: string): AWSResource | undefined {
    return this.resources.get(arn);
  }
}

export const awsCoreBuilder = AWSCoreBuilder.getInstance();
