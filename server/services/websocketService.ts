import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from '../storage';

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupWebSocket();
    this.startPeriodicUpdates();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('Client connected to WebSocket');
      this.clients.add(ws);

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message);
          await this.handleMessage(ws, data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected from WebSocket');
        this.clients.delete(ws);
      });

      // Send initial data
      this.sendInitialData(ws);
    });
  }

  private async handleMessage(ws: WebSocket, data: any) {
    switch (data.type) {
      case 'GET_UNS_NODES':
        const nodes = await storage.getAllNodes();
        this.sendToClient(ws, { type: 'UNS_NODES_UPDATE', data: nodes });
        break;
      
      case 'GET_UNS_TAGS':
        const { nodeId } = data;
        const tags = nodeId ? await storage.getTagsByNode(nodeId) : await storage.getAllTags();
        this.sendToClient(ws, { type: 'UNS_TAGS_UPDATE', data: tags });
        break;
      
      case 'UPDATE_TAG_VALUE':
        const { tagPath, value, quality } = data;
        const updatedTag = await storage.updateTagValue(tagPath, value, quality);
        if (updatedTag) {
          this.broadcast({ type: 'TAG_VALUE_UPDATED', data: updatedTag });
        }
        break;
      
      case 'ACKNOWLEDGE_ALARM':
        const alarm = await storage.acknowledgeAlarm(data.alarmPath);
        if (alarm) {
          this.broadcast({ type: 'ALARM_ACKNOWLEDGED', data: alarm });
        }
        break;
      
      case 'GET_PERSPECTIVE_VIEWS':
        const views = await storage.getAllViews();
        this.sendToClient(ws, { type: 'PERSPECTIVE_VIEWS_UPDATE', data: views });
        break;
      
      // Legacy compatibility
      case 'GET_DIRECTORIES':
        const directories = await this.getLegacyDirectories();
        this.sendToClient(ws, { type: 'DIRECTORIES_UPDATE', data: directories });
        break;
    }
  }

  private async getLegacyDirectories() {
    const nodes = await storage.getAllNodes();
    return nodes.map(node => ({
      id: node.id,
      name: node.name,
      path: node.nodeId,
      parentId: node.parentNodeId ? nodes.find(n => n.nodeId === node.parentNodeId)?.id || null : null,
      fileCount: 0,
      status: "active",
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
    }));
  }

  private async sendInitialData(ws: WebSocket) {
    try {
      const [nodes, tags, alarms, views] = await Promise.all([
        storage.getAllNodes(),
        storage.getAllTags(),
        storage.getActiveAlarms(),
        storage.getAllViews(),
      ]);

      // Get metrics from system tags
      const systemTags = await storage.getTagsByNode("Enterprise/Site1/FileSystemArea/PLC1");
      const cpuTag = systemTags.find(tag => tag.tagName === "CpuUsage");
      const memoryTag = systemTags.find(tag => tag.tagName === "MemoryUsage");
      const diskTag = systemTags.find(tag => tag.tagName === "DiskIO");
      const throughputTag = systemTags.find(tag => tag.tagName === "Throughput");

      const metrics = {
        id: 1,
        cpuUsage: cpuTag ? parseFloat(cpuTag.value || "0") : 0,
        memoryUsage: memoryTag ? parseFloat(memoryTag.value || "0") : 0,
        diskIO: diskTag ? parseFloat(diskTag.value || "0") : 0,
        throughput: throughputTag ? parseInt(throughputTag.value || "0") : 0,
        operationsPerMin: 847,
        errorRate: 30,
        timestamp: new Date(),
      };

      // Legacy compatibility
      const directories = await this.getLegacyDirectories();
      const operations = [
        {
          id: 1,
          type: "SYNC_CHANGES",
          target: "Enterprise/Site1/FileSystemArea/PLC1",
          status: "running",
          progress: 75,
        },
        {
          id: 2,
          type: "BACKUP_DIR", 
          target: "Enterprise/Site1/FileSystemArea/PLC1/FileSystem",
          status: "pending",
          progress: 0,
        }
      ];

      this.sendToClient(ws, {
        type: 'INITIAL_DATA',
        data: {
          // UNS data
          unsNodes: nodes,
          unsTags: tags,
          perspectiveViews: views,
          
          // Legacy data for compatibility
          directories,
          alarms,
          metrics,
          operations,
        },
      });
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  private sendToClient(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private broadcast(message: any) {
    this.clients.forEach(client => {
      this.sendToClient(client, message);
    });
  }

  private startPeriodicUpdates() {
    // Update system metrics via UNS tags every 2 seconds
    setInterval(async () => {
      try {
        const systemTags = await storage.getTagsByNode("Enterprise/Site1/FileSystemArea/PLC1");
        
        const cpuTag = systemTags.find(tag => tag.tagName === "CpuUsage");
        const memoryTag = systemTags.find(tag => tag.tagName === "MemoryUsage");
        const diskTag = systemTags.find(tag => tag.tagName === "DiskIO");
        const throughputTag = systemTags.find(tag => tag.tagName === "Throughput");

        if (cpuTag) {
          const currentValue = parseFloat(cpuTag.value || "25");
          const newValue = Math.max(15, Math.min(85, currentValue + (Math.random() - 0.5) * 5));
          await storage.updateTagValue(cpuTag.tagPath, newValue.toFixed(1));
        }

        if (memoryTag) {
          const currentValue = parseFloat(memoryTag.value || "67");
          const newValue = Math.max(40, Math.min(90, currentValue + (Math.random() - 0.5) * 3));
          await storage.updateTagValue(memoryTag.tagPath, newValue.toFixed(1));
        }

        if (diskTag) {
          const currentValue = parseFloat(diskTag.value || "42");
          const newValue = Math.max(10, Math.min(95, currentValue + (Math.random() - 0.5) * 8));
          await storage.updateTagValue(diskTag.tagPath, newValue.toFixed(1));
        }

        if (throughputTag) {
          const currentValue = parseInt(throughputTag.value || "1200");
          const newValue = Math.max(500, Math.min(2500, currentValue + (Math.random() - 0.5) * 200));
          await storage.updateTagValue(throughputTag.tagPath, Math.floor(newValue).toString());
        }

        // Broadcast updated metrics in legacy format
        const metrics = {
          id: 1,
          cpuUsage: cpuTag ? parseFloat(cpuTag.value || "0") : 0,
          memoryUsage: memoryTag ? parseFloat(memoryTag.value || "0") : 0,
          diskIO: diskTag ? parseFloat(diskTag.value || "0") : 0,
          throughput: throughputTag ? parseInt(throughputTag.value || "0") : 0,
          operationsPerMin: 847,
          errorRate: 30,
          timestamp: new Date(),
        };

        this.broadcast({ type: 'METRICS_UPDATE', data: metrics });
        this.broadcast({ type: 'UNS_TAGS_UPDATE', data: systemTags });
      } catch (error) {
        console.error('Error updating system metrics:', error);
      }
    }, 2000);

    // Simulate mock operations for compatibility
    setInterval(() => {
      const operations = [
        "COPY_FILE", "VALIDATE_PERM", "BACKUP_DIR", "SYNC_CHANGES"
      ];
      const randomOp = operations[Math.floor(Math.random() * operations.length)];
      
      console.log('New operation queued:', randomOp);
      
      this.broadcast({ 
        type: 'OPERATION_CREATED', 
        data: {
          id: Date.now(),
          type: randomOp,
          target: "Enterprise/Site1/FileSystemArea/PLC1",
          status: "pending",
          progress: 0,
        }
      });
    }, 5000);
  }
}
