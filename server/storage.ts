import { 
  users, directories, files, fileOperations, systemAlarms, systemMetrics,
  type User, type InsertUser,
  type Directory, type InsertDirectory,
  type File, type InsertFile,
  type FileOperation, type InsertFileOperation,
  type SystemAlarm, type InsertSystemAlarm,
  type SystemMetrics, type InsertSystemMetrics
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Directory operations
  getAllDirectories(): Promise<Directory[]>;
  getDirectory(id: number): Promise<Directory | undefined>;
  getDirectoryByPath(path: string): Promise<Directory | undefined>;
  createDirectory(directory: InsertDirectory): Promise<Directory>;
  updateDirectory(id: number, updates: Partial<InsertDirectory>): Promise<Directory | undefined>;
  deleteDirectory(id: number): Promise<boolean>;

  // File operations
  getFilesByDirectory(directoryId: number): Promise<File[]>;
  getFile(id: number): Promise<File | undefined>;
  getFileByPath(path: string): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, updates: Partial<InsertFile>): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;

  // File operation queue
  getAllFileOperations(): Promise<FileOperation[]>;
  getPendingFileOperations(): Promise<FileOperation[]>;
  createFileOperation(operation: InsertFileOperation): Promise<FileOperation>;
  updateFileOperation(id: number, updates: Partial<InsertFileOperation>): Promise<FileOperation | undefined>;

  // System alarms
  getAllAlarms(): Promise<SystemAlarm[]>;
  getActiveAlarms(): Promise<SystemAlarm[]>;
  createAlarm(alarm: InsertSystemAlarm): Promise<SystemAlarm>;
  acknowledgeAlarm(id: number): Promise<SystemAlarm | undefined>;

  // System metrics
  getLatestMetrics(): Promise<SystemMetrics | undefined>;
  createMetrics(metrics: InsertSystemMetrics): Promise<SystemMetrics>;
  getMetricsHistory(limit?: number): Promise<SystemMetrics[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private directories: Map<number, Directory>;
  private files: Map<number, File>;
  private fileOperations: Map<number, FileOperation>;
  private systemAlarms: Map<number, SystemAlarm>;
  private systemMetrics: Map<number, SystemMetrics>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.directories = new Map();
    this.files = new Map();
    this.fileOperations = new Map();
    this.systemAlarms = new Map();
    this.systemMetrics = new Map();
    this.currentId = 1;
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create root directory
    const rootDir: Directory = {
      id: this.currentId++,
      name: "root",
      path: "/",
      parentId: null,
      fileCount: 2,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.directories.set(rootDir.id, rootDir);

    // Create projects directory
    const projectsDir: Directory = {
      id: this.currentId++,
      name: "projects",
      path: "/projects",
      parentId: rootDir.id,
      fileCount: 1,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.directories.set(projectsDir.id, projectsDir);

    // Create automation-system directory
    const automationDir: Directory = {
      id: this.currentId++,
      name: "automation-system",
      path: "/projects/automation-system",
      parentId: projectsDir.id,
      fileCount: 12,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.directories.set(automationDir.id, automationDir);

    // Create src directory
    const srcDir: Directory = {
      id: this.currentId++,
      name: "src",
      path: "/projects/automation-system/src",
      parentId: automationDir.id,
      fileCount: 3,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.directories.set(srcDir.id, srcDir);

    // Create sample files
    const files = [
      {
        id: this.currentId++,
        name: "HMI.component.jsx",
        path: "/projects/automation-system/src/HMI.component.jsx",
        directoryId: srcDir.id,
        size: 2400,
        type: "JavaScript",
        status: "sync",
        checksum: "a4d2c5f9...",
        lastModified: new Date("2024-01-15T14:23:45"),
        createdAt: new Date(),
      },
      {
        id: this.currentId++,
        name: "PLC.controller.js",
        path: "/projects/automation-system/src/PLC.controller.js",
        directoryId: srcDir.id,
        size: 5800,
        type: "JavaScript",
        status: "conflict",
        checksum: "b7e3f2a1...",
        lastModified: new Date("2024-01-15T14:21:12"),
        createdAt: new Date(),
      },
      {
        id: this.currentId++,
        name: "SCADA.service.js",
        path: "/projects/automation-system/src/SCADA.service.js",
        directoryId: srcDir.id,
        size: 12100,
        type: "JavaScript",
        status: "sync",
        checksum: "c9f4d6b2...",
        lastModified: new Date("2024-01-15T14:19:33"),
        createdAt: new Date(),
      },
      {
        id: this.currentId++,
        name: "package.json",
        path: "/projects/automation-system/package.json",
        directoryId: automationDir.id,
        size: 1200,
        type: "JSON",
        status: "sync",
        checksum: "d8e5f7c3...",
        lastModified: new Date("2024-01-15T13:45:21"),
        createdAt: new Date(),
      },
    ];

    files.forEach(file => this.files.set(file.id, file));

    // Create sample alarms
    const alarms = [
      {
        id: this.currentId++,
        type: "FILE_CONFLICT",
        message: "FILE CONFLICT",
        location: "PLC.controller.js",
        severity: "error" as const,
        acknowledged: false,
        createdAt: new Date("2024-01-15T14:21:00"),
      },
      {
        id: this.currentId++,
        type: "HIGH_MEM_USAGE",
        message: "HIGH MEM USAGE",
        location: "System Resources",
        severity: "warning" as const,
        acknowledged: false,
        createdAt: new Date("2024-01-15T14:18:00"),
      },
      {
        id: this.currentId++,
        type: "SYNC_TIMEOUT",
        message: "SYNC TIMEOUT",
        location: "shared/utilities/",
        severity: "warning" as const,
        acknowledged: false,
        createdAt: new Date("2024-01-15T14:15:00"),
      },
    ];

    alarms.forEach(alarm => this.systemAlarms.set(alarm.id, alarm));

    // Create initial metrics
    const metrics: SystemMetrics = {
      id: this.currentId++,
      cpuUsage: 23,
      memoryUsage: 67,
      diskIO: 41,
      throughput: 1200, // KB/s
      operationsPerMin: 847,
      errorRate: 30, // 0.3% * 100
      timestamp: new Date(),
    };
    this.systemMetrics.set(metrics.id, metrics);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Directory operations
  async getAllDirectories(): Promise<Directory[]> {
    return Array.from(this.directories.values());
  }

  async getDirectory(id: number): Promise<Directory | undefined> {
    return this.directories.get(id);
  }

  async getDirectoryByPath(path: string): Promise<Directory | undefined> {
    return Array.from(this.directories.values()).find(dir => dir.path === path);
  }

  async createDirectory(insertDirectory: InsertDirectory): Promise<Directory> {
    const id = this.currentId++;
    const directory: Directory = {
      ...insertDirectory,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.directories.set(id, directory);
    return directory;
  }

  async updateDirectory(id: number, updates: Partial<InsertDirectory>): Promise<Directory | undefined> {
    const directory = this.directories.get(id);
    if (!directory) return undefined;
    
    const updated: Directory = {
      ...directory,
      ...updates,
      updatedAt: new Date(),
    };
    this.directories.set(id, updated);
    return updated;
  }

  async deleteDirectory(id: number): Promise<boolean> {
    return this.directories.delete(id);
  }

  // File operations
  async getFilesByDirectory(directoryId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(file => file.directoryId === directoryId);
  }

  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getFileByPath(path: string): Promise<File | undefined> {
    return Array.from(this.files.values()).find(file => file.path === path);
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.currentId++;
    const file: File = { ...insertFile, id, createdAt: new Date() };
    this.files.set(id, file);
    return file;
  }

  async updateFile(id: number, updates: Partial<InsertFile>): Promise<File | undefined> {
    const file = this.files.get(id);
    if (!file) return undefined;
    
    const updated: File = { ...file, ...updates };
    this.files.set(id, updated);
    return updated;
  }

  async deleteFile(id: number): Promise<boolean> {
    return this.files.delete(id);
  }

  // File operation queue
  async getAllFileOperations(): Promise<FileOperation[]> {
    return Array.from(this.fileOperations.values());
  }

  async getPendingFileOperations(): Promise<FileOperation[]> {
    return Array.from(this.fileOperations.values()).filter(op => op.status === "pending");
  }

  async createFileOperation(insertOperation: InsertFileOperation): Promise<FileOperation> {
    const id = this.currentId++;
    const operation: FileOperation = {
      ...insertOperation,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.fileOperations.set(id, operation);
    return operation;
  }

  async updateFileOperation(id: number, updates: Partial<InsertFileOperation>): Promise<FileOperation | undefined> {
    const operation = this.fileOperations.get(id);
    if (!operation) return undefined;
    
    const updated: FileOperation = {
      ...operation,
      ...updates,
      updatedAt: new Date(),
    };
    this.fileOperations.set(id, updated);
    return updated;
  }

  // System alarms
  async getAllAlarms(): Promise<SystemAlarm[]> {
    return Array.from(this.systemAlarms.values());
  }

  async getActiveAlarms(): Promise<SystemAlarm[]> {
    return Array.from(this.systemAlarms.values()).filter(alarm => !alarm.acknowledged);
  }

  async createAlarm(insertAlarm: InsertSystemAlarm): Promise<SystemAlarm> {
    const id = this.currentId++;
    const alarm: SystemAlarm = { ...insertAlarm, id, createdAt: new Date() };
    this.systemAlarms.set(id, alarm);
    return alarm;
  }

  async acknowledgeAlarm(id: number): Promise<SystemAlarm | undefined> {
    const alarm = this.systemAlarms.get(id);
    if (!alarm) return undefined;
    
    const updated: SystemAlarm = { ...alarm, acknowledged: true };
    this.systemAlarms.set(id, updated);
    return updated;
  }

  // System metrics
  async getLatestMetrics(): Promise<SystemMetrics | undefined> {
    const metrics = Array.from(this.systemMetrics.values());
    return metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  }

  async createMetrics(insertMetrics: InsertSystemMetrics): Promise<SystemMetrics> {
    const id = this.currentId++;
    const metrics: SystemMetrics = { ...insertMetrics, id, timestamp: new Date() };
    this.systemMetrics.set(id, metrics);
    return metrics;
  }

  async getMetricsHistory(limit: number = 10): Promise<SystemMetrics[]> {
    const metrics = Array.from(this.systemMetrics.values());
    return metrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
