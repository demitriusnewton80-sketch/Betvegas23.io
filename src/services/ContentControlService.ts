
import { EventEmitter } from 'events';
import { ssoService, SSOUser } from './SSOService.js';

export interface ContentItem {
  id: string;
  title: string;
  type: 'stream' | 'document' | 'media' | 'data';
  owner: string;
  accessLevel: 'public' | 'private' | 'restricted';
  allowedUsers?: string[];
  allowedRoles?: string[];
  metadata: {
    createdAt: number;
    updatedAt: number;
    size?: number;
    format?: string;
  };
  fccCompliant: boolean;
  encryptionEnabled: boolean;
}

export interface AccessControl {
  userId: string;
  contentId: string;
  permissions: ('read' | 'write' | 'delete' | 'share')[];
  grantedAt: number;
  expiresAt?: number;
}

class ContentControlService extends EventEmitter {
  private content: Map<string, ContentItem> = new Map();
  private accessControls: Map<string, AccessControl[]> = new Map();
  private auditLog: Array<{
    action: string;
    userId: string;
    contentId: string;
    timestamp: number;
    success: boolean;
  }> = [];

  // Create new content item
  createContent(user: SSOUser, contentData: Partial<ContentItem>): ContentItem {
    const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const content: ContentItem = {
      id: contentId,
      title: contentData.title || 'Untitled',
      type: contentData.type || 'data',
      owner: user.id,
      accessLevel: contentData.accessLevel || 'private',
      allowedUsers: contentData.allowedUsers || [],
      allowedRoles: contentData.allowedRoles || [],
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        size: contentData.metadata?.size,
        format: contentData.metadata?.format
      },
      fccCompliant: true,
      encryptionEnabled: contentData.accessLevel !== 'public'
    };

    this.content.set(contentId, content);
    
    // Grant full access to owner
    this.grantAccess(user.id, contentId, ['read', 'write', 'delete', 'share']);
    
    this.logAudit('create_content', user.id, contentId, true);
    this.emit('contentCreated', content);
    
    return content;
  }

  // Check if user has access to content
  hasAccess(userId: string, contentId: string, permission: 'read' | 'write' | 'delete' | 'share'): boolean {
    const content = this.content.get(contentId);
    if (!content) return false;

    // Owner has all permissions
    if (content.owner === userId) return true;

    // Public content allows read access
    if (content.accessLevel === 'public' && permission === 'read') return true;

    // Check explicit access controls
    const userAccess = this.accessControls.get(contentId)?.find(ac => ac.userId === userId);
    if (!userAccess) return false;

    // Check if access has expired
    if (userAccess.expiresAt && Date.now() > userAccess.expiresAt) {
      return false;
    }

    return userAccess.permissions.includes(permission);
  }

  // Grant access to user
  grantAccess(
    userId: string, 
    contentId: string, 
    permissions: ('read' | 'write' | 'delete' | 'share')[],
    expiresAt?: number
  ): boolean {
    if (!this.content.has(contentId)) return false;

    const access: AccessControl = {
      userId,
      contentId,
      permissions,
      grantedAt: Date.now(),
      expiresAt
    };

    const existing = this.accessControls.get(contentId) || [];
    const filtered = existing.filter(ac => ac.userId !== userId);
    filtered.push(access);
    
    this.accessControls.set(contentId, filtered);
    
    this.emit('accessGranted', { userId, contentId, permissions });
    return true;
  }

  // Revoke access from user
  revokeAccess(userId: string, contentId: string): boolean {
    const existing = this.accessControls.get(contentId) || [];
    const filtered = existing.filter(ac => ac.userId !== userId);
    
    this.accessControls.set(contentId, filtered);
    this.emit('accessRevoked', { userId, contentId });
    return true;
  }

  // Get content with SSO validation
  getContent(user: SSOUser, contentId: string): ContentItem | null {
    if (!this.hasAccess(user.id, contentId, 'read')) {
      this.logAudit('access_denied', user.id, contentId, false);
      return null;
    }

    const content = this.content.get(contentId);
    if (content) {
      this.logAudit('access_content', user.id, contentId, true);
    }
    
    return content || null;
  }

  // Update content
  updateContent(user: SSOUser, contentId: string, updates: Partial<ContentItem>): boolean {
    if (!this.hasAccess(user.id, contentId, 'write')) {
      this.logAudit('update_denied', user.id, contentId, false);
      return false;
    }

    const content = this.content.get(contentId);
    if (!content) return false;

    const updated = {
      ...content,
      ...updates,
      metadata: {
        ...content.metadata,
        updatedAt: Date.now()
      }
    };

    this.content.set(contentId, updated);
    this.logAudit('update_content', user.id, contentId, true);
    this.emit('contentUpdated', updated);
    
    return true;
  }

  // Delete content
  deleteContent(user: SSOUser, contentId: string): boolean {
    if (!this.hasAccess(user.id, contentId, 'delete')) {
      this.logAudit('delete_denied', user.id, contentId, false);
      return false;
    }

    this.content.delete(contentId);
    this.accessControls.delete(contentId);
    
    this.logAudit('delete_content', user.id, contentId, true);
    this.emit('contentDeleted', contentId);
    
    return true;
  }

  // List user's accessible content
  getUserContent(user: SSOUser): ContentItem[] {
    const accessible: ContentItem[] = [];

    for (const [contentId, content] of this.content.entries()) {
      if (this.hasAccess(user.id, contentId, 'read')) {
        accessible.push(content);
      }
    }

    return accessible;
  }

  // Share content with another user
  shareContent(
    owner: SSOUser, 
    contentId: string, 
    targetUserId: string, 
    permissions: ('read' | 'write' | 'delete' | 'share')[]
  ): boolean {
    if (!this.hasAccess(owner.id, contentId, 'share')) {
      this.logAudit('share_denied', owner.id, contentId, false);
      return false;
    }

    this.grantAccess(targetUserId, contentId, permissions);
    this.logAudit('share_content', owner.id, contentId, true);
    
    return true;
  }

  // Get audit log
  getAuditLog(adminUser: SSOUser, contentId?: string): any[] {
    // In production, verify admin role
    if (contentId) {
      return this.auditLog.filter(log => log.contentId === contentId);
    }
    return this.auditLog;
  }

  // Private: Log audit event
  private logAudit(action: string, userId: string, contentId: string, success: boolean): void {
    this.auditLog.push({
      action,
      userId,
      contentId,
      timestamp: Date.now(),
      success
    });

    // Keep only last 10000 entries
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-10000);
    }
  }

  // Get content statistics
  getStats(): any {
    const totalContent = this.content.size;
    const contentByType = new Map<string, number>();
    const contentByAccess = new Map<string, number>();

    for (const content of this.content.values()) {
      contentByType.set(content.type, (contentByType.get(content.type) || 0) + 1);
      contentByAccess.set(content.accessLevel, (contentByAccess.get(content.accessLevel) || 0) + 1);
    }

    return {
      totalContent,
      contentByType: Object.fromEntries(contentByType),
      contentByAccess: Object.fromEntries(contentByAccess),
      totalAuditEntries: this.auditLog.length,
      fccEntity: '20130314143016'
    };
  }
}

export const contentControlService = new ContentControlService();
