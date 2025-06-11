export interface SystemStatus {
  hmi: 'online' | 'offline' | 'warning';
  plc: 'online' | 'offline' | 'warning';
  scada: 'online' | 'offline' | 'warning';
}

export interface OperationQueue {
  id: number;
  type: string;
  target: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
}

export interface FileItem {
  id: number;
  name: string;
  path: string;
  size: number;
  type: string;
  status: 'sync' | 'conflict' | 'modified' | 'error';
  lastModified: Date;
  checksum?: string;
}

export interface DirectoryItem {
  id: number;
  name: string;
  path: string;
  fileCount: number;
  status: 'active' | 'syncing' | 'error';
  children?: DirectoryItem[];
  expanded?: boolean;
}

export interface SystemAlarm {
  id: number;
  type: string;
  message: string;
  location?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  acknowledged: boolean;
  createdAt: Date;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskIO: number;
  throughput: number;
  operationsPerMin: number;
  errorRate: number;
  timestamp: Date;
}

export interface ConnectedSystem {
  name: string;
  status: 'online' | 'offline' | 'warning';
  latency: number;
}

export interface WebSocketMessage {
  type: string;
  data: any;
}
