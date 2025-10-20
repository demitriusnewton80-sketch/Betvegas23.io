
import { EventEmitter } from 'events';

interface BusinessContact {
  id: string;
  name: string;
  company: string;
  title: string;
  email: string;
  phone?: string;
  industry: string;
  relationship: 'partner' | 'client' | 'vendor' | 'prospect' | 'investor';
  status: 'active' | 'inactive' | 'pending';
  linkedEntities?: string[];
  notes?: string;
  createdAt: Date;
  lastContact?: Date;
  opportunityValue?: number;
}

interface BusinessOpportunity {
  id: string;
  contactId: string;
  title: string;
  description: string;
  value: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  expectedCloseDate?: Date;
  samGovRelated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Partnership {
  id: string;
  partnerName: string;
  partnerUEI?: string;
  type: 'strategic' | 'technology' | 'channel' | 'joint-venture';
  status: 'active' | 'negotiating' | 'inactive';
  startDate: Date;
  description: string;
  benefits: string[];
  integrations: string[];
}

class BusinessRelationshipService extends EventEmitter {
  private contacts: Map<string, BusinessContact> = new Map();
  private opportunities: Map<string, BusinessOpportunity> = new Map();
  private partnerships: Map<string, Partnership> = new Map();

  constructor() {
    super();
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    // Add sample business relationships
    this.addContact({
      id: 'contact_1',
      name: 'Demitrius P Newton',
      company: '20130314143016 Inc.',
      title: 'Founder & CEO',
      email: 'gbemeeat@gmail.com',
      phone: '(445) 942-9173',
      industry: 'Technology & Sports Betting',
      relationship: 'client',
      status: 'active',
      linkedEntities: ['20130314143016'],
      createdAt: new Date(),
      lastContact: new Date()
    });
  }

  // Contact Management
  addContact(contact: BusinessContact): BusinessContact {
    this.contacts.set(contact.id, contact);
    this.emit('contactAdded', contact);
    return contact;
  }

  getContact(id: string): BusinessContact | undefined {
    return this.contacts.get(id);
  }

  getAllContacts(): BusinessContact[] {
    return Array.from(this.contacts.values());
  }

  updateContact(id: string, updates: Partial<BusinessContact>): BusinessContact | null {
    const contact = this.contacts.get(id);
    if (!contact) return null;

    const updated = { ...contact, ...updates };
    this.contacts.set(id, updated);
    this.emit('contactUpdated', updated);
    return updated;
  }

  searchContacts(query: string): BusinessContact[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.contacts.values()).filter(contact =>
      contact.name.toLowerCase().includes(lowerQuery) ||
      contact.company.toLowerCase().includes(lowerQuery) ||
      contact.email.toLowerCase().includes(lowerQuery)
    );
  }

  // Opportunity Management
  createOpportunity(opportunity: BusinessOpportunity): BusinessOpportunity {
    this.opportunities.set(opportunity.id, opportunity);
    this.emit('opportunityCreated', opportunity);
    return opportunity;
  }

  getOpportunity(id: string): BusinessOpportunity | undefined {
    return this.opportunities.get(id);
  }

  getAllOpportunities(): BusinessOpportunity[] {
    return Array.from(this.opportunities.values());
  }

  updateOpportunityStage(id: string, stage: BusinessOpportunity['stage']): BusinessOpportunity | null {
    const opportunity = this.opportunities.get(id);
    if (!opportunity) return null;

    opportunity.stage = stage;
    opportunity.updatedAt = new Date();
    this.opportunities.set(id, opportunity);
    this.emit('opportunityUpdated', opportunity);
    return opportunity;
  }

  // Partnership Management
  addPartnership(partnership: Partnership): Partnership {
    this.partnerships.set(partnership.id, partnership);
    this.emit('partnershipAdded', partnership);
    return partnership;
  }

  getPartnership(id: string): Partnership | undefined {
    return this.partnerships.get(id);
  }

  getAllPartnerships(): Partnership[] {
    return Array.from(this.partnerships.values());
  }

  // Analytics & Reporting
  getRelationshipMetrics() {
    const contacts = this.getAllContacts();
    const opportunities = this.getAllOpportunities();
    const partnerships = this.getAllPartnerships();

    return {
      totalContacts: contacts.length,
      activeContacts: contacts.filter(c => c.status === 'active').length,
      contactsByRelationship: {
        partners: contacts.filter(c => c.relationship === 'partner').length,
        clients: contacts.filter(c => c.relationship === 'client').length,
        vendors: contacts.filter(c => c.relationship === 'vendor').length,
        prospects: contacts.filter(c => c.relationship === 'prospect').length,
        investors: contacts.filter(c => c.relationship === 'investor').length
      },
      opportunities: {
        total: opportunities.length,
        totalValue: opportunities.reduce((sum, opp) => sum + opp.value, 0),
        byStage: {
          lead: opportunities.filter(o => o.stage === 'lead').length,
          qualified: opportunities.filter(o => o.stage === 'qualified').length,
          proposal: opportunities.filter(o => o.stage === 'proposal').length,
          negotiation: opportunities.filter(o => o.stage === 'negotiation').length,
          closedWon: opportunities.filter(o => o.stage === 'closed-won').length,
          closedLost: opportunities.filter(o => o.stage === 'closed-lost').length
        },
        samGovOpportunities: opportunities.filter(o => o.samGovRelated).length
      },
      partnerships: {
        total: partnerships.length,
        active: partnerships.filter(p => p.status === 'active').length,
        byType: {
          strategic: partnerships.filter(p => p.type === 'strategic').length,
          technology: partnerships.filter(p => p.type === 'technology').length,
          channel: partnerships.filter(p => p.type === 'channel').length,
          jointVenture: partnerships.filter(p => p.type === 'joint-venture').length
        }
      }
    };
  }

  // Network Map
  getNetworkMap() {
    const contacts = this.getAllContacts();
    const partnerships = this.getAllPartnerships();

    return {
      nodes: [
        {
          id: '20130314143016',
          label: '20130314143016 Inc.',
          type: 'company',
          central: true
        },
        ...contacts.map(c => ({
          id: c.id,
          label: c.name,
          type: c.relationship,
          company: c.company
        })),
        ...partnerships.map(p => ({
          id: p.id,
          label: p.partnerName,
          type: 'partnership',
          status: p.status
        }))
      ],
      connections: [
        ...contacts.map(c => ({
          from: '20130314143016',
          to: c.id,
          type: c.relationship
        })),
        ...partnerships.map(p => ({
          from: '20130314143016',
          to: p.id,
          type: 'partnership'
        }))
      ]
    };
  }
}

export const businessRelationshipService = new BusinessRelationshipService();
