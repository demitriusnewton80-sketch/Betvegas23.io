
import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface SAMEntity {
  ueiSAM: string;
  entityRegistration: {
    samRegistered: string;
    ueiStatus: string;
    entityEFTIndicator: string;
    cageCode: string;
    dodaac: string;
    legalBusinessName: string;
    dbaName?: string;
    registrationStatus: string;
    registrationDate: string;
    lastUpdateDate: string;
    registrationExpirationDate: string;
  };
  coreData: {
    entityHierarchyInformation?: any;
    federalHierarchy?: any;
    entityInformation: {
      entityURL?: string;
      entityDivisionName?: string;
      entityDivisionNumber?: string;
      entityStartDate?: string;
      fiscalYearEndCloseDate?: string;
      submissionDate?: string;
    };
    physicalAddress?: any;
    mailingAddress?: any;
  };
}

export interface SAMConfig {
  apiKey: string;
  baseUrl: string;
  entityName: string;
  uei?: string;
  fccEntity: string;
}

class SAMGovService extends EventEmitter {
  private config: SAMConfig;
  private entityCache: Map<string, SAMEntity> = new Map();

  constructor() {
    super();
    
    this.config = {
      apiKey: process.env.SAM_GOV_API_KEY || '',
      baseUrl: 'https://api.sam.gov/entity-information/v3/entities',
      entityName: 'Young Meeat LLC',
      uei: process.env.SAM_UEI || '',
      fccEntity: '20130314143016'
    };
  }

  // Search for entity by name
  async searchEntity(entityName: string): Promise<SAMEntity | null> {
    try {
      const searchUrl = `${this.config.baseUrl}?legalBusinessName=${encodeURIComponent(entityName)}&api_key=${this.config.apiKey}`;
      
      // In production, use actual fetch call:
      // const response = await fetch(searchUrl, {
      //   headers: {
      //     'Accept': 'application/json',
      //     'Content-Type': 'application/json'
      //   }
      // });
      // const data = await response.json();
      
      // Mock response for development
      const mockEntity: SAMEntity = {
        ueiSAM: this.config.uei || 'MOCK-UEI-' + crypto.randomBytes(6).toString('hex').toUpperCase(),
        entityRegistration: {
          samRegistered: 'Yes',
          ueiStatus: 'Active',
          entityEFTIndicator: 'Yes',
          cageCode: 'CAGE' + crypto.randomBytes(2).toString('hex').toUpperCase(),
          dodaac: 'DODAAC',
          legalBusinessName: entityName,
          dbaName: entityName,
          registrationStatus: 'Active',
          registrationDate: '2013-03-14',
          lastUpdateDate: new Date().toISOString().split('T')[0],
          registrationExpirationDate: '2025-12-31'
        },
        coreData: {
          entityInformation: {
            entityURL: 'https://betvages23.in',
            submissionDate: new Date().toISOString()
          }
        }
      };
      
      this.entityCache.set(entityName, mockEntity);
      this.emit('entityFound', mockEntity);
      
      return mockEntity;
    } catch (error) {
      console.error('SAM.gov API error:', error);
      return null;
    }
  }

  // Get entity by UEI
  async getEntityByUEI(uei: string): Promise<SAMEntity | null> {
    try {
      const entityUrl = `${this.config.baseUrl}?ueiSAM=${uei}&api_key=${this.config.apiKey}`;
      
      // Check cache first
      const cached = Array.from(this.entityCache.values()).find(e => e.ueiSAM === uei);
      if (cached) return cached;
      
      // In production, fetch from SAM.gov
      // const response = await fetch(entityUrl);
      // const data = await response.json();
      
      return this.searchEntity(this.config.entityName);
    } catch (error) {
      console.error('SAM.gov UEI lookup error:', error);
      return null;
    }
  }

  // Validate SAM registration
  async validateRegistration(entityName: string): Promise<{
    valid: boolean;
    status: string;
    expirationDate?: string;
    uei?: string;
  }> {
    const entity = await this.searchEntity(entityName);
    
    if (!entity) {
      return {
        valid: false,
        status: 'Not Found'
      };
    }

    return {
      valid: entity.entityRegistration.registrationStatus === 'Active',
      status: entity.entityRegistration.registrationStatus,
      expirationDate: entity.entityRegistration.registrationExpirationDate,
      uei: entity.ueiSAM
    };
  }

  // Generate SAM.gov SSO redirect URL
  generateSSOUrl(returnUrl: string): string {
    const state = crypto.randomBytes(32).toString('hex');
    const params = new URLSearchParams({
      client_id: 'young-meeat-llc',
      redirect_uri: returnUrl,
      response_type: 'code',
      scope: 'openid entity-information',
      state: state,
      fcc_entity: this.config.fccEntity
    });

    // SAM.gov OAuth endpoint (adjust based on actual SAM.gov OAuth URL)
    return `https://sam.gov/oauth/authorize?${params.toString()}`;
  }

  // Get entity link for SAM.gov profile
  getEntityProfileLink(uei?: string): string {
    const entityUEI = uei || this.config.uei;
    if (entityUEI) {
      return `https://sam.gov/entity/${entityUEI}/overview`;
    }
    return `https://sam.gov/search?q=${encodeURIComponent(this.config.entityName)}`;
  }

  // Get current config
  getConfig(): SAMConfig {
    return { ...this.config };
  }

  // Update API key
  updateApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.emit('configUpdated', this.config);
  }

  // Get cached entities
  getCachedEntities(): SAMEntity[] {
    return Array.from(this.entityCache.values());
  }
}

export const samGovService = new SAMGovService();
