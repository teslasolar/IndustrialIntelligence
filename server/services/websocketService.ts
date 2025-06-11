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
      case 'GET_DIRECTORIES':
        const directories = await storage.getAllDirectories();
        this.sendToClient(ws, { type: 'DIRECTORIES_UPDATE', data: directories });
        break;
      
      case 'GET_FILES':
        const files = await storage.getFilesByDirectory(data.directoryId);
        this.sendToClient(ws, { type: 'FILES_UPDATE', data: files });
        break;
      
      case 'ACKNOWLEDGE_ALARM':
        const alarm = await storage.acknowledgeAlarm(data.alarmId);
        if (alarm) {
          this.broadcast({ type: 'ALARM_ACKNOWLEDGED', data: alarm });
        }
        break;
      
      case 'CREATE_OPERATION':
        const operation = await storage.createFileOperation(data.operation);
        this.broadcast({ type: 'OPERATION_CREATED', data: operation });
        break;
    }
  }

  private async sendInitialData(ws: WebSocket) {
    try {
      const [directories, alarms, metrics, operations] = await Promise.all([
        storage.getAllDirectories(),
        storage.getActiveAlarms(),
        storage.getLatestMetrics(),
        storage.getAllFileOperations(),
      ]);

      this.sendToClient(ws, {
        type: 'INITIAL_DATA',
        data: {
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
    // Update system metrics every 2 seconds
    setInterval(async () => {
      const currentMetrics = await storage.getLatestMetrics();
      if (currentMetrics) {
        // Simulate changing metrics
        const newMetrics = {
          cpuUsage: Math.max(15, Math.min(85, currentMetrics.cpuUsage + (Math.random() - 0.5) * 5)),
          memoryUsage: Math.max(40, Math.min(90, currentMetrics.memoryUsage + (Math.random() - 0.5) * 3)),
          diskIO: Math.max(10, Math.min(95, currentMetrics.diskIO + (Math.random() - 0.5) * 8)),
          throughput: Math.max(500, Math.min(2500, currentMetrics.throughput + (Math.random() - 0.5) * 200)),
          operationsPerMin: Math.max(400, Math.min(1200, currentMetrics.operationsPerMin + (Math.random() - 0.5) * 50)),
          errorRate: Math.max(0, Math.min(500, currentMetrics.errorRate + (Math.random() - 0.5) * 10)),
        };

        const updatedMetrics = await storage.createMetrics(newMetrics);
        this.broadcast({ type: 'METRICS_UPDATE', data: updatedMetrics });
      }
    }, 2000);

    // Simulate file operations progress
    setInterval(async () => {
      const operations = await storage.getPendingFileOperations();
      for (const operation of operations) {
        if (operation.status === 'pending') {
          await storage.updateFileOperation(operation.id, { status: 'running', progress: 0 });
          this.broadcast({ type: 'OPERATION_UPDATED', data: { ...operation, status: 'running', progress: 0 } });
        } else if (operation.status === 'running' && operation.progress < 100) {
          const newProgress = Math.min(100, operation.progress + Math.random() * 30);
          const status = newProgress >= 100 ? 'completed' : 'running';
          await storage.updateFileOperation(operation.id, { progress: Math.floor(newProgress), status });
          this.broadcast({ type: 'OPERATION_UPDATED', data: { ...operation, progress: Math.floor(newProgress), status } });
        }
      }
    }, 1000);
  }
}
