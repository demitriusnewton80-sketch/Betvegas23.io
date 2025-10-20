
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

interface ARNInfo {
  arn: string;
  service: string;
  region: string;
  accountId: string;
  resourceType: string;
  resourceId: string;
  source: string;
  isValid: boolean;
}

interface ARNSearchResult {
  totalFound: number;
  arns: ARNInfo[];
  sources: string[];
}

export class ARNFinderService extends EventEmitter {
  private static instance: ARNFinderService;
  private arnCache: Map<string, ARNInfo> = new Map();
  private readonly ARN_PATTERN = /arn:aws:[a-z\-]+:[a-z0-9\-]*:\d{12}:[a-zA-Z0-9\/\-_\.\:]+/g;

  private constructor() {
    super();
  }

  static getInstance(): ARNFinderService {
    if (!ARNFinderService.instance) {
      ARNFinderService.instance = new ARNFinderService();
    }
    return ARNFinderService.instance;
  }

  // Parse ARN string into components
  parseARN(arnString: string): ARNInfo | null {
    const parts = arnString.split(':');
    
    if (parts.length < 6 || parts[0] !== 'arn' || parts[1] !== 'aws') {
      return null;
    }

    const resourceParts = parts.slice(5).join(':').split('/');
    
    return {
      arn: arnString,
      service: parts[2],
      region: parts[3] || 'global',
      accountId: parts[4],
      resourceType: resourceParts[0],
      resourceId: resourceParts.slice(1).join('/') || resourceParts[0],
      source: 'parsed',
      isValid: this.validateARN(arnString)
    };
  }

  // Validate ARN format
  validateARN(arn: string): boolean {
    const arnPattern = /^arn:aws:[a-z\-]+:[a-z0-9\-]*:\d{12}:[a-zA-Z0-9\/\-_\.\:]+$/;
    return arnPattern.test(arn);
  }

  // Search for ARNs in text content
  findARNsInText(text: string, source: string = 'text'): ARNInfo[] {
    const matches = text.match(this.ARN_PATTERN);
    if (!matches) return [];

    return matches.map(arn => {
      const parsed = this.parseARN(arn);
      if (parsed) {
        parsed.source = source;
        this.arnCache.set(arn, parsed);
      }
      return parsed;
    }).filter(arn => arn !== null) as ARNInfo[];
  }

  // Search for ARNs in a file
  async findARNsInFile(filePath: string): Promise<ARNInfo[]> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return this.findARNsInText(content, filePath);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return [];
    }
  }

  // Search for ARNs in directory
  async findARNsInDirectory(dirPath: string, recursive: boolean = true): Promise<ARNSearchResult> {
    const arns: ARNInfo[] = [];
    const sources: Set<string> = new Set();

    async function searchDir(currentPath: string) {
      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);

          if (entry.isDirectory() && recursive) {
            if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
              await searchDir(fullPath);
            }
          } else if (entry.isFile()) {
            // Only search text-based files
            const ext = path.extname(entry.name).toLowerCase();
            const textExtensions = ['.ts', '.js', '.json', '.txt', '.md', '.env', '.yml', '.yaml', '.html', '.css'];
            
            if (textExtensions.includes(ext)) {
              const fileArns = await ARNFinderService.getInstance().findARNsInFile(fullPath);
              arns.push(...fileArns);
              if (fileArns.length > 0) {
                sources.add(fullPath);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error searching directory ${currentPath}:`, error);
      }
    }

    await searchDir(dirPath);

    return {
      totalFound: arns.length,
      arns: this.deduplicateARNs(arns),
      sources: Array.from(sources)
    };
  }

  // Remove duplicate ARNs
  private deduplicateARNs(arns: ARNInfo[]): ARNInfo[] {
    const unique = new Map<string, ARNInfo>();
    
    for (const arn of arns) {
      if (!unique.has(arn.arn)) {
        unique.set(arn.arn, arn);
      }
    }
    
    return Array.from(unique.values());
  }

  // Group ARNs by service
  groupByService(arns: ARNInfo[]): Record<string, ARNInfo[]> {
    const grouped: Record<string, ARNInfo[]> = {};
    
    for (const arn of arns) {
      if (!grouped[arn.service]) {
        grouped[arn.service] = [];
      }
      grouped[arn.service].push(arn);
    }
    
    return grouped;
  }

  // Group ARNs by account
  groupByAccount(arns: ARNInfo[]): Record<string, ARNInfo[]> {
    const grouped: Record<string, ARNInfo[]> = {};
    
    for (const arn of arns) {
      if (!grouped[arn.accountId]) {
        grouped[arn.accountId] = [];
      }
      grouped[arn.accountId].push(arn);
    }
    
    return grouped;
  }

  // Get all cached ARNs
  getCachedARNs(): ARNInfo[] {
    return Array.from(this.arnCache.values());
  }

  // Clear cache
  clearCache(): void {
    this.arnCache.clear();
  }

  // Build ARN from components
  buildARN(service: string, region: string, accountId: string, resourceType: string, resourceId: string): string {
    return `arn:aws:${service}:${region}:${accountId}:${resourceType}${resourceId ? '/' + resourceId : ''}`;
  }

  // Get ARN statistics
  getStatistics(): {
    totalARNs: number;
    byService: Record<string, number>;
    byRegion: Record<string, number>;
    byAccount: Record<string, number>;
  } {
    const arns = this.getCachedARNs();
    const byService: Record<string, number> = {};
    const byRegion: Record<string, number> = {};
    const byAccount: Record<string, number> = {};

    for (const arn of arns) {
      byService[arn.service] = (byService[arn.service] || 0) + 1;
      byRegion[arn.region] = (byRegion[arn.region] || 0) + 1;
      byAccount[arn.accountId] = (byAccount[arn.accountId] || 0) + 1;
    }

    return {
      totalARNs: arns.length,
      byService,
      byRegion,
      byAccount
    };
  }
}

export const arnFinderService = ARNFinderService.getInstance();
