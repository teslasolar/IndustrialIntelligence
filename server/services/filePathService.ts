import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';

export interface FilePathItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: Date;
  checksum?: string;
  depth: number;
  extension?: string;
  permissions: string;
  isHidden: boolean;
}

export interface DirectoryStructure {
  path: string;
  name: string;
  files: FilePathItem[];
  directories: FilePathItem[];
  totalSize: number;
  totalFiles: number;
  lastModified: Date;
}

export class FilePathService {
  private basePath: string;
  private cache: Map<string, DirectoryStructure> = new Map();
  private watchedPaths: Set<string> = new Set();

  constructor(basePath: string = '.') {
    this.basePath = path.resolve(basePath);
  }

  async scanPath(relativePath: string): Promise<DirectoryStructure> {
    const fullPath = path.resolve(this.basePath, relativePath);
    const normalizedPath = path.relative(this.basePath, fullPath);
    
    // Check cache first
    if (this.cache.has(normalizedPath)) {
      const cached = this.cache.get(normalizedPath)!;
      // Return cached if less than 5 seconds old
      if (Date.now() - cached.lastModified.getTime() < 5000) {
        return cached;
      }
    }

    try {
      const stats = await fs.stat(fullPath);
      
      if (!stats.isDirectory()) {
        throw new Error(`Path ${relativePath} is not a directory`);
      }

      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const files: FilePathItem[] = [];
      const directories: FilePathItem[] = [];
      let totalSize = 0;
      let totalFiles = 0;

      for (const entry of entries) {
        const entryPath = path.join(fullPath, entry.name);
        const entryStats = await fs.stat(entryPath);
        const relativEntryPath = path.relative(this.basePath, entryPath);
        
        const filePathItem: FilePathItem = {
          id: this.generateFileId(relativEntryPath),
          name: entry.name,
          path: relativEntryPath,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: entryStats.size,
          modified: entryStats.mtime,
          depth: relativEntryPath.split(path.sep).length,
          extension: entry.isFile() ? path.extname(entry.name) : undefined,
          permissions: this.getPermissionsString(entryStats.mode),
          isHidden: entry.name.startsWith('.')
        };

        if (entry.isFile()) {
          filePathItem.checksum = await this.calculateFileChecksum(entryPath);
          files.push(filePathItem);
          totalSize += entryStats.size;
          totalFiles++;
        } else {
          directories.push(filePathItem);
        }
      }

      const structure: DirectoryStructure = {
        path: normalizedPath,
        name: path.basename(normalizedPath) || 'root',
        files: files.sort((a, b) => a.name.localeCompare(b.name)),
        directories: directories.sort((a, b) => a.name.localeCompare(b.name)),
        totalSize,
        totalFiles,
        lastModified: new Date()
      };

      // Cache the result
      this.cache.set(normalizedPath, structure);
      
      return structure;
    } catch (error) {
      console.error(`Error scanning path ${relativePath}:`, error);
      throw error;
    }
  }

  async getFileContent(relativePath: string): Promise<string> {
    const fullPath = path.resolve(this.basePath, relativePath);
    
    try {
      const stats = await fs.stat(fullPath);
      if (!stats.isFile()) {
        throw new Error(`Path ${relativePath} is not a file`);
      }
      
      // Only read text files under 1MB
      if (stats.size > 1024 * 1024) {
        throw new Error('File too large to read');
      }
      
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      console.error(`Error reading file ${relativePath}:`, error);
      throw error;
    }
  }

  async createDirectory(relativePath: string): Promise<boolean> {
    const fullPath = path.resolve(this.basePath, relativePath);
    
    try {
      await fs.mkdir(fullPath, { recursive: true });
      this.invalidateCache(path.dirname(relativePath));
      return true;
    } catch (error) {
      console.error(`Error creating directory ${relativePath}:`, error);
      return false;
    }
  }

