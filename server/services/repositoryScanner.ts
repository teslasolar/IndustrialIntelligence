import * as fs from 'fs/promises';
import * as path from 'path';

export interface DirectoryStats {
  path: string;
  fileCount: number;
  totalSize: number;
  lastModified: Date;
  fileTypes: Record<string, number>;
}

export class RepositoryScanner {
  private basePath: string;

  constructor(basePath: string = '.') {
    this.basePath = basePath;
  }

  async scanDirectory(relativePath: string): Promise<DirectoryStats> {
    const fullPath = path.join(this.basePath, relativePath);
    
    try {
      const stats = await this.getDirectoryStats(fullPath);
      return {
        path: relativePath,
        fileCount: stats.fileCount,
        totalSize: stats.totalSize,
        lastModified: stats.lastModified,
        fileTypes: stats.fileTypes
      };
    } catch (error) {
      console.error(`Error scanning directory ${relativePath}:`, error);
      return {
        path: relativePath,
        fileCount: 0,
        totalSize: 0,
        lastModified: new Date(),
        fileTypes: {}
      };
    }
  }

  private async getDirectoryStats(dirPath: string): Promise<DirectoryStats> {
    let fileCount = 0;
    let totalSize = 0;
    let lastModified = new Date(0);
    const fileTypes: Record<string, number> = {};

    try {
      await fs.access(dirPath);
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules and hidden directories
          if (entry.name.startsWith('.') || entry.name === 'node_modules') {
            continue;
          }
          
          const subStats = await this.getDirectoryStats(entryPath);
          fileCount += subStats.fileCount;
          totalSize += subStats.totalSize;
          
          if (subStats.lastModified > lastModified) {
            lastModified = subStats.lastModified;
          }
          
          // Merge file types
          Object.entries(subStats.fileTypes).forEach(([type, count]) => {
            fileTypes[type] = (fileTypes[type] || 0) + count;
          });
        } else {
          const fileStat = await fs.stat(entryPath);
          fileCount++;
          totalSize += fileStat.size;
          
          if (fileStat.mtime > lastModified) {
            lastModified = fileStat.mtime;
          }
          
          const ext = path.extname(entry.name).toLowerCase() || 'no-extension';
          fileTypes[ext] = (fileTypes[ext] || 0) + 1;
        }
      }
    } catch (error) {
      // Return empty stats if directory doesn't exist or can't be read
    }

    return {
      path: dirPath,
      fileCount,
      totalSize,
      lastModified,
      fileTypes
    };
  }

  async scanAllRepositoryAreas(): Promise<DirectoryStats[]> {
    const areas = [
      'client',
      'server', 
      'shared',
      'client/src/components',
      'server/services',
      'client/src/types',
      'client/src/hooks',
      'client/src/pages',
      'attached_assets',
      'workspace'
    ];

    const results = await Promise.all(
      areas.map(area => this.scanDirectory(area))
    );

    return results;
  }
}