import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketService } from "./services/websocketService";
import { FileSystemService } from "./services/fileSystemService";
import { 
  insertDirectorySchema, 
  insertFileSchema, 
  insertFileOperationSchema, 
  insertSystemAlarmSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const fileSystemService = new FileSystemService();

  // Directory routes
  app.get("/api/directories", async (req, res) => {
    try {
      const directories = await storage.getAllDirectories();
      res.json(directories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch directories" });
    }
  });

  app.get("/api/directories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const directory = await storage.getDirectory(id);
      if (!directory) {
        return res.status(404).json({ message: "Directory not found" });
      }
      res.json(directory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch directory" });
    }
  });

  app.post("/api/directories", async (req, res) => {
    try {
      const directoryData = insertDirectorySchema.parse(req.body);
      const directory = await storage.createDirectory(directoryData);
      
      // Create actual directory on file system
      await fileSystemService.createDirectory(directory.path);
      
      res.status(201).json(directory);
    } catch (error) {
      res.status(400).json({ message: "Failed to create directory", error: error.message });
    }
  });

  // File routes
  app.get("/api/directories/:id/files", async (req, res) => {
    try {
      const directoryId = parseInt(req.params.id);
      const files = await storage.getFilesByDirectory(directoryId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.get("/api/files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const file = await storage.getFile(id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch file" });
    }
  });

  app.post("/api/files", async (req, res) => {
    try {
      const fileData = insertFileSchema.parse(req.body);
      const file = await storage.createFile(fileData);
      res.status(201).json(file);
    } catch (error) {
      res.status(400).json({ message: "Failed to create file", error: error.message });
    }
  });

  app.put("/api/files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const file = await storage.updateFile(id, updates);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to update file" });
    }
  });

  // File operations
  app.get("/api/operations", async (req, res) => {
    try {
      const operations = await storage.getAllFileOperations();
      res.json(operations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch operations" });
    }
  });

  app.post("/api/operations", async (req, res) => {
    try {
      const operationData = insertFileOperationSchema.parse(req.body);
      const operation = await storage.createFileOperation(operationData);
      res.status(201).json(operation);
    } catch (error) {
      res.status(400).json({ message: "Failed to create operation", error: error.message });
    }
  });

  app.put("/api/operations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const operation = await storage.updateFileOperation(id, updates);
      if (!operation) {
        return res.status(404).json({ message: "Operation not found" });
      }
      res.json(operation);
    } catch (error) {
      res.status(500).json({ message: "Failed to update operation" });
    }
  });

  // System alarms
  app.get("/api/alarms", async (req, res) => {
    try {
      const active = req.query.active === 'true';
      const alarms = active ? await storage.getActiveAlarms() : await storage.getAllAlarms();
      res.json(alarms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch alarms" });
    }
  });

  app.post("/api/alarms", async (req, res) => {
    try {
      const alarmData = insertSystemAlarmSchema.parse(req.body);
      const alarm = await storage.createAlarm(alarmData);
      res.status(201).json(alarm);
    } catch (error) {
      res.status(400).json({ message: "Failed to create alarm", error: error.message });
    }
  });

  app.put("/api/alarms/:id/acknowledge", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const alarm = await storage.acknowledgeAlarm(id);
      if (!alarm) {
        return res.status(404).json({ message: "Alarm not found" });
      }
      res.json(alarm);
    } catch (error) {
      res.status(500).json({ message: "Failed to acknowledge alarm" });
    }
  });

  // System metrics
  app.get("/api/metrics", async (req, res) => {
    try {
      const latest = req.query.latest === 'true';
      const metrics = latest ? await storage.getLatestMetrics() : await storage.getMetricsHistory();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // File system operations
  app.post("/api/filesystem/scan", async (req, res) => {
    try {
      const { path } = req.body;
      const result = await fileSystemService.scanDirectory(path || '/');
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to scan directory" });
    }
  });

  app.post("/api/filesystem/create-directory", async (req, res) => {
    try {
      const { path } = req.body;
      const success = await fileSystemService.createDirectory(path);
      if (success) {
        res.json({ message: "Directory created successfully" });
      } else {
        res.status(500).json({ message: "Failed to create directory" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to create directory" });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket service
  new WebSocketService(httpServer);

  return httpServer;
}
