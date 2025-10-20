
import { EventEmitter } from 'events';

interface DUNSEntity {
  dunsNumber: string;
  legalName: string;
  tradingName?: string;
  address: string;
  phoneNumber?: string;
  contentAccess: 'full' | 'limited' | 'restricted';
  peerStatus: 'active' | 'pending' | 'inactive';
  relationshipType: 'partner' | 'supplier' | 'customer' | 'affiliate';
  lastSync: number;
}

interface ContentPeer {
  id: string;
  dunsNumber: string;
  entityName: string;
  peerType: 'primary' | 'secondary' | 'tertiary';
  contentChannels: string[];
  dataExchange: {
    sent: number;
    received: number;
    lastExchange: number;
  };
  trustScore: number;
  fccCompliant: boolean;
}

interface PeerContent {
  id: string;
  sourceEntity: string;
  contentType: 'business-data' | 'market-intel' | 'financial' | 'operational';
  data: any;
  timestamp: number;
  verified: boolean;
  dunsVerified: boolean;
}

export class DunContentPeersService extends EventEmitter {
  private static instance: DunContentPeersService;
  private dunsEntities: Map<string, DUNSEntity> = new Map();
  private contentPeers: Map<string, ContentPeer> = new Map();
  private peerContent: Map<string, PeerContent> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;

  // Primary DUNS for Park Towne Place Associates Limited Partnership
  private readonly PRIMARY_DUNS = '147036693';
  private readonly FCC_ENTITY = '20130314143016';

  private constructor() {
    super();
    this.initializeService();
  }

  static getInstance(): DunContentPeersService {
    if (!DunContentPeersService.instance) {
      DunContentPeersService.instance = new DunContentPeersService();
    }
    return DunContentPeersService.instance;
  }

  private initializeService() {
    console.log('🏢 Initializing Dun & Bradstreet Content Peers Service...');

    // Initialize primary entity
    this.registerPrimaryEntity();

    // Setup peer network
    this.setupPeerNetwork();

    // Start content sync
    this.startContentSync();

    console.log('✅ Dun Content Peers Service initialized');
  }

  private registerPrimaryEntity() {
    const primaryEntity: DUNSEntity = {
      dunsNumber: this.PRIMARY_DUNS,
      legalName: 'PARK TOWNE PLACE ASSOCIATES LIMITED PARTNERSHIP',
      tradingName: 'Young Meeat LLC',
      address: 'Philadelphia, PA',
      contentAccess: 'full',
      peerStatus: 'active',
      relationshipType: 'partner',
      lastSync: Date.now()
    };

    this.dunsEntities.set(this.PRIMARY_DUNS, primaryEntity);

    // Create primary content peer
    const primaryPeer: ContentPeer = {
      id: `peer_${this.PRIMARY_DUNS}`,
      dunsNumber: this.PRIMARY_DUNS,
      entityName: primaryEntity.legalName,
      peerType: 'primary',
      contentChannels: ['business-data', 'market-intel', 'financial', 'operational'],
      dataExchange: {
        sent: 0,
        received: 0,
        lastExchange: Date.now()
      },
      trustScore: 100,
      fccCompliant: true
    };

    this.contentPeers.set(primaryPeer.id, primaryPeer);
    console.log(`✅ Registered primary DUNS entity: ${this.PRIMARY_DUNS}`);
  }

  private setupPeerNetwork() {
    // Add common business relationship peers
    const peerEntities = [
      {
        dunsNumber: '987654321',
        legalName: 'Strategic Business Partner Inc',
        relationshipType: 'partner' as const,
        peerType: 'secondary' as const
      },
      {
        dunsNumber: '123456789',
        legalName: 'Supply Chain Associate LLC',
        relationshipType: 'supplier' as const,
        peerType: 'secondary' as const
      },
      {
        dunsNumber: '456789123',
        legalName: 'Content Distribution Network',
        relationshipType: 'affiliate' as const,
        peerType: 'tertiary' as const
      }
    ];

    peerEntities.forEach(entity => {
      const dunsEntity: DUNSEntity = {
        dunsNumber: entity.dunsNumber,
        legalName: entity.legalName,
        address: 'United States',
        contentAccess: 'limited',
        peerStatus: 'active',
        relationshipType: entity.relationshipType,
        lastSync: Date.now()
      };

      this.dunsEntities.set(entity.dunsNumber, dunsEntity);

      const peer: ContentPeer = {
        id: `peer_${entity.dunsNumber}`,
        dunsNumber: entity.dunsNumber,
        entityName: entity.legalName,
        peerType: entity.peerType,
        contentChannels: ['business-data', 'market-intel'],
        dataExchange: {
          sent: 0,
          received: 0,
          lastExchange: Date.now()
        },
        trustScore: 85,
        fccCompliant: true
      };

      this.contentPeers.set(peer.id, peer);
    });

    console.log(`✅ Setup ${peerEntities.length} content peers`);
  }

  private startContentSync() {
    this.syncInterval = setInterval(() => {
      this.syncPeerContent();
      this.updatePeerMetrics();
    }, 30000); // Every 30 seconds
  }

  private syncPeerContent() {
    const activePeers = Array.from(this.contentPeers.values())
      .filter(p => p.trustScore > 70);

    activePeers.forEach(peer => {
      // Simulate content exchange
      peer.dataExchange.lastExchange = Date.now();
      peer.dataExchange.received += Math.floor(Math.random() * 10);
    });
  }

