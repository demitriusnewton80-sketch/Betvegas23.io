
import express, { Request, Response } from 'express';
import { businessRelationshipService } from '../services/BusinessRelationshipService.js';
import { ssoService } from '../services/SSOService.js';

const router = express.Router();

// Middleware for authentication
const requireAuth = (req: Request, res: Response, next: Function) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');

  if (!sessionId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = ssoService.validateSession(sessionId);
  if (!user) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  (req as any).user = user;
  next();
};

// Get all contacts
router.get('/contacts', (req: Request, res: Response) => {
  const contacts = businessRelationshipService.getAllContacts();
  
  res.json({
    success: true,
    contacts,
    count: contacts.length,
    fccEntity: '20130314143016'
  });
});

// Search contacts
router.get('/contacts/search', (req: Request, res: Response) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Search query required' });
  }

  const results = businessRelationshipService.searchContacts(q as string);
  
  res.json({
    success: true,
    results,
    count: results.length,
    query: q
  });
});

// Get single contact
router.get('/contacts/:id', (req: Request, res: Response) => {
  const contact = businessRelationshipService.getContact(req.params.id);
  
  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  res.json({
    success: true,
    contact
  });
});

// Add new contact
router.post('/contacts', requireAuth, (req: Request, res: Response) => {
  const contactData = {
    id: `contact_${Date.now()}`,
    ...req.body,
    createdAt: new Date()
  };

  const contact = businessRelationshipService.addContact(contactData);
  
  res.json({
    success: true,
    contact,
    message: 'Contact added successfully'
  });
});

// Update contact
router.put('/contacts/:id', requireAuth, (req: Request, res: Response) => {
  const updated = businessRelationshipService.updateContact(req.params.id, req.body);
  
  if (!updated) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  res.json({
    success: true,
    contact: updated,
    message: 'Contact updated successfully'
  });
});

// Get all opportunities
router.get('/opportunities', (req: Request, res: Response) => {
  const opportunities = businessRelationshipService.getAllOpportunities();
  
  res.json({
    success: true,
    opportunities,
    count: opportunities.length,
    fccEntity: '20130314143016'
  });
});

// Create opportunity
router.post('/opportunities', requireAuth, (req: Request, res: Response) => {
  const opportunityData = {
    id: `opp_${Date.now()}`,
    ...req.body,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const opportunity = businessRelationshipService.createOpportunity(opportunityData);
  
  res.json({
    success: true,
    opportunity,
    message: 'Opportunity created successfully'
  });
});

// Update opportunity stage
router.patch('/opportunities/:id/stage', requireAuth, (req: Request, res: Response) => {
  const { stage } = req.body;
  
  if (!stage) {
    return res.status(400).json({ error: 'Stage required' });
  }

  const updated = businessRelationshipService.updateOpportunityStage(req.params.id, stage);
  
  if (!updated) {
    return res.status(404).json({ error: 'Opportunity not found' });
  }

  res.json({
    success: true,
    opportunity: updated,
    message: 'Opportunity stage updated'
  });
});

// Get all partnerships
router.get('/partnerships', (req: Request, res: Response) => {
  const partnerships = businessRelationshipService.getAllPartnerships();
  
  res.json({
    success: true,
    partnerships,
    count: partnerships.length,
    fccEntity: '20130314143016'
  });
});

// Add partnership
router.post('/partnerships', requireAuth, (req: Request, res: Response) => {
  const partnershipData = {
    id: `partner_${Date.now()}`,
    ...req.body,
    startDate: new Date()
  };

  const partnership = businessRelationshipService.addPartnership(partnershipData);
  
  res.json({
    success: true,
    partnership,
    message: 'Partnership added successfully'
  });
});

// Get relationship metrics
router.get('/metrics', (req: Request, res: Response) => {
  const metrics = businessRelationshipService.getRelationshipMetrics();
  
  res.json({
    success: true,
    metrics,
    fccEntity: '20130314143016',
    timestamp: new Date().toISOString()
  });
});

// Get network map
router.get('/network-map', (req: Request, res: Response) => {
  const networkMap = businessRelationshipService.getNetworkMap();
  
  res.json({
    success: true,
    networkMap,
    fccEntity: '20130314143016'
  });
});

export default router;
