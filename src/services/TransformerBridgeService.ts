
import { EventEmitter } from 'events';
import { web3BridgeService } from './Web3BridgeService.js';
import { appCore } from '../core/AppCore.js';

interface TransformationRule {
  id: string;
  sourceType: 'sportsbook' | 'streaming' | 'ps5' | 'content';
  targetChain: string;
  transformFunction: (data: any) => any;
  enabled: boolean;
}

interface TransformedData {
  id: string;
  sourceId: string;
  sourceType: string;
  transformedAt: number;
  chainData: any;
  status: 'pending' | 'delivered' | 'failed';
  transactionHash?: string;
}

class TransformerBridgeService extends EventEmitter {
  private static instance: TransformerBridgeService;
  private transformationRules: Map<string, TransformationRule>;
  private transformedData: Map<string, TransformedData>;
  private isActive: boolean;

  private constructor() {
    super();
    this.transformationRules = new Map();
    this.transformedData = new Map();
    this.isActive = false;
    this.initializeDefaultRules();
  }

  static getInstance(): TransformerBridgeService {
    if (!TransformerBridgeService.instance) {
      TransformerBridgeService.instance = new TransformerBridgeService();
    }
    return TransformerBridgeService.instance;
  }

  private initializeDefaultRules() {
    // Sportsbook to Web3 transformation
    this.addTransformationRule({
      id: 'sportsbook-to-web3',
      sourceType: 'sportsbook',
      targetChain: 'polygon',
      transformFunction: (data: any) => ({
        type: 'bet_placement',
        gameId: data.gameId,
        userId: data.userId,
        amount: data.amount,
        odds: data.odds,
        timestamp: Date.now(),
        metadata: {
          sport: data.sport,
          league: data.league,
          fccEntity: '20130314143016'
        }
      }),
      enabled: true
    });

    // Streaming to Web3 transformation
    this.addTransformationRule({
      id: 'streaming-to-web3',
      sourceType: 'streaming',
      targetChain: 'polygon',
      transformFunction: (data: any) => ({
        type: 'stream_access',
        gameId: data.gameId,
        userId: data.userId,
        provider: data.provider,
        timestamp: Date.now(),
        metadata: {
          streamUrl: data.streamUrl,
          fccCompliant: true,
          fccEntity: '20130314143016'
        }
      }),
      enabled: true
    });

    // PS5 gaming to Web3 transformation
    this.addTransformationRule({
      id: 'ps5-to-web3',
      sourceType: 'ps5',
      targetChain: 'polygon',
      transformFunction: (data: any) => ({
        type: 'gaming_activity',
        gameType: data.gameType,
        userId: data.userId,
        score: data.score,
        timestamp: Date.now(),
        metadata: {
          platform: 'PlayStation 5',
          enrollmentPoints: data.enrollmentPoints,
          fccEntity: '20130314143016'
        }
      }),
      enabled: true
    });

    // Content to Web3 transformation
    this.addTransformationRule({
      id: 'content-to-web3',
      sourceType: 'content',
      targetChain: 'polygon',
      transformFunction: (data: any) => ({
        type: 'content_distribution',
        contentId: data.contentId,
        ownerId: data.ownerId,
        accessType: data.accessType,
        timestamp: Date.now(),
        metadata: {
          contentType: data.type,
          distributionEnabled: true,
          fccEntity: '20130314143016'
        }
      }),
      enabled: true
    });
  }

  addTransformationRule(rule: TransformationRule) {
    this.transformationRules.set(rule.id, rule);
    this.emit('rule:added', rule);
  }

  async transformAndDeliver(sourceType: string, sourceData: any): Promise<TransformedData> {
    const rule = Array.from(this.transformationRules.values()).find(
      r => r.sourceType === sourceType && r.enabled
    );

    if (!rule) {
      throw new Error(`No transformation rule found for source type: ${sourceType}`);
    }

    try {
      // Transform the data
      const chainData = rule.transformFunction(sourceData);
      
      const transformedId = `transform-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const transformed: TransformedData = {
        id: transformedId,
        sourceId: sourceData.id || sourceData.gameId || sourceData.userId,
        sourceType,
        transformedAt: Date.now(),
        chainData,
        status: 'pending'
      };

      this.transformedData.set(transformedId, transformed);
      this.emit('data:transformed', transformed);

      // Deliver to Web3
      await this.deliverToWeb3(transformedId);

      return transformed;
    } catch (error) {
      throw new Error(`Transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async deliverToWeb3(transformedId: string): Promise<void> {
    const transformed = this.transformedData.get(transformedId);
    
    if (!transformed) {
      throw new Error('Transformed data not found');
    }

    try {
      // Create a Web3 transaction for the transformed data
      const wallets = web3BridgeService.getAllWallets();
      
      if (wallets.length === 0) {
        // Create a system wallet if none exists
        const systemAddress = '0x' + Math.random().toString(16).substr(2, 40);
        await web3BridgeService.connectWallet(systemAddress);
      }

      const systemWallet = web3BridgeService.getAllWallets()[0];
      const recipientAddress = '0x' + Math.random().toString(16).substr(2, 40);

      // Create transaction with transformed data
      const transaction = await web3BridgeService.createTransaction(
        systemWallet.address,
        recipientAddress,
        '0.001' // Minimal amount for data delivery
      );

      // Send transaction
      const sentTx = await web3BridgeService.sendTransaction(transaction.id);

      // Update transformed data with transaction hash
      transformed.status = 'delivered';
      transformed.transactionHash = sentTx.hash;

      this.emit('data:delivered', transformed);

      // Notify app core
      appCore.updateConnection('transformer-bridge', {
        lastDelivery: Date.now(),
        deliveryStatus: 'success'
      });

    } catch (error) {
      transformed.status = 'failed';
      this.emit('data:failed', transformed);
      throw error;
    }
  }

  async activateBridge() {
    this.isActive = true;
    
    // Register with app core
    appCore.updateConnection('transformer-bridge', {
      status: 'active',
      rulesCount: this.transformationRules.size,
      deliveryCount: this.transformedData.size
    });

    this.emit('bridge:activated');
    return {
      success: true,
      message: 'Transformer bridge activated',
      rulesCount: this.transformationRules.size
    };
  }

  async deactivateBridge() {
    this.isActive = false;
    this.emit('bridge:deactivated');
    return {
      success: true,
      message: 'Transformer bridge deactivated'
    };
  }

  getTransformationRules(): TransformationRule[] {
    return Array.from(this.transformationRules.values());
  }

  getTransformedData(): TransformedData[] {
    return Array.from(this.transformedData.values());
  }

  getStats() {
    return {
      isActive: this.isActive,
      totalRules: this.transformationRules.size,
      enabledRules: Array.from(this.transformationRules.values()).filter(r => r.enabled).length,
      totalTransformations: this.transformedData.size,
      deliveredCount: Array.from(this.transformedData.values()).filter(d => d.status === 'delivered').length,
      pendingCount: Array.from(this.transformedData.values()).filter(d => d.status === 'pending').length,
      failedCount: Array.from(this.transformedData.values()).filter(d => d.status === 'failed').length
    };
  }

  async batchTransform(sourceType: string, dataArray: any[]): Promise<TransformedData[]> {
    const results: TransformedData[] = [];

    for (const data of dataArray) {
      try {
        const transformed = await this.transformAndDeliver(sourceType, data);
        results.push(transformed);
      } catch (error) {
        console.error(`Batch transformation failed for item:`, error);
      }
    }

    return results;
  }
}

export const transformerBridgeService = TransformerBridgeService.getInstance();