  private updatePeerMetrics() {
    this.contentPeers.forEach(peer => {
      const entity = this.dunsEntities.get(peer.dunsNumber);
      if (entity) {
        entity.lastSync = Date.now();
      }
    });
  }

  registerDUNSEntity(dunsNumber: string, entityData: Partial<DUNSEntity>): DUNSEntity {
    const entity: DUNSEntity = {
      dunsNumber,
      legalName: entityData.legalName || 'Unknown Entity',
      tradingName: entityData.tradingName,
      address: entityData.address || 'Unknown',
      phoneNumber: entityData.phoneNumber,
      contentAccess: entityData.contentAccess || 'limited',
      peerStatus: entityData.peerStatus || 'pending',
      relationshipType: entityData.relationshipType || 'customer',
      lastSync: Date.now()
    };

    this.dunsEntities.set(dunsNumber, entity);
    console.log(`✅ Registered DUNS entity: ${dunsNumber}`);
    
    return entity;
  }

  createContentPeer(dunsNumber: string, peerType: 'primary' | 'secondary' | 'tertiary'): ContentPeer | null {
    const entity = this.dunsEntities.get(dunsNumber);
    if (!entity) {
      console.log(`❌ DUNS entity not found: ${dunsNumber}`);
      return null;
    }

    const peer: ContentPeer = {
      id: `peer_${dunsNumber}_${Date.now()}`,
      dunsNumber,
      entityName: entity.legalName,
      peerType,
      contentChannels: peerType === 'primary' ? 
        ['business-data', 'market-intel', 'financial', 'operational'] :
        ['business-data', 'market-intel'],
      dataExchange: {
        sent: 0,
        received: 0,
        lastExchange: Date.now()
      },
      trustScore: peerType === 'primary' ? 100 : 75,
      fccCompliant: true
    };

    this.contentPeers.set(peer.id, peer);
    this.emit('peer:created', peer);
    
    return peer;
  }

  shareContent(sourceEntity: string, contentType: PeerContent['contentType'], data: any): PeerContent {
    const content: PeerContent = {
      id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceEntity,
      contentType,
      data,
      timestamp: Date.now(),
      verified: true,
      dunsVerified: this.dunsEntities.has(sourceEntity)
    };

    this.peerContent.set(content.id, content);

    // Update peer metrics
    const peer = Array.from(this.contentPeers.values())
      .find(p => p.dunsNumber === sourceEntity);
    
    if (peer) {
      peer.dataExchange.sent += 1;
      peer.dataExchange.lastExchange = Date.now();
    }

    this.emit('content:shared', content);
    console.log(`📤 Content shared from ${sourceEntity}: ${contentType}`);
    
    return content;
  }

  receiveContent(peerId: string, contentData: any): boolean {
    const peer = this.contentPeers.get(peerId);
    if (!peer || peer.trustScore < 50) {
      console.log(`❌ Cannot receive content from untrusted peer: ${peerId}`);
      return false;
    }

    peer.dataExchange.received += 1;
    peer.dataExchange.lastExchange = Date.now();

    const content: PeerContent = {
      id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceEntity: peer.dunsNumber,
      contentType: 'business-data',
      data: contentData,
      timestamp: Date.now(),
      verified: true,
      dunsVerified: true
    };

    this.peerContent.set(content.id, content);
    this.emit('content:received', content);
    
    return true;
  }

  getPeerNetwork(): any {
    return {
      primaryDUNS: this.PRIMARY_DUNS,
      fccEntity: this.FCC_ENTITY,
      totalPeers: this.contentPeers.size,
      totalEntities: this.dunsEntities.size,
      activePeers: Array.from(this.contentPeers.values()).filter(p => p.trustScore > 70).length,
      totalContent: this.peerContent.size,
      peers: Array.from(this.contentPeers.values()),
      entities: Array.from(this.dunsEntities.values())
    };
  }

  getPeerDetails(peerId: string): any {
    const peer = this.contentPeers.get(peerId);
    if (!peer) return null;

    const entity = this.dunsEntities.get(peer.dunsNumber);
    const peerContent = Array.from(this.peerContent.values())
      .filter(c => c.sourceEntity === peer.dunsNumber);

    return {
      peer,
      entity,
      content: peerContent,
      metrics: {
        totalContentShared: peerContent.length,
        exchangeRate: peer.dataExchange.sent + peer.dataExchange.received,
        lastActivity: peer.dataExchange.lastExchange,
        trustScore: peer.trustScore
      }
    };
  }

  getDUNSEntityInfo(dunsNumber: string): DUNSEntity | null {
    return this.dunsEntities.get(dunsNumber) || null;
  }

  updateTrustScore(peerId: string, newScore: number): boolean {
    const peer = this.contentPeers.get(peerId);
    if (!peer) return false;

    peer.trustScore = Math.max(0, Math.min(100, newScore));
    console.log(`📊 Updated trust score for ${peerId}: ${peer.trustScore}`);
    
    return true;
  }

  getContentByType(contentType: PeerContent['contentType']): PeerContent[] {
    return Array.from(this.peerContent.values())
      .filter(c => c.contentType === contentType);
  }

  shutdown() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    console.log('🔌 Dun Content Peers Service shutdown');
  }
}

export const dunContentPeersService = DunContentPeersService.getInstance();
