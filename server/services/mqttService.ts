import * as mqtt from 'mqtt';
import { EventEmitter } from 'events';

export interface PLCTelemetry {
  plcId: string;
  areaName: string;
  controlPath: string;
  fileCount: number;
  directorySize: number;
  processingLoad: number;
  status: 'Running' | 'Active' | 'Warning' | 'Error' | 'Offline';
  lastModified: string;
  timestamp: string;
}

export interface SCADACommand {
  targetPLC: string;
  command: 'EMERGENCY_STOP' | 'RESET_ALARMS' | 'RESTART' | 'SCAN_DIRECTORY' | 'BACKUP_FILES';
  parameters?: any;
}

export class MQTTService extends EventEmitter {
  private client: mqtt.MqttClient | null = null;
  private brokerUrl: string;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;

  constructor(brokerUrl: string = 'mqtt://localhost:1883') {
    super();
    this.brokerUrl = brokerUrl;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`Connecting to MQTT broker at ${this.brokerUrl}...`);
        
        this.client = mqtt.connect(this.brokerUrl, {
          clientId: `scada_master_${Date.now()}`,
          clean: true,
          connectTimeout: 2000,
          username: 'scada',
          password: 'industrial',
          reconnectPeriod: false, // Disable automatic reconnection
        });

        this.client.on('connect', () => {
          console.log('MQTT broker connected successfully');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.setupSubscriptions();
          this.emit('connected');
          resolve();
        });

        this.client.on('error', (error) => {
          console.log('MQTT broker unavailable - continuing with WebSocket-only mode');
          this.isConnected = false;
          this.client = null;
          resolve(); // Don't reject, allow graceful fallback
        });

        this.client.on('offline', () => {
          console.log('MQTT broker disconnected');
          this.isConnected = false;
          this.emit('disconnected');
        });

        this.client.on('message', this.handleMessage.bind(this));

        // Timeout after 3 seconds
        setTimeout(() => {
          if (!this.isConnected) {
            console.log('MQTT connection timeout - continuing with WebSocket-only mode');
            this.client?.end();
            this.client = null;
            this.isConnected = false;
            resolve();
          }
        }, 3000);

      } catch (error) {
        console.log('MQTT broker initialization failed - continuing with WebSocket-only mode');
        resolve(); // Don't reject, allow graceful fallback
      }
    });
  }

  private setupSubscriptions(): void {
    if (!this.client || !this.isConnected) return;

    // Subscribe to PLC telemetry data
    this.client.subscribe('industrial/plc/+/telemetry', (err) => {
      if (err) {
        console.error('Failed to subscribe to PLC telemetry:', err);
      } else {
        console.log('Subscribed to PLC telemetry topics');
      }
    });

    // Subscribe to PLC status updates
    this.client.subscribe('industrial/plc/+/status', (err) => {
      if (err) {
        console.error('Failed to subscribe to PLC status:', err);
      } else {
        console.log('Subscribed to PLC status topics');
      }
    });

    // Subscribe to alarm notifications
    this.client.subscribe('industrial/alarms/+', (err) => {
      if (err) {
        console.error('Failed to subscribe to alarms:', err);
      } else {
        console.log('Subscribed to alarm topics');
      }
    });

    // Subscribe to system events
    this.client.subscribe('industrial/events/+', (err) => {
      if (err) {
        console.error('Failed to subscribe to events:', err);
      } else {
        console.log('Subscribed to system event topics');
      }
    });
  }

  private handleMessage(topic: string, message: Buffer): void {
    try {
      const payload = JSON.parse(message.toString());
      const topicParts = topic.split('/');

      switch (topicParts[1]) {
        case 'plc':
          if (topicParts[3] === 'telemetry') {
            this.emit('plc_telemetry', {
              plcId: topicParts[2],
              data: payload as PLCTelemetry
            });
          } else if (topicParts[3] === 'status') {
            this.emit('plc_status', {
              plcId: topicParts[2],
              status: payload
            });
          }
          break;

        case 'alarms':
          this.emit('alarm', {
            plcId: topicParts[2],
            alarm: payload
          });
          break;

        case 'events':
          this.emit('system_event', {
            source: topicParts[2],
            event: payload
          });
          break;

        default:
          console.log(`Unhandled MQTT topic: ${topic}`);
      }
    } catch (error) {
      console.error('Error processing MQTT message:', error);
    }
  }

  publishPLCTelemetry(plcId: string, telemetry: PLCTelemetry): void {
    if (!this.client || !this.isConnected) {
      console.warn('MQTT not connected, cannot publish telemetry');
      return;
    }

    const topic = `industrial/plc/${plcId}/telemetry`;
    const message = JSON.stringify({
      ...telemetry,
      timestamp: new Date().toISOString()
    });

    this.client.publish(topic, message, { qos: 1 }, (err) => {
      if (err) {
        console.error(`Failed to publish telemetry for ${plcId}:`, err);
      }
    });
  }

  publishPLCStatus(plcId: string, status: string, metadata?: any): void {
    if (!this.client || !this.isConnected) {
      console.warn('MQTT not connected, cannot publish status');
      return;
    }

    const topic = `industrial/plc/${plcId}/status`;
    const message = JSON.stringify({
      status,
      timestamp: new Date().toISOString(),
      metadata: metadata || {}
    });

    this.client.publish(topic, message, { qos: 1 }, (err) => {
      if (err) {
        console.error(`Failed to publish status for ${plcId}:`, err);
      }
    });
  }

  sendSCADACommand(command: SCADACommand): void {
    if (!this.client || !this.isConnected) {
      console.warn('MQTT not connected, cannot send command');
      return;
    }

    const topic = `industrial/commands/${command.targetPLC}`;
    const message = JSON.stringify({
      ...command,
      timestamp: new Date().toISOString(),
      sourceId: 'scada_master'
    });

    this.client.publish(topic, message, { qos: 2 }, (err) => {
      if (err) {
        console.error(`Failed to send command to ${command.targetPLC}:`, err);
      } else {
        console.log(`Command sent to ${command.targetPLC}: ${command.command}`);
      }
    });
  }

  publishAlarm(plcId: string, alarm: any): void {
    if (!this.client || !this.isConnected) {
      console.warn('MQTT not connected, cannot publish alarm');
      return;
    }

    const topic = `industrial/alarms/${plcId}`;
    const message = JSON.stringify({
      ...alarm,
      timestamp: new Date().toISOString()
    });

    this.client.publish(topic, message, { qos: 2 }, (err) => {
      if (err) {
        console.error(`Failed to publish alarm for ${plcId}:`, err);
      }
    });
  }

  isConnectedToBroker(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      return new Promise((resolve) => {
        this.client!.end(false, (error?: Error) => {
          this.isConnected = false;
          resolve();
        });
      });
    }
  }

  getConnectionStatus(): { connected: boolean, attempts: number } {
    return {
      connected: this.isConnected,
      attempts: this.reconnectAttempts
    };
  }
}

// Singleton instance for the application
export const mqttService = new MQTTService();