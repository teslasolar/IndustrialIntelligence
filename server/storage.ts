import { 
  users,
  type User, type InsertUser,
  type UnsNode, type InsertUnsNode,
  type UnsTag, type InsertUnsTag,
  type PerspectiveView, type InsertPerspectiveView,
  type TagGroup, type InsertTagGroup,
  type TagHistory, type InsertTagHistory,
  type TagAlarm, type InsertTagAlarm,
  type SystemConfig, type InsertSystemConfig
} from "@shared/schema";

import { UnsTagService } from "./services/unsTagService";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // UNS Node operations
  getAllNodes(): Promise<UnsNode[]>;
  getNode(nodeId: string): Promise<UnsNode | undefined>;
  getChildNodes(parentNodeId: string): Promise<UnsNode[]>;
  createNode(node: InsertUnsNode): Promise<UnsNode>;

  // UNS Tag operations
  getAllTags(): Promise<UnsTag[]>;
  getTag(tagPath: string): Promise<UnsTag | undefined>;
  getTagsByNode(nodeId: string): Promise<UnsTag[]>;
  updateTagValue(tagPath: string, value: string, quality?: string): Promise<UnsTag | undefined>;
  createTag(tag: InsertUnsTag): Promise<UnsTag>;

  // Tag History operations
  getTagHistory(tagPath: string, limit?: number): Promise<TagHistory[]>;
  addTagHistory(history: InsertTagHistory): Promise<TagHistory>;

  // Alarm operations
  getAllAlarms(): Promise<TagAlarm[]>;
  getActiveAlarms(): Promise<TagAlarm[]>;
  getAlarm(alarmPath: string): Promise<TagAlarm | undefined>;
  acknowledgeAlarm(alarmPath: string): Promise<TagAlarm | undefined>;
  createAlarm(alarm: InsertTagAlarm): Promise<TagAlarm>;

  // Perspective View operations
  getAllViews(): Promise<PerspectiveView[]>;
  getView(viewPath: string): Promise<PerspectiveView | undefined>;
  getViewsByParent(parentPath: string): Promise<PerspectiveView[]>;
  createView(view: InsertPerspectiveView): Promise<PerspectiveView>;

  // System Configuration operations
  getConfig(configPath: string): Promise<SystemConfig | undefined>;
  getAllConfigs(): Promise<SystemConfig[]>;
  setConfig(config: InsertSystemConfig): Promise<SystemConfig>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private unsTagService: UnsTagService;
  private configs: Map<string, SystemConfig>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.configs = new Map();
    this.currentId = 1;
    this.unsTagService = new UnsTagService();
    this.initializeDefaultData();
    
    // Start real-time tag simulation
    this.unsTagService.simulateTagUpdates();
  }

  private initializeDefaultData() {
    // Initialize system configurations
    const defaultConfigs = [
      {
        configPath: "System/Gateway/Name",
        configValue: "FileSystem_Gateway",
        dataType: "String",
        description: "Gateway name",
        isReadOnly: true
      },
      {
        configPath: "System/Gateway/Version",
        configValue: "8.1.25",
        dataType: "String",
        description: "Gateway version",
        isReadOnly: true
      },
      {
        configPath: "System/Perspective/SessionTimeout",
        configValue: "3600",
        dataType: "Int32",
        description: "Session timeout in seconds",
        isReadOnly: false
      },
      {
        configPath: "System/Alarms/MaxActiveAlarms",
        configValue: "1000",
        dataType: "Int32",
        description: "Maximum number of active alarms",
        isReadOnly: false
      }
    ];

    defaultConfigs.forEach(config => {
      const systemConfig: SystemConfig = {
        id: this.currentId++,
        ...config,
        updatedAt: new Date(),
      };
      this.configs.set(config.configPath, systemConfig);
    });
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

  // UNS Node operations
  async getAllNodes(): Promise<UnsNode[]> {
    return this.unsTagService.getAllNodes();
  }

  async getNode(nodeId: string): Promise<UnsNode | undefined> {
    return this.unsTagService.getNode(nodeId);
  }

  async getChildNodes(parentNodeId: string): Promise<UnsNode[]> {
    return this.unsTagService.getChildNodes(parentNodeId);
  }

  async createNode(node: InsertUnsNode): Promise<UnsNode> {
    return this.unsTagService.createNode(node);
  }

  // UNS Tag operations
  async getAllTags(): Promise<UnsTag[]> {
    return this.unsTagService.getAllTags();
  }

  async getTag(tagPath: string): Promise<UnsTag | undefined> {
    return this.unsTagService.getTag(tagPath);
  }

  async getTagsByNode(nodeId: string): Promise<UnsTag[]> {
    return this.unsTagService.getTagsByNode(nodeId);
  }

  async updateTagValue(tagPath: string, value: string, quality = "Good"): Promise<UnsTag | undefined> {
    return this.unsTagService.updateTagValue(tagPath, value, quality);
  }

  async createTag(tag: InsertUnsTag): Promise<UnsTag> {
    return this.unsTagService.createTag(tag);
  }

  // Tag History operations (simplified for now)
  async getTagHistory(tagPath: string, limit = 100): Promise<TagHistory[]> {
    // In a real implementation, this would query historical data
    return [];
  }

  async addTagHistory(history: InsertTagHistory): Promise<TagHistory> {
    const tagHistory: TagHistory = {
      id: this.currentId++,
      ...history,
    };
    return tagHistory;
  }

  // Alarm operations
  async getAllAlarms(): Promise<TagAlarm[]> {
    return this.unsTagService.getAlarms();
  }

  async getActiveAlarms(): Promise<TagAlarm[]> {
    return this.unsTagService.getActiveAlarms();
  }

  async getAlarm(alarmPath: string): Promise<TagAlarm | undefined> {
    const alarms = await this.getAllAlarms();
    return alarms.find(alarm => alarm.alarmPath === alarmPath);
  }

  async acknowledgeAlarm(alarmPath: string): Promise<TagAlarm | undefined> {
    return this.unsTagService.acknowledgeAlarm(alarmPath);
  }

  async createAlarm(alarm: InsertTagAlarm): Promise<TagAlarm> {
    const tagAlarm: TagAlarm = {
      id: this.currentId++,
      ...alarm,
      activeTime: null,
      ackTime: null,
      clearedTime: null,
    };
    return tagAlarm;
  }

  // Perspective View operations
  async getAllViews(): Promise<PerspectiveView[]> {
    return this.unsTagService.getAllViews();
  }

  async getView(viewPath: string): Promise<PerspectiveView | undefined> {
    return this.unsTagService.getView(viewPath);
  }

  async getViewsByParent(parentPath: string): Promise<PerspectiveView[]> {
    return this.unsTagService.getViewsByParent(parentPath);
  }

  async createView(view: InsertPerspectiveView): Promise<PerspectiveView> {
    const perspectiveView: PerspectiveView = {
      id: this.currentId++,
      ...view,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return perspectiveView;
  }

  // System Configuration operations
  async getConfig(configPath: string): Promise<SystemConfig | undefined> {
    return this.configs.get(configPath);
  }

  async getAllConfigs(): Promise<SystemConfig[]> {
    return Array.from(this.configs.values());
  }

  async setConfig(config: InsertSystemConfig): Promise<SystemConfig> {
    const existing = this.configs.get(config.configPath);
    if (existing && existing.isReadOnly) {
      throw new Error(`Configuration ${config.configPath} is read-only`);
    }

    const systemConfig: SystemConfig = {
      id: existing?.id || this.currentId++,
      ...config,
      updatedAt: new Date(),
    };
    
    this.configs.set(config.configPath, systemConfig);
    return systemConfig;
  }
}

export const storage = new MemStorage();