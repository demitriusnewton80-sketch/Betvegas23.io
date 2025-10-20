
import express, { Request, Response } from 'express';
import { functionalStructures } from '../core/FunctionalStructures.js';
import { businessRelationshipService } from '../services/BusinessRelationshipService.js';

const router = express.Router();

// Get integrated workflow status
router.get('/status', (req: Request, res: Response) => {
  const structureStatus = functionalStructures.getStructureStatus();
  const relationshipMetrics = businessRelationshipService.getRelationshipMetrics();

  res.json({
    success: true,
    bridge: {
      active: true,
      synchronized: true,
      timestamp: new Date().toISOString()
    },
    functionalStructures: {
      total: structureStatus.totalStructures,
      operational: structureStatus.operational,
      averagePower: structureStatus.averagePowerLevel
    },
    businessRelationships: {
      contacts: relationshipMetrics.totalContacts,
      opportunities: relationshipMetrics.opportunities.total,
      partnerships: relationshipMetrics.partnerships.total
    },
    fccEntity: '20130314143016'
  });
});

// Map functional structures to business relationships
router.get('/relationship-mapping', (req: Request, res: Response) => {
  const structures = functionalStructures.getAllStructures();
  const contacts = businessRelationshipService.getAllContacts();
  const partnerships = businessRelationshipService.getAllPartnerships();

  const mapping = structures.map(structure => ({
    structure: {
      id: structure.id,
      name: structure.name,
      powerLevel: structure.powerLevel,
      modules: structure.modules.length
    },
    relatedContacts: contacts.filter(c => 
      c.industry?.toLowerCase().includes(structure.name.toLowerCase().split(' ')[0])
    ),
    relatedPartnerships: partnerships.filter(p =>
      p.type === 'technology' && structure.name.includes('Infrastructure')
    )
  }));

  res.json({
    success: true,
    mapping,
    totalMappings: mapping.length,
    fccEntity: '20130314143016'
  });
});

// Execute workflow with relationship context
router.post('/execute-workflow', async (req: Request, res: Response) => {
  const { moduleId, functionName, contactId, params } = req.body;

  if (!moduleId || !functionName) {
    return res.status(400).json({
      success: false,
      error: 'moduleId and functionName required'
    });
  }

  // Execute function
  const execution = functionalStructures.executeFunction(moduleId, functionName, params);

  // Link to contact if provided
  let contactInfo = null;
  if (contactId) {
    contactInfo = businessRelationshipService.getContact(contactId);
  }

  res.json({
    success: true,
    execution,
    contact: contactInfo,
    workflow: {
      module: moduleId,
      function: functionName,
      timestamp: new Date().toISOString()
    },
    fccEntity: '20130314143016'
  });
});

// Create opportunity from functional structure
router.post('/create-opportunity', (req: Request, res: Response) => {
  const { structureId, contactId, title, value, description } = req.body;

  if (!structureId || !contactId) {
    return res.status(400).json({
      success: false,
      error: 'structureId and contactId required'
    });
  }

  const structure = functionalStructures.getStructure(structureId);
  const contact = businessRelationshipService.getContact(contactId);

  if (!structure || !contact) {
    return res.status(404).json({
      success: false,
      error: 'Structure or contact not found'
    });
  }

  const opportunity = businessRelationshipService.createOpportunity({
    id: `opp_${Date.now()}`,
    contactId,
    title: title || `${structure.name} Integration`,
    description: description || `Integration opportunity for ${structure.name}`,
    value: value || 50000,
    stage: 'qualified',
    probability: structure.powerLevel,
    samGovRelated: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  res.json({
    success: true,
    opportunity,
    structure,
    contact,
    message: 'Opportunity created and linked to functional structure',
    fccEntity: '20130314143016'
  });
});

// Get workflow recommendations
router.get('/recommendations', (req: Request, res: Response) => {
  const structures = functionalStructures.getAllStructures();
  const opportunities = businessRelationshipService.getAllOpportunities();

  const recommendations = structures
    .filter(s => s.operational && s.powerLevel > 90)
    .map(structure => ({
      structure: structure.name,
      powerLevel: structure.powerLevel,
      recommendation: `High-performance ${structure.name} ready for partnership opportunities`,
      suggestedAction: 'Create strategic partnership',
      relatedOpportunities: opportunities.filter(o => o.stage !== 'closed-lost').length
    }));

  res.json({
    success: true,
    recommendations,
    totalRecommendations: recommendations.length,
    fccEntity: '20130314143016'
  });
});

// Health check for bridge
router.get('/health', (req: Request, res: Response) => {
  const structuresHealth = functionalStructures.getStructureStatus();
  const relationshipsHealth = businessRelationshipService.getRelationshipMetrics();

  const health = {
    bridge: 'operational',
    functionalStructures: structuresHealth.operational === structuresHealth.totalStructures ? 'healthy' : 'degraded',
    businessRelationships: relationshipsHealth.totalContacts > 0 ? 'active' : 'initializing',
    integration: 'synchronized',
    timestamp: new Date().toISOString()
  };

  res.json({
    success: true,
    health,
    fccEntity: '20130314143016'
  });
});

export default router;
