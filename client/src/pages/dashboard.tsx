import { useState } from 'react';
import { Factory, Bell, User, Database, Monitor, ExternalLink } from 'lucide-react';
import { StatusIndicator } from '../components/StatusIndicator';
import { HMIPanel } from '../components/HMI-Panel';
import { PLCController } from '../components/PLC-Controller';
import { SCADAMonitor } from '../components/SCADA-Monitor';
import { UnsTagBrowser } from '../components/UNS-TagBrowser';
import { HMIViewer } from '../components/HMI-Viewer';
import { useFileSystem } from '../hooks/useFileSystem';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { toast } = useToast();
  const {
    directories,
    files,
    operations,
    alarms,
    metrics,
    selectedDirectory,
    selectedFile,
    expandedDirectories,
    isConnected,
    toggleDirectory,
    selectDirectory,
    selectFile,
    createDirectory,
    createOperation,
    acknowledgeAlarm,
  } = useFileSystem();

  const [currentUser] = useState('OPERATOR_01');
  const [selectedHMI, setSelectedHMI] = useState<string | null>(null);
  const activeAlarms = alarms.filter(alarm => !alarm.acknowledged);
  
  const systemStatus = {
    hmi: isConnected ? 'online' : 'offline',
    plc: isConnected ? 'online' : 'offline', 
    scada: isConnected ? 'online' : 'offline',
  } as const;

  // Event handlers
  const handleCreateDirectory = () => {
    toast({
      title: "Create Directory",
      description: "Directory creation functionality would be implemented here",
    });
  };

  const handleUploadFile = () => {
    toast({
      title: "Upload File", 
      description: "File upload functionality would be implemented here",
    });
  };

  const handleSyncDirectory = () => {
    if (selectedDirectory) {
      createOperation('SYNC_CHANGES', selectedDirectory.path);
      toast({
        title: "Sync Started",
        description: `Synchronizing ${selectedDirectory.name}...`,
      });
    }
  };

  const handleRefreshView = () => {
    toast({
      title: "View Refreshed",
      description: "Directory view has been refreshed",
    });
  };

  const handleCreateBackup = () => {
    if (selectedDirectory) {
      createOperation('BACKUP_DIR', selectedDirectory.path);
      toast({
        title: "Backup Started",
        description: `Creating backup of ${selectedDirectory.name}...`,
      });
    }
  };

  const handleValidatePermissions = () => {
    if (selectedDirectory) {
      createOperation('VALIDATE_PERM', selectedDirectory.path);
      toast({
        title: "Permission Check",
        description: `Validating permissions for ${selectedDirectory.name}...`,
      });
    }
  };

  const handleScanErrors = () => {
    createOperation('SCAN_ERRORS', selectedDirectory?.path || '/');
    toast({
      title: "Error Scan",
      description: "Scanning for file system errors...",
    });
  };

  const handleOptimizeStorage = () => {
    createOperation('OPTIMIZE', selectedDirectory?.path || '/');
    toast({
      title: "Storage Optimization",
      description: "Optimizing storage allocation...",
    });
  };

  const handleResolveConflict = () => {
    if (selectedFile) {
      createOperation('RESOLVE_CONFLICT', selectedFile.path);
      toast({
        title: "Conflict Resolution",
        description: `Resolving conflict for ${selectedFile.name}...`,
      });
    }
  };

  const handleViewHistory = () => {
    toast({
      title: "File History",
      description: "File history view would be implemented here",
    });
  };

  const handleAcknowledgeAlarm = (alarmId: number) => {
    acknowledgeAlarm(alarmId);
    toast({
      title: "Alarm Acknowledged",
      description: "Alarm has been acknowledged and cleared",
    });
  };

  const handleEmergencyStop = () => {
    toast({
      title: "EMERGENCY STOP ACTIVATED",
      description: "All operations have been halted immediately",
      variant: "destructive",
    });
  };

  const handleSafeShutdown = () => {
    toast({
      title: "Safe Shutdown Initiated",
      description: "System is shutting down safely...",
    });
  };

  return (
    <div className="bg-industrial-dark text-industrial-light font-sans min-h-screen overflow-hidden">
      {/* System Header */}
      <header className="industrial-panel border-b border-gray-600 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Factory className="text-industrial-blue text-xl" />
              <h1 className="font-mono font-bold text-lg">INDUCTIVE AUTOMATION SCADA</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <StatusIndicator status={isConnected ? 'online' : 'offline'} animate />
              <span className="font-mono">
                {isConnected ? 'SYSTEM OPERATIONAL' : 'SYSTEM OFFLINE'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* System Status Indicators */}
            <div className="flex items-center space-x-3 text-xs font-mono">
              <div className="flex items-center space-x-1">
                <StatusIndicator status={systemStatus.hmi} size="sm" />
                <span>HMI</span>
              </div>
              <div className="flex items-center space-x-1">
                <StatusIndicator status={systemStatus.plc} size="sm" />
                <span>PLC</span>
              </div>
              <div className="flex items-center space-x-1">
                <StatusIndicator status={systemStatus.scada} size="sm" />
                <span>SCADA</span>
              </div>
            </div>
            
            {/* Alarm Indicator */}
            <div className="flex items-center space-x-2 industrial-button px-3 py-1 rounded">
              <Bell className={`text-industrial-amber ${activeAlarms.length > 0 ? 'animate-blink' : ''}`} />
              <span className="font-mono text-xs">{activeAlarms.length}</span>
            </div>
            
            {/* User Info */}
            <div className="flex items-center space-x-2 text-sm">
              <User className="text-industrial-blue" />
              <span className="font-mono">{currentUser}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* HMI Viewer - Left Panel */}
        <div className="w-80 border-r border-gray-600">
          <HMIViewer
            onViewHMI={(hmiPath) => {
              setSelectedHMI(hmiPath);
              toast({
                title: "HMI Interface Selected",
                description: `Loading ${hmiPath} interface`,
              });
            }}
          />
        </div>

        {/* HMI Panel - Directory Control */}
        <HMIPanel
          directories={directories}
          selectedDirectory={selectedDirectory}
          expandedDirectories={expandedDirectories}
          currentPath={selectedDirectory?.path || ''}
          onToggleDirectory={toggleDirectory}
          onSelectDirectory={selectDirectory}
          onCreateDirectory={handleCreateDirectory}
          onUploadFile={handleUploadFile}
          onSyncDirectory={handleSyncDirectory}
          onRefreshView={handleRefreshView}
        />

        {/* Embedded HMI Interface - Center Content */}
        <div className="flex-1 industrial-panel">
          {selectedHMI ? (
            <div className="h-full flex flex-col">
              <div className="border-b border-gray-600 p-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono font-bold text-industrial-light">
                    ACTIVE HMI INTERFACE
                  </h3>
                  <button
                    onClick={() => setSelectedHMI(null)}
                    className="industrial-button px-3 py-1 rounded text-xs hover:bg-gray-600"
                  >
                    CLOSE
                  </button>
                </div>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  {selectedHMI}
                </p>
              </div>
              <iframe
                src={selectedHMI}
                className="flex-1 w-full border-0"
                title="HMI Interface"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Monitor size={48} className="text-gray-600 mx-auto mb-4" />
                <h3 className="font-mono font-bold text-gray-400 mb-2">
                  NO HMI SELECTED
                </h3>
                <p className="text-sm text-gray-500 font-mono">
                  Select an HMI interface from the left panel to view industrial control interfaces
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SCADA Monitor - Right Sidebar */}
        <SCADAMonitor
          alarms={alarms}
          metrics={metrics || null}
          isConnected={isConnected}
          onAcknowledgeAlarm={handleAcknowledgeAlarm}
          onEmergencyStop={handleEmergencyStop}
          onSafeShutdown={handleSafeShutdown}
        />
      </div>
    </div>
  );
}
