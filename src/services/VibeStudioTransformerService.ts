
import { EventEmitter } from 'events';
import { transformerBridgeService } from './TransformerBridgeService.js';
import { appCore } from '../core/AppCore.js';
import { fusionAssemblyCore } from '../core/FusionAssemblyCore.js';

interface VibeStudioSession {
  id: string;
  userId: string;
  vibeStudioId: string;
  projectName: string;
  contentType: string;
  connectedAt: number;
  lastSync: number;
  transformedData: any[];
  coreContext: {
    buildVersion: string;
    systemStatus: string;
    activeServices: string[];
  };
}

interface VibeStudioContent {
  id: string;
  sessionId: string;
  sourceUrl: string;
  contentData: any;
  transformedAt?: number;
  deliveredToCore: boolean;
}

export class VibeStudioTransformerService extends EventEmitter {
  private static instance: VibeStudioTransformerService;
  private sessions: Map<string, VibeStudioSession> = new Map();
  private content: Map<string, VibeStudioContent> = new Map();
  private isActive: boolean = false;

  private constructor() {
    super();
    this.initialize();
  }

  static getInstance(): VibeStudioTransformerService {
    if (!VibeStudioTransformerService.instance) {
      VibeStudioTransformerService.instance = new VibeStudioTransformerService();
    }
    return VibeStudioTransformerService.instance;
  }

  private initialize() {
    console.log('🎵 Initializing Vibe Studio Transformer Service...');
    
    // Register with app core
    appCore.registerBackgroundService('vibe-studio-transformer', 'streaming');
    
    // Listen to transformer bridge events
    transformerBridgeService.on('data:delivered', (data) => {
      this.handleTransformedData(data);
    });

    this.isActive = true;
    console.log('✅ Vibe Studio Transformer Service initialized');
  }

  // Connect Vibe Studio session
  async connectVibeStudioSession(
    userId: string,
    vibeStudioId: string,
    projectName: string
  ): Promise<string> {
    const sessionId = `vibe-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get current core context
    const systemHealth = appCore.getSystemHealth();
    const connectionStatus = appCore.getConnectionStatus();

    const session: VibeStudioSession = {
      id: sessionId,
      userId,
      vibeStudioId,
      projectName,
      contentType: 'audio-visual',
      connectedAt: Date.now(),
      lastSync: Date.now(),
      transformedData: [],
      coreContext: {
        buildVersion: '1.0.0',
        systemStatus: systemHealth.overall,
        activeServices: connectionStatus.connections
          .filter(c => c.status === 'connected')
          .map(c => c.id)
      }
    };

    this.sessions.set(sessionId, session);

    // Sync to fusion assembly
    await fusionAssemblyCore.sync('vibe-studio-session', {
      sessionId,
      vibeStudioId,
      projectName,
      timestamp: new Date().toISOString()
    });

    console.log(`🎵 Vibe Studio session connected: ${sessionId}`);
    this.emit('session:connected', session);

    return sessionId;
  }

  // Import content from Vibe Studio URL
  async importContentFromURL(
    sessionId: string,
    sourceUrl: string,
    contentData?: any
  ): Promise<string> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error('Vibe Studio session not found');
    }

    const contentId = `vibe-content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const content: VibeStudioContent = {
      id: contentId,
      sessionId,
      sourceUrl,
      contentData: contentData || {
        url: sourceUrl,
        importedAt: Date.now(),
        type: 'vibe-studio-project'
      },
      deliveredToCore: false
    };

    this.content.set(contentId, content);

    // Transform and deliver to core
    await this.transformAndDeliverToCore(contentId);

    session.lastSync = Date.now();

    console.log(`📥 Content imported from Vibe Studio: ${contentId}`);
    this.emit('content:imported', content);

    return contentId;
  }

