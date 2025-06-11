import { useState } from 'react';
import { Monitor, ExternalLink, RefreshCw } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';

interface HMIViewerProps {
  onViewHMI?: (hmiPath: string) => void;
}

const HMI_INTERFACES = [
  { name: 'Client Area', path: '/client/.hmi/', plc: 'PLC1', description: 'Frontend application control' },
  { name: 'Server Area', path: '/server/.hmi/', plc: 'PLC2', description: 'Backend services control' },
  { name: 'Shared Area', path: '/shared/.hmi/', plc: 'PLC3', description: 'Schema and shared resources' },
  { name: 'Components', path: '/client/src/components/.hmi/', plc: 'PLC4', description: 'React components control' },
  { name: 'Services', path: '/server/services/.hmi/', plc: 'PLC5', description: 'Business logic services' },
  { name: 'Types', path: '/client/src/types/.hmi/', plc: 'PLC6', description: 'TypeScript definitions' },
  { name: 'Hooks', path: '/client/src/hooks/.hmi/', plc: 'PLC7', description: 'React hooks control' },
  { name: 'Pages', path: '/client/src/pages/.hmi/', plc: 'PLC8', description: 'Application pages' },
  { name: 'Assets', path: '/attached_assets/.hmi/', plc: 'PLC9', description: 'Asset management' },
  { name: 'Workspace', path: '/workspace/.hmi/', plc: 'PLC10', description: 'Development workspace' }
];

export function HMIViewer({ onViewHMI }: HMIViewerProps) {
  const [selectedHMI, setSelectedHMI] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleViewHMI = (hmiPath: string) => {
    setSelectedHMI(hmiPath);
    // Open HMI in new window/tab since we're in Replit
    window.open(hmiPath, '_blank', 'width=1200,height=800');
    onViewHMI?.(hmiPath);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <div className="industrial-panel h-full overflow-auto">
      <div className="border-b border-gray-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Monitor className="text-industrial-blue" size={20} />
            <h3 className="font-mono font-bold text-industrial-light">HMI INTERFACES</h3>
          </div>
          <button
            onClick={handleRefresh}
            className="industrial-button p-2 rounded hover:bg-gray-600"
            disabled={refreshing}
          >
            <RefreshCw 
              size={16} 
              className={`text-industrial-blue ${refreshing ? 'animate-spin' : ''}`} 
            />
          </button>
        </div>
        <p className="text-xs text-gray-400 font-mono mt-1">
          Industrial HMI Control Interfaces
        </p>
      </div>

      <div className="p-4 space-y-2">
        {HMI_INTERFACES.map((hmi) => (
          <div
            key={hmi.path}
            className={`
              industrial-card p-3 rounded border transition-all duration-200 cursor-pointer
              ${selectedHMI === hmi.path 
                ? 'border-industrial-blue bg-gray-700' 
                : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800'
              }
            `}
            onClick={() => handleViewHMI(hmi.path)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <StatusIndicator status="online" size="sm" animate />
                  <span className="font-mono font-bold text-sm text-industrial-light">
                    {hmi.name}
                  </span>
                  <span className="text-xs text-industrial-blue font-mono">
                    {hmi.plc}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono">
                  {hmi.description}
                </p>
                <p className="text-xs text-gray-500 font-mono mt-1">
                  Path: {hmi.path}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <ExternalLink size={16} className="text-industrial-amber" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-600 p-4">
        <div className="text-xs text-gray-400 font-mono space-y-1">
          <p>• Each HMI displays live PLC data and system metrics</p>
          <p>• Interfaces auto-refresh every 5 seconds</p>
          <p>• Emergency controls and alarm management included</p>
          <p>• Compatible with Ignition Perspective JSON format</p>
        </div>
      </div>
    </div>
  );
}