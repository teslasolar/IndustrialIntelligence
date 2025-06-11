# Industrial Automation File Management System

A revolutionary file management system that applies proven industrial automation architecture (HMI-PLC-SCADA) to solve repository operation challenges with authentic file system integration.

## 🏭 System Architecture

```
Enterprise/Site1/
├── Virtual Ignition Gateway (Express Server)
├── UNS (Unified Namespace) Tag Structure  
├── 10 Distributed PLC Controllers
├── HMI Perspective Interfaces
├── SCADA Monitoring & Control
└── Local File Path API
```

## 🚀 Live Demo

**GitHub Pages:** [View Industrial HMI Interface](https://your-username.github.io/your-repo/.hmi/)

**Root PLC Config:** [View PLC Configuration](https://your-username.github.io/your-repo/.plc/plc-config.json)

## 🎛️ Key Components

### Virtual Ignition Gateway
- **Express Server** acting as industrial automation gateway
- **UNS Tag Management** with Enterprise/Site1/Area hierarchy
- **MQTT Communication** with graceful WebSocket fallback
- **Real-time Data Processing** from distributed PLCs

### Distributed PLC Network
Each repository area has its own dedicated Programmable Logic Controller:

- **PLC1 - Client Area**: Frontend monitoring and control
- **PLC2 - Server Area**: Backend services management
- **PLC3 - Shared Area**: Common resource coordination
- **PLC4 - Components Area**: UI component tracking
- **PLC5 - Services Area**: Microservice operations
- **PLC6 - Types Area**: Type definition management
- **PLC7 - Hooks Area**: React hooks monitoring
- **PLC8 - Pages Area**: Page component control
- **PLC9 - Assets Area**: Asset management system
- **PLC10 - Workspace Area**: Development workspace control

### HMI Interfaces
Human-Machine Interfaces provide real-time visualization:

- **Perspective JSON Views** for authentic industrial visualization
- **Real-time File Metrics** (count, size, processing load)
- **Status Monitoring** with industrial-grade indicators
- **Interactive Control Panels** for system operations
- **Embedded HMI Viewer** with single-port routing

### Local File Path API
Authentic file system operations at the lowest level:

```javascript
// Scan directory structure
GET /api/filesystem/scan/:path

// Read file content
GET /api/filesystem/file/:path

// Create directory
POST /api/filesystem/directory

// Write file
POST /api/filesystem/file

// Delete file/directory
DELETE /api/filesystem/:path

// Copy file
POST /api/filesystem/copy

// Get file stats
GET /api/filesystem/stats/:path

// Search files
GET /api/filesystem/search?pattern=term&path=dir
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Local Development

```bash
# Clone repository
git clone https://github.com/your-username/industrial-file-management
cd industrial-file-management

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Deployment

```bash
# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## 📡 MQTT Communication

The system uses authentic industrial MQTT protocol for machine-to-machine communication:

### Topic Structure
```
industrial/plc/{plcId}/telemetry     # PLC data publishing
industrial/plc/{plcId}/status        # Status updates  
industrial/commands/{plcId}          # SCADA commands
industrial/alarms/{plcId}            # Alarm notifications
```

### Message Format
```json
{
  "plcId": "PLC_CLIENT",
  "areaName": "Client",
  "controlPath": "client",
  "fileCount": 142,
  "directorySize": 15628800,
  "processingLoad": 23.4,
  "status": "Running",
  "timestamp": "2025-06-11T15:32:00.000Z"
}
```

## 🎯 Why Industrial Automation for Files?

Traditional file management lacks the robust monitoring, control, and automation capabilities found in industrial systems. This project demonstrates how proven SCADA/HMI/PLC architecture revolutionizes repository operations:

### Benefits
- **Real-time Monitoring** of file system changes
- **Automated Alarm Generation** for critical events
- **Distributed Control** across repository areas  
- **Centralized SCADA Supervision** for oversight
- **Industrial-grade Communication** protocols
- **Authentic Data Integration** at lowest level
- **Scalable Architecture** for complex systems

### Use Cases
- **Enterprise Repository Management** with industrial-grade monitoring
- **DevOps File Operations** with SCADA-level oversight
- **Automated Build Systems** with PLC-controlled workflows
- **Asset Management** with real-time tracking
- **Compliance Monitoring** with audit trails

## 🏗️ Technology Stack

### Backend (Virtual Gateway)
- **Express.js** - Web server framework
- **TypeScript** - Type-safe development
- **MQTT.js** - Industrial communication protocol
- **WebSocket** - Real-time data streaming
- **Node.js File System API** - Authentic file operations

### Frontend (HMI Interfaces)
- **React 18** - Component framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Industrial styling
- **Shadcn/ui** - Component library
- **React Query** - Data synchronization

### Industrial Protocols
- **MQTT** - Machine-to-machine communication
- **Modbus** - Industrial device communication
- **OPC-UA** - Unified automation protocol
- **WebSocket** - Real-time web communication

## 📊 File System Integration

The system provides authentic file operations through a comprehensive API:

### Directory Scanning
```typescript
interface DirectoryStructure {
  path: string;
  name: string;
  files: FilePathItem[];
  directories: FilePathItem[];
  totalSize: number;
  totalFiles: number;
  lastModified: Date;
}
```

### File Operations
```typescript
interface FilePathItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: Date;
  checksum?: string;
  permissions: string;
  isHidden: boolean;
}
```

## 🚨 Alarm Management

Industrial-grade alarm system with priority-based notifications:

```typescript
interface TagAlarm {
  id: number;
  tagPath: string;
  alarmPath: string;
  alarmType: string;
  condition: string;
  priority: number;
  isActive: boolean;
  isAcknowledged: boolean;
  message: string;
  activeTime: Date;
  ackTime: Date | null;
  clearedTime: Date | null;
}
```

## 🔐 Security Features

Enterprise-grade security following industrial automation standards:

- **Certificate-based Authentication** for PLC communication
- **Encrypted MQTT Transport** for secure data transmission
- **Access Level Control** with role-based permissions
- **Session Management** with configurable timeouts
- **Security Audit Trails** for compliance

## 📈 Performance Monitoring

Real-time system metrics with industrial KPIs:

- **Processing Load** monitoring across all PLCs
- **File Operation Throughput** measurement
- **System Efficiency** calculations
- **Response Time** tracking
- **Resource Utilization** monitoring

## 🛠️ Configuration

### PLC Configuration
Each PLC is configured with industrial-standard parameters:

```json
{
  "plcId": "ROOT_ENTERPRISE_PLC",
  "model": "Industrial File Controller v2.1",
  "firmware": "IFC-2024.1",
  "scanRate": 100,
  "communicationSettings": {
    "mqtt": {
      "broker": "mqtt://localhost:1883",
      "qos": 1,
      "retainMessages": true
    }
  }
}
```

### Network Configuration
Redundant network interfaces for high availability:

```json
{
  "primaryInterface": {
    "ipAddress": "192.168.1.100",
    "subnetMask": "255.255.255.0",
    "gateway": "192.168.1.1"
  },
  "redundantInterface": {
    "ipAddress": "192.168.2.100",
    "enabled": false
  }
}
```

## 🎮 Usage Examples

### Scanning Repository Structure
```bash
curl "http://localhost:5000/api/filesystem/scan/client"
```

### Monitoring PLC Status
```bash
curl "http://localhost:5000/api/uns/tags" | grep "Status"
```

### Viewing HMI Interface
Navigate to: `http://localhost:5000/hmi/client`

### Accessing SCADA Dashboard
Navigate to: `http://localhost:5000`

## 🔧 Development

### Project Structure
```
├── client/                 # React frontend
│   ├── src/components/    # HMI components
│   └── src/pages/         # Application pages
├── server/                # Express backend
│   ├── services/          # Industrial services
│   └── routes.ts          # API endpoints
├── shared/                # Common schemas
├── .hmi/                  # HMI interfaces
├── .plc/                  # PLC configurations
└── workspace/             # Development area
```

### Adding New PLCs
1. Create PLC directory: `mkdir area/.plc`
2. Configure PLC settings in `plc-config.json`
3. Deploy HMI interface in `area/.hmi/`
4. Register in UNS tag structure

### Custom HMI Development
HMI interfaces use Perspective JSON format compatible with Ignition SCADA:

```html
<!-- Load PLC configuration -->
<script>
fetch('./plc-config.json')
  .then(response => response.json())
  .then(config => updateHMI(config));
</script>
```

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For technical support or questions about industrial automation concepts:

- **GitHub Issues**: [Report bugs or request features](https://github.com/your-username/industrial-file-management/issues)
- **Documentation**: [Wiki pages](https://github.com/your-username/industrial-file-management/wiki)
- **Discord**: [Join our community](https://discord.gg/industrial-automation)

## 🎖️ Acknowledgments

This project applies proven industrial automation principles from:

- **Inductive Automation** - Ignition SCADA platform inspiration
- **ISA-95** - Manufacturing enterprise integration standards  
- **OPC Foundation** - Unified automation protocols
- **MQTT.org** - Industrial IoT communication standards

---

**Industrial Automation File Management System** - Bringing enterprise-grade control to repository operations through authentic PLC-SCADA-HMI architecture.