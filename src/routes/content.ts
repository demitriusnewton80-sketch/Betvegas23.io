
import express, { Request, Response } from 'express';
import { contentControlService } from '../services/ContentControlService.js';
import { ssoService } from '../services/SSOService.js';

const router = express.Router();

// Middleware for SSO authentication
const requireAuth = (req: Request, res: Response, next: Function) => {
  const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');

  if (!sessionId) {
    return res.status(401).json({ error: 'SSO authentication required' });
  }

  const user = ssoService.validateSession(sessionId);
  if (!user) {
    return res.status(401).json({ error: 'Invalid SSO session' });
  }

  (req as any).user = user;
  next();
};

// Create new content
router.post('/create', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const contentData = req.body;

  const content = contentControlService.createContent(user, contentData);

  res.json({
    message: 'Content created successfully',
    content,
    fccCompliant: true,
    entity: '20130314143016'
  });
});

// Get content by ID
router.get('/:contentId', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { contentId } = req.params;

  const content = contentControlService.getContent(user, contentId);

  if (!content) {
    return res.status(404).json({ 
      error: 'Content not found or access denied',
      fccEntity: '20130314143016'
    });
  }

  res.json({
    content,
    fccCompliant: true
  });
});

// Update content
router.put('/:contentId', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { contentId } = req.params;
  const updates = req.body;

  const success = contentControlService.updateContent(user, contentId, updates);

  if (!success) {
    return res.status(403).json({ error: 'Update denied - insufficient permissions' });
  }

  res.json({
    message: 'Content updated successfully',
    contentId
  });
});

// Delete content
router.delete('/:contentId', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { contentId } = req.params;

  const success = contentControlService.deleteContent(user, contentId);

  if (!success) {
    return res.status(403).json({ error: 'Delete denied - insufficient permissions' });
  }

  res.json({
    message: 'Content deleted successfully',
    contentId
  });
});

// List user's content
router.get('/my/list', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const content = contentControlService.getUserContent(user);

  res.json({
    content,
    count: content.length,
    user: {
      id: user.id,
      email: user.email,
      provider: user.provider
    }
  });
});

// Share content with another user
router.post('/:contentId/share', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { contentId } = req.params;
  const { targetUserId, permissions, expiresIn } = req.body;

  if (!targetUserId || !permissions) {
    return res.status(400).json({ error: 'targetUserId and permissions required' });
  }

  const success = contentControlService.shareContent(user, contentId, targetUserId, permissions);

  if (!success) {
    return res.status(403).json({ error: 'Share denied - insufficient permissions' });
  }

  res.json({
    message: 'Content shared successfully',
    contentId,
    sharedWith: targetUserId,
    permissions
  });
});

// Grant access to content
router.post('/:contentId/access/grant', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { contentId } = req.params;
  const { userId, permissions, expiresAt } = req.body;

  // Check if requester has share permission
  if (!contentControlService.hasAccess(user.id, contentId, 'share')) {
    return res.status(403).json({ error: 'Insufficient permissions to grant access' });
  }

  const success = contentControlService.grantAccess(userId, contentId, permissions, expiresAt);

  res.json({
    message: 'Access granted',
    userId,
    contentId,
    permissions,
    success
  });
});

// Revoke access from content
router.post('/:contentId/access/revoke', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { contentId } = req.params;
  const { userId } = req.body;

  // Check if requester has share permission
  if (!contentControlService.hasAccess(user.id, contentId, 'share')) {
    return res.status(403).json({ error: 'Insufficient permissions to revoke access' });
  }

  const success = contentControlService.revokeAccess(userId, contentId);

  res.json({
    message: 'Access revoked',
    userId,
    contentId,
    success
  });
});

// Get content statistics
router.get('/system/stats', requireAuth, (req: Request, res: Response) => {
  const stats = contentControlService.getStats();

  res.json({
    stats,
    fccEntity: '20130314143016',
    ssoProvider: 'FCC-SSO'
  });
});

// Get audit log for content
router.get('/:contentId/audit', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { contentId } = req.params;

  // Verify user has access to this content
  if (!contentControlService.hasAccess(user.id, contentId, 'read')) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const auditLog = contentControlService.getAuditLog(user, contentId);

  res.json({
    contentId,
    auditLog,
    count: auditLog.length
  });
});

export default router;
