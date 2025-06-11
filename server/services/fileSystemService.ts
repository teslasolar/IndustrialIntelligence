import * as fs from 'fs/promises';
import * as path from 'path';
import { storage } from '../storage';
import { InsertFile, InsertDirectory } from '@shared/schema';

export class FileSystemService {
  private basePath: string;

  constructor(basePath: string = './workspace') {
    this.basePath = basePath;
    this.ensureBaseDirectory();
  }

  private async ensureBaseDirectory() {
    try {
      await fs.access(this.basePath);
    } catch {
      await fs.mkdir(this.basePath, { recursive: true });
    }
  }

  async scanDirectory(directoryPath: string): Promise<{ files: string[], directories: string[] }> {
    const fullPath = path.join(this.basePath, directoryPath);
    const files: string[] = [];
    const directories: string[] = [];

    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          directories.push(entry.name);
        } else {
          files.push(entry.name);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${directoryPath}:`, error);
    }

    return { files, directories };
  }

  async getFileStats(filePath: string): Promise<{ size: number, modified: Date } | null> {
    try {
      const fullPath = path.join(this.basePath, filePath);
      const stats = await fs.stat(fullPath);
      return {
        size: stats.size,
        modified: stats.mtime,
      };
    } catch (error) {
      console.error(`Error getting file stats for ${filePath}:`, error);
      return null;
    }
  }

  async createDirectory(directoryPath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.basePath, directoryPath);
      await fs.mkdir(fullPath, { recursive: true });
      return true;
    } catch (error) {
      console.error(`Error creating directory ${directoryPath}:`, error);
      return false;
    }
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.basePath, filePath);
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
      return false;
    }
  }

  async copyFile(sourcePath: string, destinationPath: string): Promise<boolean> {
    try {
      const fullSourcePath = path.join(this.basePath, sourcePath);
      const fullDestPath = path.join(this.basePath, destinationPath);
      await fs.copyFile(fullSourcePath, fullDestPath);
      return true;
    } catch (error) {
      console.error(`Error copying file from ${sourcePath} to ${destinationPath}:`, error);
      return false;
    }
  }

  async writeFile(filePath: string, content: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.basePath, filePath);
      await fs.writeFile(fullPath, content);
      return true;
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
      return false;
    }
  }

  async readFile(filePath: string): Promise<string | null> {
    try {
      const fullPath = path.join(this.basePath, filePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      return content;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return null;
    }
  }

  getFileType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const typeMap: { [key: string]: string } = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.json': 'JSON',
      '.html': 'HTML',
      '.css': 'CSS',
      '.md': 'Markdown',
      '.txt': 'Text',
      '.py': 'Python',
      '.java': 'Java',
      '.cpp': 'C++',
      '.c': 'C',
    };
    
    return typeMap[ext] || 'Unknown';
  }

  calculateChecksum(content: string): string {
    // Simple checksum - in production you'd use crypto
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0') + '...';
  }
}
