
import { samGovService } from '../services/SAMGovService.js';

export interface SAMAPIConfig {
  baseUrl: string;
  apiKey: string;
  entityName: string;
  fccEntity: string;
  fccRegistration: string;
  endpoints: {
    entities: string;
    opportunities: string;
    exclusions: string;
    federalHierarchy: string;
  };
}

export class SAMAPIBase {
  private config: SAMAPIConfig;
  
  constructor() {
    this.config = {
      baseUrl: 'https://api.sam.gov',
      apiKey: process.env.SAM_GOV_API_KEY || '',
      entityName: 'Young Meeat LLC',
      fccEntity: '20130314143016',
      fccRegistration: '0024454324',
      endpoints: {
        entities: '/entity-information/v3/entities',
        opportunities: '/opportunities/v2/search',
        exclusions: '/exclusions/v2/search',
        federalHierarchy: '/entity-information/v3/entities/hierarchy'
      }
    };
  }

  // Get full endpoint URL
  getEndpoint(endpoint: keyof SAMAPIConfig['endpoints']): string {
    return `${this.config.baseUrl}${this.config.endpoints[endpoint]}`;
  }

  // Build API request headers
  getHeaders(): Record<string, string> {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Api-Key': this.config.apiKey,
      'X-FCC-Entity': this.config.fccEntity,
      'X-FCC-Registration': this.config.fccRegistration
    };
  }

  // Build query parameters with API key
  buildQueryParams(params: Record<string, string>): string {
    const queryParams = new URLSearchParams({
      ...params,
      api_key: this.config.apiKey
    });
    return queryParams.toString();
  }

  // Fetch from SAM.gov API
  async fetchFromSAM(endpoint: keyof SAMAPIConfig['endpoints'], params: Record<string, string> = {}): Promise<any> {
    const url = `${this.getEndpoint(endpoint)}?${this.buildQueryParams(params)}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`SAM.gov API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('SAM.gov API request failed:', error);
      throw error;
    }
  }

  // Search entity by name
  async searchEntity(name: string): Promise<any> {
    return this.fetchFromSAM('entities', {
      legalBusinessName: name
    });
  }

  // Get entity by UEI
  async getEntityByUEI(uei: string): Promise<any> {
    return this.fetchFromSAM('entities', {
      ueiSAM: uei
    });
  }

  // Get Young Meeat LLC entity
  async getYoungMeeatEntity(): Promise<any> {
    return this.searchEntity(this.config.entityName);
  }

  // Search contract opportunities
  async searchOpportunities(params: Record<string, string> = {}): Promise<any> {
    return this.fetchFromSAM('opportunities', params);
  }

  // Get configuration
  getConfig(): SAMAPIConfig {
    return { ...this.config };
  }

  // Update API key
  updateApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }
}

export const samAPIBase = new SAMAPIBase();