  async writeFile(relativePath: string, content: string): Promise<boolean> {
    const fullPath = path.resolve(this.basePath, relativePath);
    
    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, 'utf-8');
      this.invalidateCache(path.dirname(relativePath));
      return true;
    } catch (error) {
      console.error(`Error writing file ${relativePath}:`, error);
      return false;
    }
  }

  async deleteFile(relativePath: string): Promise<boolean> {
    const fullPath = path.resolve(this.basePath, relativePath);
    
    try {
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        await fs.rmdir(fullPath, { recursive: true });
      } else {
        await fs.unlink(fullPath);
      }
      
      this.invalidateCache(path.dirname(relativePath));
      return true;
    } catch (error) {
      console.error(`Error deleting ${relativePath}:`, error);
      return false;
    }
  }

  async copyFile(sourcePath: string, destinationPath: string): Promise<boolean> {
    const sourceFullPath = path.resolve(this.basePath, sourcePath);
    const destFullPath = path.resolve(this.basePath, destinationPath);
    
    try {
      await fs.mkdir(path.dirname(destFullPath), { recursive: true });
      await fs.copyFile(sourceFullPath, destFullPath);
      this.invalidateCache(path.dirname(destinationPath));
      return true;
    } catch (error) {
      console.error(`Error copying file from ${sourcePath} to ${destinationPath}:`, error);
      return false;
    }
  }

  async getPathStats(relativePath: string): Promise<FilePathItem | null> {
    const fullPath = path.resolve(this.basePath, relativePath);
    
    try {
      const stats = await fs.stat(fullPath);
      const name = path.basename(relativePath);
      
      return {
        id: this.generateFileId(relativePath),
        name,
        path: relativePath,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        modified: stats.mtime,
        depth: relativePath.split(path.sep).length,
        extension: stats.isFile() ? path.extname(name) : undefined,
        permissions: this.getPermissionsString(stats.mode),
        isHidden: name.startsWith('.'),
        checksum: stats.isFile() ? await this.calculateFileChecksum(fullPath) : undefined
      };
    } catch (error) {
      console.error(`Error getting stats for ${relativePath}:`, error);
      return null;
    }
  }

  async searchFiles(pattern: string, searchPath: string = '.'): Promise<FilePathItem[]> {
    const results: FilePathItem[] = [];
    const searchRegex = new RegExp(pattern, 'i');
    
    try {
      const structure = await this.scanPath(searchPath);
      
      // Search in current directory
      for (const file of structure.files) {
        if (searchRegex.test(file.name) || searchRegex.test(file.path)) {
          results.push(file);
        }
      }
      
      // Recursively search subdirectories
      for (const dir of structure.directories) {
        if (!dir.isHidden) {
          const subResults = await this.searchFiles(pattern, dir.path);
          results.push(...subResults);
        }
      }
    } catch (error) {
      console.error(`Error searching for pattern ${pattern} in ${searchPath}:`, error);
    }
    
    return results;
  }

  private generateFileId(filePath: string): string {
    return createHash('md5').update(filePath).digest('hex').substring(0, 8);
  }

  private async calculateFileChecksum(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath);
      return createHash('md5').update(content).digest('hex');
    } catch (error) {
      return 'error';
    }
  }

  private getPermissionsString(mode: number): string {
    const permissions = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
    const user = permissions[(mode >> 6) & 7];
    const group = permissions[(mode >> 3) & 7];
    const other = permissions[mode & 7];
    return user + group + other;
  }

  private invalidateCache(dirPath: string): void {
    const normalizedPath = path.normalize(dirPath);
    this.cache.delete(normalizedPath);
    
    // Also invalidate parent directories
    let parentPath = path.dirname(normalizedPath);
    while (parentPath !== normalizedPath && parentPath !== '.') {
      this.cache.delete(parentPath);
      normalizedPath = parentPath;
      parentPath = path.dirname(parentPath);
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getBasePath(): string {
    return this.basePath;
  }
}

export const filePathService = new FilePathService();