
import express, { Request, Response } from 'express';
import { contentControlService } from '../services/ContentControlService.js';

const router = express.Router();

interface ContentBackup {
  id: string;
  timestamp: number;
  content: Map<string, any>;
  description: string;
}

class ContentRollbackManager {
  private backups: ContentBackup[] = [];
  private maxBackups = 10;

  createBackup(description: string): ContentBackup {
    const backup: ContentBackup = {
      id: `backup-${Date.now()}`,
      timestamp: Date.now(),
      content: new Map(contentControlService['content']),
      description
    };

    this.backups.unshift(backup);
    
    if (this.backups.length > this.maxBackups) {
      this.backups = this.backups.slice(0, this.maxBackups);
    }

    return backup;
  }

  getBackups(): ContentBackup[] {
    return this.backups.map(b => ({
      id: b.id,
      timestamp: b.timestamp,
      content: new Map(),
      description: b.description
    }));
  }

  rollback(backupId: string): boolean {
    const backup = this.backups.find(b => b.id === backupId);
    if (!backup) return false;

    contentControlService['content'] = new Map(backup.content);
    return true;
  }

  organizeContent(): { organized: number; categorized: Map<string, number> } {
    const content = Array.from(contentControlService['content'].values());
    const categorized = new Map<string, number>();

    content.forEach(item => {
      const category = item.type || 'uncategorized';
      categorized.set(category, (categorized.get(category) || 0) + 1);
    });

    return {
      organized: content.length,
      categorized
    };
  }
}

const rollbackManager = new ContentRollbackManager();

router.post('/backup', (req: Request, res: Response) => {
  const { description } = req.body;
  
  const backup = rollbackManager.createBackup(
    description || `Backup created at ${new Date().toISOString()}`
  );

  res.json({
    success: true,
    backup: {
      id: backup.id,
      timestamp: backup.timestamp,
      description: backup.description
    },
    fccEntity: '20130314143016'
  });
});

router.get('/backups', (req: Request, res: Response) => {
  const backups = rollbackManager.getBackups();

  res.json({
    success: true,
    backups: backups.map(b => ({
      id: b.id,
      timestamp: b.timestamp,
      description: b.description,
      date: new Date(b.timestamp).toISOString()
    })),
    count: backups.length,
    fccEntity: '20130314143016'
  });
});

router.post('/rollback/:backupId', (req: Request, res: Response) => {
  const { backupId } = req.params;
  
  const success = rollbackManager.rollback(backupId);

  if (success) {
    res.json({
      success: true,
      message: 'Content rolled back successfully',
      backupId,
      timestamp: Date.now(),
      fccEntity: '20130314143016'
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Backup not found',
      fccEntity: '20130314143016'
    });
  }
});

router.post('/organize', (req: Request, res: Response) => {
  const result = rollbackManager.organizeContent();

  res.json({
    success: true,
    organized: result.organized,
    categories: Object.fromEntries(result.categorized),
    fccEntity: '20130314143016'
  });
});

router.get('/status', (req: Request, res: Response) => {
  const stats = contentControlService.getStats();
  const backups = rollbackManager.getBackups();

  res.json({
    success: true,
    content: {
      total: stats.totalContent,
      byType: stats.contentByType,
      byAccess: stats.contentByAccess
    },
    backups: {
      count: backups.length,
      latest: backups[0] || null
    },
    fccEntity: '20130314143016'
  });
});

export default router;
