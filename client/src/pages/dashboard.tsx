import { useState } from 'react';
import { Factory, Bell, User, Database } from 'lucide-react';
import { StatusIndicator } from '../components/StatusIndicator';
import { HMIPanel } from '../components/HMI-Panel';
import { PLCController } from '../components/PLC-Controller';
import { SCADAMonitor } from '../components/SCADA-Monitor';
import { UnsTagBrowser } from '../components/UNS-TagBrowser';
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
        {/* UNS Tag Browser - Left Panel */}
        <UnsTagBrowser
          onSelectNode={(node) => {
            toast({
              title: "UNS Node Selected",
              description: `Selected node: ${node.name} (${node.nodeType})`,
            });
          }}
          onSelectTag={(tag) => {
            toast({
              title: "Tag Selected", 
              description: `${tag.tagName}: ${tag.value} (${tag.quality})`,
            });
          }}
          onSelectView={(view) => {
            toast({
              title: "Perspective View Selected",
              description: `View: ${view.viewName} (${view.viewType})`,
            });
          }}
        />

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

        {/* PLC Controller - Center Content */}
        <PLCController
          files={files}
          operations={operations}
          selectedFile={selectedFile}
          onSelectFile={selectFile}
          onCreateBackup={handleCreateBackup}
          onValidatePermissions={handleValidatePermissions}
          onScanErrors={handleScanErrors}
          onOptimizeStorage={handleOptimizeStorage}
          onResolveConflict={handleResolveConflict}
          onViewHistory={handleViewHistory}
        />

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
