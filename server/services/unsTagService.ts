import { UnsNode, UnsTag, TagAlarm, PerspectiveView, InsertUnsNode, InsertUnsTag, InsertTagAlarm } from '@shared/schema';
import { RepositoryScanner, DirectoryStats } from './repositoryScanner';
import { PLCDeploymentService } from './plcDeploymentService';
import { mqttService, PLCTelemetry } from './mqttService';

export class UnsTagService {
  private nodes: Map<string, UnsNode> = new Map();
  private tags: Map<string, UnsTag> = new Map();
  private alarms: Map<string, TagAlarm> = new Map();
  private views: Map<string, PerspectiveView> = new Map();
  private repositoryScanner: RepositoryScanner = new RepositoryScanner();
  private plcDeployment: PLCDeploymentService = new PLCDeploymentService();
  private currentId = 1;

  constructor() {
    this.initializeUnsStructure();
    this.deployPhysicalPLCs();
    this.startRepositoryMonitoring();
  }

  private async deployPhysicalPLCs() {
    // Deploy actual PLC directories and control files to each repository location
    await this.plcDeployment.deployAllPLCs();
  }

  private initializeUnsStructure() {
    // Create UNS node hierarchy for file system
    const enterpriseNode: UnsNode = {
      id: this.currentId++,
      nodeId: "Enterprise",
      parentNodeId: null,
      name: "Enterprise",
      nodeType: "Enterprise",
      description: "Root enterprise node",
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.nodes.set(enterpriseNode.nodeId, enterpriseNode);

    const siteNode: UnsNode = {
      id: this.currentId++,
      nodeId: "Enterprise/Site1",
      parentNodeId: "Enterprise",
      name: "Site1",
      nodeType: "Site",
      description: "Primary site for file operations",
      metadata: { location: "Primary Data Center" },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.nodes.set(siteNode.nodeId, siteNode);

    // Repository directory areas with dedicated PLCs
    const repoAreas = [
      { name: "Client", path: "client", description: "Frontend application area" },
      { name: "Server", path: "server", description: "Backend services area" },
      { name: "Shared", path: "shared", description: "Common schemas and types" },
      { name: "Components", path: "client/src/components", description: "UI components library" },
      { name: "Services", path: "server/services", description: "Backend service modules" },
      { name: "Types", path: "client/src/types", description: "TypeScript definitions" },
      { name: "Hooks", path: "client/src/hooks", description: "React custom hooks" },
      { name: "Pages", path: "client/src/pages", description: "Application pages" },
      { name: "Assets", path: "attached_assets", description: "Static assets and resources" },
      { name: "Workspace", path: "workspace", description: "Working directory" }
    ];

    repoAreas.forEach((area, index) => {
      // Create area node
      const areaNode: UnsNode = {
        id: this.currentId++,
        nodeId: `Enterprise/Site1/${area.name}Area`,
        parentNodeId: "Enterprise/Site1",
        name: `${area.name}Area`,
        nodeType: "Area",
        description: area.description,
        metadata: { 
          repositoryPath: area.path,
          monitoring: true,
          lastScan: new Date().toISOString()
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.nodes.set(areaNode.nodeId, areaNode);

      // Create dedicated PLC for each area
      const plcNode: UnsNode = {
        id: this.currentId++,
        nodeId: `Enterprise/Site1/${area.name}Area/PLC${index + 1}`,
        parentNodeId: `Enterprise/Site1/${area.name}Area`,
        name: `PLC${index + 1}`,
        nodeType: "Device",
        description: `${area.name} directory controller`,
        metadata: { 
          type: "Ignition PLC",
          model: "CompactLogix 5370",
          firmware: "v32.011",
          controlsPath: area.path,
          scanRate: "100ms",
          status: "Running"
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.nodes.set(plcNode.nodeId, plcNode);
    });

    // Initialize UNS tags
    this.initializeSystemTags();
    this.initializeFileSystemTags();
    this.initializeAlarmTags();
    this.initializePerspectiveViews();
  }

  private initializeSystemTags() {
    // Create system tags for each distributed PLC
    const repoAreas = [
      { name: "Client", path: "client" },
      { name: "Server", path: "server" },
      { name: "Shared", path: "shared" },
      { name: "Components", path: "client/src/components" },
      { name: "Services", path: "server/services" },
      { name: "Types", path: "client/src/types" },
      { name: "Hooks", path: "client/src/hooks" },
      { name: "Pages", path: "client/src/pages" },
      { name: "Assets", path: "attached_assets" },
      { name: "Workspace", path: "workspace" }
    ];

    repoAreas.forEach((area, index) => {
      const plcNodeId = `Enterprise/Site1/${area.name}Area/PLC${index + 1}`;
      
      const systemTags = [
        {
          tagPath: `${plcNodeId}/System/Status`,
          nodeId: plcNodeId,
          tagName: "Status",
          dataType: "String",
          value: "Running",
          quality: "Good",
          historize: true,
          metadata: { description: `${area.name} PLC operational status`, controlsPath: area.path }
        },
      {
        tagPath: "Enterprise/Site1/FileSystemArea/PLC1/System/CpuUsage",
        nodeId: "Enterprise/Site1/FileSystemArea/PLC1",
        tagName: "CpuUsage",
        dataType: "Float32",
        value: "25.3",
        quality: "Good",
        historize: true,
        metadata: { units: "%" }
      },
      {
        tagPath: "Enterprise/Site1/FileSystemArea/PLC1/System/MemoryUsage",
        nodeId: "Enterprise/Site1/FileSystemArea/PLC1",
        tagName: "MemoryUsage",
        dataType: "Float32",
        value: "67.8",
        quality: "Good",
        historize: true,
        metadata: { units: "%" }
      },
      {
        tagPath: "Enterprise/Site1/FileSystemArea/PLC1/System/DiskIO",
        nodeId: "Enterprise/Site1/FileSystemArea/PLC1",
        tagName: "DiskIO",
        dataType: "Float32",
        value: "42.1",
        quality: "Good",
        historize: true,
        metadata: { units: "%" }
      },
      {
        tagPath: "Enterprise/Site1/FileSystemArea/PLC1/System/Throughput",
        nodeId: "Enterprise/Site1/FileSystemArea/PLC1",
        tagName: "Throughput",
        dataType: "Int32",
        value: "1200",
        quality: "Good",
        historize: true,
        metadata: { units: "KB/s" }
      }
    ];

      systemTags.forEach(tag => {
        const unsTag: UnsTag = {
          id: this.currentId++,
          ...tag,
          timestamp: new Date(),
        };
        this.tags.set(tag.tagPath, unsTag);
      });
    });
  }

  private initializeFileSystemTags() {
    const fileSystemTags = [
      {
        tagPath: "Enterprise/Site1/FileSystemArea/PLC1/FileSystem/DirectoryCount",
        nodeId: "Enterprise/Site1/FileSystemArea/PLC1",
        tagName: "DirectoryCount",
        dataType: "Int32",
        value: "4",
        quality: "Good",
        historize: false,
        metadata: { description: "Total number of directories" }
      },
      {
        tagPath: "Enterprise/Site1/FileSystemArea/PLC1/FileSystem/FileCount",
        nodeId: "Enterprise/Site1/FileSystemArea/PLC1",
        tagName: "FileCount",
        dataType: "Int32",
        value: "12",
        quality: "Good",
        historize: false,
        metadata: { description: "Total number of files" }
      },
      {
        tagPath: "Enterprise/Site1/FileSystemArea/PLC1/FileSystem/ConflictCount",
        nodeId: "Enterprise/Site1/FileSystemArea/PLC1",
        tagName: "ConflictCount",
        dataType: "Int32",
        value: "1",
        quality: "Good",
        historize: true,
        metadata: { description: "Number of files with conflicts" }
      },
      {
        tagPath: "Enterprise/Site1/FileSystemArea/PLC1/FileSystem/OperationQueue/Pending",
        nodeId: "Enterprise/Site1/FileSystemArea/PLC1",
        tagName: "PendingOperations",
        dataType: "Int32",
        value: "3",
        quality: "Good",
        historize: true,
        metadata: { description: "Number of pending operations" }
      },
      {
        tagPath: "Enterprise/Site1/FileSystemArea/PLC1/FileSystem/OperationQueue/Running",
        nodeId: "Enterprise/Site1/FileSystemArea/PLC1",
        tagName: "RunningOperations",
        dataType: "Int32",
        value: "1",
        quality: "Good",
        historize: true,
        metadata: { description: "Number of running operations" }
      }
    ];

    fileSystemTags.forEach(tag => {
      const unsTag: UnsTag = {
        id: this.currentId++,
        ...tag,
        timestamp: new Date(),
      };
      this.tags.set(tag.tagPath, unsTag);
    });
  }

  private initializeAlarmTags() {
    const alarms = [
      {
        alarmPath: "Enterprise/Site1/FileSystemArea/PLC1/Alarms/FileConflict",
        tagPath: "Enterprise/Site1/FileSystemArea/PLC1/FileSystem/ConflictCount",
        alarmType: "Digital",
        condition: JSON.stringify({ operator: ">", value: 0 }),
        priority: 700,
        isActive: true,
        isAcknowledged: false,
        message: "FILE CONFLICT DETECTED",
        activeTime: new Date(),
        metadata: { location: "PLC.controller.js" }
      },
      {
        alarmPath: "Enterprise/Site1/FileSystemArea/PLC1/Alarms/HighMemoryUsage",
        tagPath: "Enterprise/Site1/FileSystemArea/PLC1/System/MemoryUsage",
        alarmType: "AnalogHi",
        condition: JSON.stringify({ operator: ">", value: 80 }),
        priority: 500,
        isActive: false,
        isAcknowledged: false,
        message: "HIGH MEMORY USAGE",
        metadata: { threshold: "80%" }
      },
      {
        alarmPath: "Enterprise/Site1/FileSystemArea/PLC1/Alarms/SyncTimeout",
        tagPath: "Enterprise/Site1/FileSystemArea/PLC1/FileSystem/OperationQueue/Pending",
        alarmType: "AnalogHi",
        condition: JSON.stringify({ operator: ">", value: 5 }),
        priority: 400,
        isActive: false,
        isAcknowledged: false,
        message: "SYNC TIMEOUT",
        metadata: { location: "shared/utilities/" }
      }
    ];

    alarms.forEach(alarm => {
      const tagAlarm: TagAlarm = {
        id: this.currentId++,
        ...alarm,
        ackTime: null,
        clearedTime: null,
      };
      this.alarms.set(alarm.alarmPath, tagAlarm);
    });
  }

  private initializePerspectiveViews() {
    // HMI Directory Browser View
    const directoryBrowserView: PerspectiveView = {
      id: this.currentId++,
      viewPath: "FileSystem/HMI/DirectoryBrowser",
      viewName: "DirectoryBrowser",
      viewType: "Container",
      viewDefinition: {
        type: "ia.container.flex",
        version: 0,
        props: {
          direction: "column",
          justify: "flex-start",
          alignItems: "stretch",
          style: {
            backgroundColor: "#1a1a1a",
            color: "#ffffff"
          }
        },
        children: [
          {
            type: "ia.display.label",
            props: {
              text: "HMI - OPERATOR INTERFACE",
              style: {
                fontSize: "16px",
                fontWeight: "bold",
                color: "#3b82f6",
                fontFamily: "monospace"
              }
            }
          },
          {
            type: "ia.display.tree",
            props: {
              data: {
                binding: {
                  type: "tag",
                  config: {
                    path: "[default]Enterprise/Site1/FileSystemArea/PLC1/FileSystem/DirectoryTree"
                  }
                }
              },
              selection: {
                mode: "single"
              }
            }
          }
        ]
      },
      parentPath: "FileSystem/HMI",
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.views.set(directoryBrowserView.viewPath, directoryBrowserView);

    // PLC Controller View
    const plcControllerView: PerspectiveView = {
      id: this.currentId++,
      viewPath: "FileSystem/PLC/Controller",
      viewName: "PLCController",
      viewType: "Container",
      viewDefinition: {
        type: "ia.container.flex",
        version: 0,
        props: {
          direction: "column",
          style: {
            backgroundColor: "#1a1a1a"
          }
        },
        children: [
          {
            type: "ia.display.label",
            props: {
              text: "PLC - DIRECTORY CONTROLLER",
              style: {
                fontSize: "16px",
                fontWeight: "bold",
                color: "#3b82f6",
                fontFamily: "monospace"
              }
            }
          },
          {
            type: "ia.display.table",
            props: {
              data: {
                binding: {
                  type: "tag",
                  config: {
                    path: "[default]Enterprise/Site1/FileSystemArea/PLC1/FileSystem/FileList"
                  }
                }
              },
              columns: [
                { field: "name", header: "NAME" },
                { field: "status", header: "STATUS" },
                { field: "size", header: "SIZE" },
                { field: "modified", header: "MODIFIED" }
              ]
            }
          }
        ]
      },
      parentPath: "FileSystem/PLC",
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.views.set(plcControllerView.viewPath, plcControllerView);

    // SCADA Monitor View
    const scadaMonitorView: PerspectiveView = {
      id: this.currentId++,
      viewPath: "FileSystem/SCADA/Monitor",
      viewName: "SCADAMonitor",
      viewType: "Container",
      viewDefinition: {
        type: "ia.container.flex",
        version: 0,
        props: {
          direction: "column",
          style: {
            backgroundColor: "#1a1a1a",
            color: "#ffffff"
          }
        },
        children: [
          {
            type: "ia.display.label",
            props: {
              text: "SCADA - SYSTEM SUPERVISOR",
              style: {
                fontSize: "16px",
                fontWeight: "bold",
                color: "#3b82f6",
                fontFamily: "monospace"
              }
            }
          },
          {
            type: "ia.display.alarm-status-table",
            props: {
              data: {
                binding: {
                  type: "tag",
                  config: {
                    path: "[System]Gateway/AlarmNotification/ActiveAlarms"
                  }
                }
              }
            }
          },
          {
            type: "ia.chart.timeseries",
            props: {
              series: [
                {
                  name: "CPU Usage",
                  data: {
                    binding: {
                      type: "tag",
                      config: {
                        path: "[default]Enterprise/Site1/FileSystemArea/PLC1/System/CpuUsage"
                      }
                    }
                  }
                },
                {
                  name: "Memory Usage",
                  data: {
                    binding: {
                      type: "tag",
                      config: {
                        path: "[default]Enterprise/Site1/FileSystemArea/PLC1/System/MemoryUsage"
                      }
                    }
                  }
                }
              ]
            }
          }
        ]
      },
      parentPath: "FileSystem/SCADA",
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.views.set(scadaMonitorView.viewPath, scadaMonitorView);
  }

  // Tag operations
  async getTag(tagPath: string): Promise<UnsTag | undefined> {
    return this.tags.get(tagPath);
  }

  async getAllTags(): Promise<UnsTag[]> {
    return Array.from(this.tags.values());
  }

  async getTagsByNode(nodeId: string): Promise<UnsTag[]> {
    return Array.from(this.tags.values()).filter(tag => tag.nodeId === nodeId);
  }

  async updateTagValue(tagPath: string, value: string, quality = "Good"): Promise<UnsTag | undefined> {
    const tag = this.tags.get(tagPath);
    if (!tag) return undefined;

    const updatedTag: UnsTag = {
      ...tag,
      value,
      quality,
      timestamp: new Date(),
    };
    
    this.tags.set(tagPath, updatedTag);
    return updatedTag;
  }

  async createTag(tagData: InsertUnsTag): Promise<UnsTag> {
    const tag: UnsTag = {
      id: this.currentId++,
      ...tagData,
      timestamp: new Date(),
    };
    
    this.tags.set(tag.tagPath, tag);
    return tag;
  }

  // Node operations
  async getNode(nodeId: string): Promise<UnsNode | undefined> {
    return this.nodes.get(nodeId);
  }

  async getAllNodes(): Promise<UnsNode[]> {
    return Array.from(this.nodes.values());
  }

  async getChildNodes(parentNodeId: string): Promise<UnsNode[]> {
    return Array.from(this.nodes.values()).filter(node => node.parentNodeId === parentNodeId);
  }

  async createNode(nodeData: InsertUnsNode): Promise<UnsNode> {
    const node: UnsNode = {
      id: this.currentId++,
      ...nodeData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.nodes.set(node.nodeId, node);
    return node;
  }

  // Alarm operations
  async getAlarms(): Promise<TagAlarm[]> {
    return Array.from(this.alarms.values());
  }

  async getActiveAlarms(): Promise<TagAlarm[]> {
    return Array.from(this.alarms.values()).filter(alarm => alarm.isActive && !alarm.isAcknowledged);
  }

  async acknowledgeAlarm(alarmPath: string): Promise<TagAlarm | undefined> {
    const alarm = this.alarms.get(alarmPath);
    if (!alarm) return undefined;

    const updatedAlarm: TagAlarm = {
      ...alarm,
      isAcknowledged: true,
      ackTime: new Date(),
    };
    
    this.alarms.set(alarmPath, updatedAlarm);
    return updatedAlarm;
  }

  // Perspective View operations
  async getView(viewPath: string): Promise<PerspectiveView | undefined> {
    return this.views.get(viewPath);
  }

  async getAllViews(): Promise<PerspectiveView[]> {
    return Array.from(this.views.values());
  }

  async getViewsByParent(parentPath: string): Promise<PerspectiveView[]> {
    return Array.from(this.views.values()).filter(view => view.parentPath === parentPath);
  }

  // Simulate real-time tag updates
  simulateTagUpdates() {
    setInterval(() => {
      // Update system metrics
      const cpuTag = this.tags.get("Enterprise/Site1/FileSystemArea/PLC1/System/CpuUsage");
      if (cpuTag) {
        const currentValue = parseFloat(cpuTag.value || "25");
        const newValue = Math.max(15, Math.min(85, currentValue + (Math.random() - 0.5) * 5));
        this.updateTagValue(cpuTag.tagPath, newValue.toFixed(1));
      }

      const memoryTag = this.tags.get("Enterprise/Site1/FileSystemArea/PLC1/System/MemoryUsage");
      if (memoryTag) {
        const currentValue = parseFloat(memoryTag.value || "67");
        const newValue = Math.max(40, Math.min(90, currentValue + (Math.random() - 0.5) * 3));
        this.updateTagValue(memoryTag.tagPath, newValue.toFixed(1));
      }

      const diskTag = this.tags.get("Enterprise/Site1/FileSystemArea/PLC1/System/DiskIO");
      if (diskTag) {
        const currentValue = parseFloat(diskTag.value || "42");
        const newValue = Math.max(10, Math.min(95, currentValue + (Math.random() - 0.5) * 8));
        this.updateTagValue(diskTag.tagPath, newValue.toFixed(1));
      }

      const throughputTag = this.tags.get("Enterprise/Site1/FileSystemArea/PLC1/System/Throughput");
      if (throughputTag) {
        const currentValue = parseInt(throughputTag.value || "1200");
        const newValue = Math.max(500, Math.min(2500, currentValue + (Math.random() - 0.5) * 200));
        this.updateTagValue(throughputTag.tagPath, Math.floor(newValue).toString());
      }
    }, 2000);
  }

  private async startRepositoryMonitoring() {
    // Update PLCs with real repository data every 5 seconds
    setInterval(async () => {
      try {
        const repoStats = await this.repositoryScanner.scanAllRepositoryAreas();
        this.updatePLCsWithRealData(repoStats);
      } catch (error) {
        console.error('Error updating PLC data with repository stats:', error);
      }
    }, 5000);
  }

  private updatePLCsWithRealData(repoStats: DirectoryStats[]) {
    const repoAreas = [
      { name: "Client", path: "client" },
      { name: "Server", path: "server" },
      { name: "Shared", path: "shared" },
      { name: "Components", path: "client/src/components" },
      { name: "Services", path: "server/services" },
      { name: "Types", path: "client/src/types" },
      { name: "Hooks", path: "client/src/hooks" },
      { name: "Pages", path: "client/src/pages" },
      { name: "Assets", path: "attached_assets" },
      { name: "Workspace", path: "workspace" }
    ];

    repoAreas.forEach((area, index) => {
      const plcNodeId = `Enterprise/Site1/${area.name}Area/PLC${index + 1}`;
      const stats = repoStats.find(s => s.path === area.path);
      
      if (stats) {
        // Update file count
        const fileCountTag = this.tags.get(`${plcNodeId}/System/FileCount`);
        if (fileCountTag) {
          this.updateTagValue(fileCountTag.tagPath, stats.fileCount.toString());
        }

        // Update directory size (convert bytes to MB)
        const sizeTag = this.tags.get(`${plcNodeId}/System/DirectorySize`);
        if (sizeTag) {
          const sizeInMB = (stats.totalSize / (1024 * 1024)).toFixed(1);
          this.updateTagValue(sizeTag.tagPath, sizeInMB);
        }

        // Update last modified time
        const modifiedTag = this.tags.get(`${plcNodeId}/System/LastModified`);
        if (modifiedTag) {
          this.updateTagValue(modifiedTag.tagPath, stats.lastModified.toISOString());
        }

        // Calculate processing load based on file count and size
        const loadTag = this.tags.get(`${plcNodeId}/System/ProcessingLoad`);
        if (loadTag) {
          const load = Math.min(95, Math.max(5, (stats.fileCount * 0.5) + (stats.totalSize / (1024 * 1024)) * 0.1));
          this.updateTagValue(loadTag.tagPath, load.toFixed(1));
        }

        // Update status based on recent activity
        const statusTag = this.tags.get(`${plcNodeId}/System/Status`);
        if (statusTag) {
          const isRecent = (Date.now() - stats.lastModified.getTime()) < 300000; // 5 minutes
          const status = isRecent ? "Active" : "Running";
          this.updateTagValue(statusTag.tagPath, status);
          
          // Update physical PLC configuration file
          this.plcDeployment.updatePLCStatus(area.path, {
            fileCount: stats.fileCount,
            directorySize: (stats.totalSize / (1024 * 1024)).toFixed(1),
            lastModified: stats.lastModified.toISOString(),
            processingLoad: Math.min(95, Math.max(5, (stats.fileCount * 0.5) + (stats.totalSize / (1024 * 1024)) * 0.1)).toFixed(1),
            status: status
          });
        }
      }
    });
  }
}