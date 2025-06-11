import type { Express } from "express";
import { createServer, type Server } from "http";
import * as path from "path";
import * as fs from "fs";
import { storage } from "./storage";
import { WebSocketService } from "./services/websocketService";
import { 
  insertUnsNodeSchema, 
  insertUnsTagSchema, 
  insertTagAlarmSchema,
  insertPerspectiveViewSchema,
  insertSystemConfigSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // UNS Node routes
  app.get("/api/uns/nodes", async (req, res) => {
    try {
      const nodes = await storage.getAllNodes();
      res.json(nodes);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch UNS nodes", error: error.message });
    }
  });

  app.get("/api/uns/nodes/:nodeId", async (req, res) => {
    try {
      const nodeId = decodeURIComponent(req.params.nodeId);
      const node = await storage.getNode(nodeId);
      if (!node) {
        return res.status(404).json({ message: "Node not found" });
      }
      res.json(node);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch node", error: error.message });
    }
  });

  app.get("/api/uns/nodes/:nodeId/children", async (req, res) => {
    try {
      const nodeId = decodeURIComponent(req.params.nodeId);
      const children = await storage.getChildNodes(nodeId);
      res.json(children);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch child nodes", error: error.message });
    }
  });

  app.post("/api/uns/nodes", async (req, res) => {
    try {
      const nodeData = insertUnsNodeSchema.parse(req.body);
      const node = await storage.createNode(nodeData);
      res.status(201).json(node);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create node", error: error.message });
    }
  });

  // UNS Tag routes
  app.get("/api/uns/tags", async (req, res) => {
    try {
      const { nodeId } = req.query;
      let tags;
      if (nodeId) {
        tags = await storage.getTagsByNode(nodeId as string);
      } else {
        tags = await storage.getAllTags();
      }
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch tags", error: error.message });
    }
  });

  app.get("/api/uns/tags/:tagPath", async (req, res) => {
    try {
      const tagPath = decodeURIComponent(req.params.tagPath);
      const tag = await storage.getTag(tagPath);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      res.json(tag);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch tag", error: error.message });
    }
  });

  app.post("/api/uns/tags", async (req, res) => {
    try {
      const tagData = insertUnsTagSchema.parse(req.body);
      const tag = await storage.createTag(tagData);
      res.status(201).json(tag);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create tag", error: error.message });
    }
  });

  app.put("/api/uns/tags/:tagPath/value", async (req, res) => {
    try {
      const tagPath = decodeURIComponent(req.params.tagPath);
      const { value, quality = "Good" } = req.body;
      const updatedTag = await storage.updateTagValue(tagPath, value, quality);
      if (!updatedTag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      res.json(updatedTag);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update tag value", error: error.message });
    }
  });

  // Tag History routes
  app.get("/api/uns/tags/:tagPath/history", async (req, res) => {
    try {
      const tagPath = decodeURIComponent(req.params.tagPath);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const history = await storage.getTagHistory(tagPath, limit);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch tag history", error: error.message });
    }
  });

  // Alarm routes
  app.get("/api/alarms", async (req, res) => {
    try {
      const active = req.query.active === 'true';
      const alarms = active ? await storage.getActiveAlarms() : await storage.getAllAlarms();
      res.json(alarms);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch alarms", error: error.message });
    }
  });

  app.post("/api/alarms", async (req, res) => {
    try {
      const alarmData = insertTagAlarmSchema.parse(req.body);
      const alarm = await storage.createAlarm(alarmData);
      res.status(201).json(alarm);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create alarm", error: error.message });
    }
  });

  app.put("/api/alarms/:alarmPath/acknowledge", async (req, res) => {
    try {
      const alarmPath = decodeURIComponent(req.params.alarmPath);
      const alarm = await storage.acknowledgeAlarm(alarmPath);
      if (!alarm) {
        return res.status(404).json({ message: "Alarm not found" });
      }
      res.json(alarm);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to acknowledge alarm", error: error.message });
    }
  });

  // Perspective View routes
  app.get("/api/perspective/views", async (req, res) => {
    try {
      const { parentPath } = req.query;
      let views;
      if (parentPath) {
        views = await storage.getViewsByParent(parentPath as string);
      } else {
        views = await storage.getAllViews();
      }
      res.json(views);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch views", error: error.message });
    }
  });

  app.get("/api/perspective/views/:viewPath", async (req, res) => {
    try {
      const viewPath = decodeURIComponent(req.params.viewPath);
      const view = await storage.getView(viewPath);
      if (!view) {
        return res.status(404).json({ message: "View not found" });
      }
      res.json(view);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch view", error: error.message });
    }
  });

  app.post("/api/perspective/views", async (req, res) => {
    try {
      const viewData = insertPerspectiveViewSchema.parse(req.body);
      const view = await storage.createView(viewData);
      res.status(201).json(view);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create view", error: error.message });
    }
  });

  // System Configuration routes
  app.get("/api/system/config", async (req, res) => {
    try {
      const { configPath } = req.query;
      if (configPath) {
        const config = await storage.getConfig(configPath as string);
        if (!config) {
          return res.status(404).json({ message: "Configuration not found" });
        }
        res.json(config);
      } else {
        const configs = await storage.getAllConfigs();
        res.json(configs);
      }
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch configuration", error: error.message });
    }
  });

  app.put("/api/system/config", async (req, res) => {
    try {
      const configData = insertSystemConfigSchema.parse(req.body);
      const config = await storage.setConfig(configData);
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to set configuration", error: error.message });
    }
  });

  // Legacy compatibility routes for the frontend
  app.get("/api/directories", async (req, res) => {
    try {
      const nodes = await storage.getAllNodes();
      // Transform UNS nodes to legacy directory format
      const directories = nodes.map(node => ({
        id: node.id,
        name: node.name,
        path: node.nodeId,
        parentId: node.parentNodeId ? nodes.find(n => n.nodeId === node.parentNodeId)?.id || null : null,
        fileCount: 0,
        status: "active",
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
      }));
      res.json(directories);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch directories", error: error.message });
    }
  });

  app.get("/api/operations", async (req, res) => {
    try {
      // Return mock operations for compatibility
      const operations = [
        {
          id: 1,
          type: "SYNC_CHANGES",
          target: "Enterprise/Site1/FileSystemArea/PLC1",
          status: "running",
          progress: 75,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          type: "BACKUP_DIR",
          target: "Enterprise/Site1/FileSystemArea/PLC1/FileSystem",
          status: "pending",
          progress: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
      res.json(operations);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch operations", error: error.message });
    }
  });

  app.get("/api/metrics", async (req, res) => {
    try {
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
      
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch metrics", error: error.message });
    }
  });

  // HMI PLC Configuration Route - Must come before general HMI route
  app.get('/hmi/:area(*)/plc-config.json', async (req, res) => {
    try {
      const areaPath = req.params.area;
      const plcPath = path.join(process.cwd(), areaPath, '.plc', 'plc-config.json');
      
      if (fs.existsSync(plcPath)) {
        res.setHeader('Content-Type', 'application/json');
        res.sendFile(plcPath);
      } else {
        res.status(404).json({ error: 'PLC configuration not found' });
      }
    } catch (error) {
      console.error('Error serving PLC config:', error);
      res.status(500).json({ error: 'Error loading PLC configuration' });
    }
  });

  // HMI Perspective JSON Route
  app.get('/hmi/:area(*)/perspective-view.json', async (req, res) => {
    try {
      const areaPath = req.params.area;
      const jsonPath = path.join(process.cwd(), areaPath, '.hmi', 'perspective-view.json');
      
      if (fs.existsSync(jsonPath)) {
        res.sendFile(jsonPath);
      } else {
        res.status(404).json({ error: 'Perspective view not found' });
      }
    } catch (error) {
      console.error('Error serving perspective view:', error);
      res.status(500).json({ error: 'Error loading perspective view' });
    }
  });

  // HMI Interface Routes - Must come last
  app.get('/hmi/:area(*)', async (req, res) => {
    try {
      const areaPath = req.params.area;
      const hmiPath = path.join(process.cwd(), areaPath, '.hmi', 'index.html');
      
      if (fs.existsSync(hmiPath)) {
        res.sendFile(hmiPath);
      } else {
        res.status(404).send('HMI interface not found');
      }
    } catch (error) {
      console.error('Error serving HMI:', error);
      res.status(500).send('Error loading HMI interface');
    }
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket service
  new WebSocketService(httpServer);

  return httpServer;
}
