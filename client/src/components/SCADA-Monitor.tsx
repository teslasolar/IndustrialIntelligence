import { AlertTriangle, Clock, CircleAlert, Bell, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StatusIndicator } from './StatusIndicator';
import { SystemAlarm, SystemMetrics, ConnectedSystem } from '../types/industrial';

interface SCADAMonitorProps {
  alarms: SystemAlarm[];
  metrics: SystemMetrics | null;
  isConnected: boolean;
  onAcknowledgeAlarm: (alarmId: number) => void;
  onEmergencyStop: () => void;
  onSafeShutdown: () => void;
}

export function SCADAMonitor({
  alarms,
  metrics,
  isConnected,
  onAcknowledgeAlarm,
  onEmergencyStop,
  onSafeShutdown,
}: SCADAMonitorProps) {
  const activeAlarms = alarms.filter(alarm => !alarm.acknowledged);

  const getAlarmIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return <AlertTriangle className="text-industrial-red alarm-priority-high" />;
      case 'warning':
        return <CircleAlert className="text-industrial-amber" />;
      default:
        return <Clock className="text-industrial-amber" />;
    }
  };

  const getAlarmBorderColor = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return 'border-l-4 border-industrial-red';
      case 'warning':
        return 'border-l-4 border-industrial-amber';
      default:
        return 'border-l-4 border-industrial-blue';
    }
  };

  const formatTime = (date: Date | string | null): string => {
    if (!date) return '--:--';
    
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return '--:--';
      
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(dateObj);
    } catch (error) {
      return '--:--';
    }
  };

  const formatThroughput = (kbps: number): string => {
    if (kbps >= 1000) {
      return `${(kbps / 1000).toFixed(1)}MB/s`;
    }
    return `${(kbps / 1000).toFixed(1)}MB/s`;
  };

  // Mock connected systems data
  const connectedSystems: ConnectedSystem[] = [
    { name: 'FILE_SERVER_01', status: 'online', latency: 12 },
    { name: 'BACKUP_STORAGE', status: 'online', latency: 8 },
    { name: 'VERSION_CONTROL', status: 'warning', latency: 156 },
    { name: 'AUTH_SERVICE', status: 'online', latency: 23 },
  ];

  return (
    <div className="w-80 industrial-panel border-l border-gray-600 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-600 px-4 py-3">
        <h2 className="font-mono font-semibold text-industrial-blue">SCADA - SYSTEM SUPERVISOR</h2>
        <p className="text-xs text-gray-400 mt-1">Supervisory Control & Data Acquisition</p>
      </div>

      {/* System Status */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="font-mono text-sm font-medium mb-3">SYSTEM STATUS</h3>
        {metrics ? (
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">CPU USAGE:</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-industrial-green h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${metrics.cpuUsage}%` }}
                  />
                </div>
                <span className="text-white w-8 text-right">{metrics.cpuUsage}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">MEMORY:</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      metrics.memoryUsage > 80 ? 'bg-industrial-red' : 
                      metrics.memoryUsage > 60 ? 'bg-industrial-amber' : 'bg-industrial-green'
                    }`}
                    style={{ width: `${metrics.memoryUsage}%` }}
                  />
                </div>
                <span className="text-white w-8 text-right">{metrics.memoryUsage}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">DISK I/O:</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-industrial-blue h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${metrics.diskIO}%` }}
                  />
                </div>
                <span className="text-white w-8 text-right">{metrics.diskIO}%</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 text-xs font-mono py-4">
            No metrics available
          </div>
        )}
      </div>

      {/* Active Alarms */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-mono text-sm font-medium">ACTIVE ALARMS</h3>
          <span className="text-xs font-mono text-industrial-red">
            {activeAlarms.length} ACTIVE
          </span>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {activeAlarms.length > 0 ? (
            activeAlarms.map(alarm => (
              <div
                key={alarm.id}
                className={`industrial-button p-2 rounded cursor-pointer hover:bg-gray-600 transition-colors ${getAlarmBorderColor(alarm.severity)}`}
                onClick={() => onAcknowledgeAlarm(alarm.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getAlarmIcon(alarm.severity)}
                    <span className="text-xs font-mono text-white">{alarm.message}</span>
                  </div>
                  <span className="text-xs text-gray-400">{formatTime(alarm.createdAt)}</span>
                </div>
                {alarm.location && (
                  <div className="text-xs text-gray-400 font-mono mt-1">{alarm.location}</div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 text-xs font-mono py-4">
              No active alarms
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="font-mono text-sm font-medium mb-3">PERFORMANCE</h3>
        {metrics ? (
          <div className="space-y-3">
            <div className="text-xs font-mono">
              <div className="flex justify-between mb-1">
                <span className="text-gray-400">THROUGHPUT</span>
                <span className="text-white">{formatThroughput(metrics.throughput)}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1">
                <div 
                  className="bg-industrial-green h-1 rounded-full animate-pulse-slow transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (metrics.throughput / 2500) * 100)}%` }}
                />
              </div>
            </div>
            
            <div className="text-xs font-mono">
              <div className="flex justify-between mb-1">
                <span className="text-gray-400">OPERATIONS/MIN</span>
                <span className="text-white">{metrics.operationsPerMin}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1">
                <div 
                  className="bg-industrial-blue h-1 rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (metrics.operationsPerMin / 1200) * 100)}%` }}
                />
              </div>
            </div>
            
            <div className="text-xs font-mono">
              <div className="flex justify-between mb-1">
                <span className="text-gray-400">ERROR RATE</span>
                <span className="text-industrial-amber">{(metrics.errorRate / 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1">
                <div 
                  className="bg-industrial-amber h-1 rounded-full transition-all duration-1000" 
                  style={{ width: `${metrics.errorRate / 10}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 text-xs font-mono py-4">
            No performance data
          </div>
        )}
      </div>

      {/* Connected Systems */}
      <div className="flex-1 p-4">
        <h3 className="font-mono text-sm font-medium mb-3">CONNECTED SYSTEMS</h3>
        <div className="space-y-2">
          {connectedSystems.map(system => (
            <div key={system.name} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-2">
                <StatusIndicator status={system.status} size="sm" />
                <span className="text-xs font-mono">{system.name}</span>
              </div>
              <span className="text-xs text-gray-400 font-mono">{system.latency}ms</span>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Controls */}
      <div className="border-t border-gray-600 p-4">
        <h3 className="font-mono text-sm font-medium mb-3 text-industrial-red">EMERGENCY CONTROLS</h3>
        <div className="space-y-2">
          <Button
            variant="destructive"
            size="sm"
            className="w-full bg-industrial-red hover:bg-red-600 font-mono text-xs transition-colors"
            onClick={onEmergencyStop}
          >
            <Power className="w-3 h-3 mr-2" />
            EMERGENCY STOP
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full industrial-button font-mono text-xs"
            onClick={onSafeShutdown}
          >
            <PowerOff className="w-3 h-3 mr-2" />
            SAFE SHUTDOWN
          </Button>
        </div>
      </div>
    </div>
  );
}