  // Transform Vibe Studio content and deliver to core
  private async transformAndDeliverToCore(contentId: string): Promise<void> {
    const content = this.content.get(contentId);
    
    if (!content) {
      throw new Error('Content not found');
    }

    const session = this.sessions.get(content.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    try {
      // Prepare data for transformation
      const transformData = {
        id: contentId,
        type: 'vibe-studio-content',
        contentId: content.id,
        ownerId: session.userId,
        accessType: 'streaming',
        sourceUrl: content.sourceUrl,
        projectName: session.projectName,
        vibeStudioId: session.vibeStudioId,
        coreContext: session.coreContext,
        metadata: content.contentData
      };

      // Transform using transformer bridge
      const transformed = await transformerBridgeService.transformAndDeliver(
        'content',
        transformData
      );

      content.transformedAt = Date.now();
      content.deliveredToCore = true;

      session.transformedData.push({
        contentId,
        transformedId: transformed.id,
        timestamp: Date.now()
      });

      // Update app core with delivery status
      appCore.updateConnection('vibe-studio-transformer', {
        lastDelivery: Date.now(),
        totalDeliveries: session.transformedData.length,
        sessionId: session.id
      });

      // Sync to fusion assembly
      await fusionAssemblyCore.sync('vibe-studio-delivery', {
        contentId,
        transformedId: transformed.id,
        sessionId: session.id,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Vibe Studio content delivered to core: ${contentId}`);
      this.emit('content:delivered', { content, transformed });

    } catch (error) {
      console.error(`Failed to transform Vibe Studio content: ${error}`);
      throw error;
    }
  }

  // Handle transformed data from transformer bridge
  private handleTransformedData(data: any) {
    const matchingContent = Array.from(this.content.values()).find(
      c => c.contentData?.transformedId === data.id
    );

    if (matchingContent) {
      console.log(`📊 Vibe Studio content transformation completed: ${matchingContent.id}`);
    }
  }

  // Get core context for Vibe Studio
  getCoreContext(): any {
    const systemHealth = appCore.getSystemHealth();
    const connectionStatus = appCore.getConnectionStatus();
    const transformerStats = transformerBridgeService.getStats();

    return {
      system: {
        health: systemHealth.overall,
        uptime: systemHealth.uptime,
        activeConnections: systemHealth.activeConnections,
        healthScore: systemHealth.healthScore
      },
      transformer: {
        isActive: transformerStats.isActive,
        totalRules: transformerStats.totalRules,
        totalTransformations: transformerStats.totalTransformations,
        deliveredCount: transformerStats.deliveredCount
      },
      services: connectionStatus.connections.map(c => ({
        id: c.id,
        type: c.type,
        status: c.status
      })),
      vibeStudio: {
        activeSessions: this.sessions.size,
        totalContent: this.content.size,
        deliveredContent: Array.from(this.content.values()).filter(c => c.deliveredToCore).length
      },
      fccEntity: '20130314143016'
    };
  }

  // Get session by ID
  getSession(sessionId: string): VibeStudioSession | undefined {
    return this.sessions.get(sessionId);
  }

  // Get all sessions
  getSessions(): VibeStudioSession[] {
    return Array.from(this.sessions.values());
  }

  // Get content by ID
  getContent(contentId: string): VibeStudioContent | undefined {
    return this.content.get(contentId);
  }

  // Get all content
  getAllContent(): VibeStudioContent[] {
    return Array.from(this.content.values());
  }

  // Get status
  getStatus() {
    return {
      isActive: this.isActive,
      totalSessions: this.sessions.size,
      activeSessions: Array.from(this.sessions.values()).filter(
        s => Date.now() - s.lastSync < 300000
      ).length,
      totalContent: this.content.size,
      deliveredContent: Array.from(this.content.values()).filter(c => c.deliveredToCore).length,
      pendingContent: Array.from(this.content.values()).filter(c => !c.deliveredToCore).length,
      coreContext: this.getCoreContext(),
      fccEntity: '20130314143016'
    };
  }

  // Disconnect session
  async disconnectSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      this.sessions.delete(sessionId);
      console.log(`🔌 Vibe Studio session disconnected: ${sessionId}`);
      this.emit('session:disconnected', session);
    }
  }
}

export const vibeStudioTransformerService = VibeStudioTransformerService.getInstance();
