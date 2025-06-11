import { useState } from 'react';
import { Folder, FolderOpen, FileCode, FileText, Plus, Upload, RotateCcw, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusIndicator } from './StatusIndicator';
import { DirectoryItem, FileItem } from '../types/industrial';

interface HMIPanelProps {
  directories: DirectoryItem[];
  selectedDirectory: DirectoryItem | null;
  expandedDirectories: Set<number>;
  currentPath: string;
  onToggleDirectory: (directoryId: number) => void;
  onSelectDirectory: (directory: DirectoryItem) => void;
  onCreateDirectory: () => void;
  onUploadFile: () => void;
  onSyncDirectory: () => void;
  onRefreshView: () => void;
}

export function HMIPanel({
  directories,
  selectedDirectory,
  expandedDirectories,
  currentPath,
  onToggleDirectory,
  onSelectDirectory,
  onCreateDirectory,
  onUploadFile,
  onSyncDirectory,
  onRefreshView,
}: HMIPanelProps) {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <FileCode className="w-3 h-3 text-industrial-blue" />;
      case 'json':
      case 'txt':
      case 'md':
        return <FileText className="w-3 h-3 text-industrial-amber" />;
      default:
        return <FileCode className="w-3 h-3 text-industrial-blue" />;
    }
  };

  const buildDirectoryTree = (dirs: DirectoryItem[]): DirectoryItem[] => {
    const dirMap = new Map<number, DirectoryItem>();
    const rootDirs: DirectoryItem[] = [];

    // Create map of all directories with children array
    dirs.forEach(dir => {
      dirMap.set(dir.id, { ...dir, children: [], expanded: expandedDirectories.has(dir.id) });
    });

    // Build tree structure
    dirs.forEach(dir => {
      const dirWithChildren = dirMap.get(dir.id)!;
      if (dir.parentId === null) {
        rootDirs.push(dirWithChildren);
      } else {
        const parent = dirMap.get(dir.parentId);
        if (parent) {
          parent.children!.push(dirWithChildren);
        }
      }
    });

    return rootDirs;
  };

  const renderDirectoryTree = (dirs: DirectoryItem[], level = 0) => {
    return dirs.map(dir => (
      <div key={dir.id} className="space-y-1">
        <div
          className={`
            flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors group
            ${selectedDirectory?.id === dir.id ? 'bg-industrial-blue/20' : 'hover:bg-gray-700'}
            ${level > 0 ? 'ml-4 border-l border-gray-600 pl-4' : ''}
          `}
          onMouseEnter={() => setHoveredItem(dir.id)}
          onMouseLeave={() => setHoveredItem(null)}
          onClick={() => {
            onToggleDirectory(dir.id);
            onSelectDirectory(dir);
          }}
        >
          {dir.expanded ? (
            <FolderOpen className="w-4 h-4 text-industrial-amber" />
          ) : (
            <Folder className="w-4 h-4 text-industrial-amber" />
          )}
          <span className="font-mono text-sm flex-1">{dir.name}</span>
          <div className="flex items-center space-x-1">
            <StatusIndicator status={dir.status} size="sm" />
            <span className="text-xs text-gray-400 font-mono">{dir.fileCount}</span>
          </div>
        </div>

        {dir.expanded && dir.children && dir.children.length > 0 && (
          <div className="space-y-1">
            {renderDirectoryTree(dir.children, level + 1)}
          </div>
        )}

        {dir.expanded && dir.id === selectedDirectory?.id && (
          <div className="ml-6 space-y-1 border-l border-gray-600 pl-2">
            {/* Mock files for demo - in real app these would come from props */}
            <div className="flex items-center space-x-2 p-1 rounded hover:bg-gray-700 cursor-pointer">
              {getFileIcon('HMI.component.jsx')}
              <span className="font-mono text-xs text-gray-300">HMI.component.jsx</span>
              <StatusIndicator status="sync" size="sm" />
            </div>
            <div className="flex items-center space-x-2 p-1 rounded hover:bg-gray-700 cursor-pointer">
              {getFileIcon('PLC.controller.js')}
              <span className="font-mono text-xs text-gray-300">PLC.controller.js</span>
              <StatusIndicator status="conflict" size="sm" />
            </div>
            <div className="flex items-center space-x-2 p-1 rounded hover:bg-gray-700 cursor-pointer">
              {getFileIcon('SCADA.service.js')}
              <span className="font-mono text-xs text-gray-300">SCADA.service.js</span>
              <StatusIndicator status="sync" size="sm" />
            </div>
          </div>
        )}
      </div>
    ));
  };

  const directoryTree = buildDirectoryTree(directories);

  return (
    <div className="w-80 industrial-panel border-r border-gray-600 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-600 px-4 py-3">
        <h2 className="font-mono font-semibold text-industrial-blue">HMI - OPERATOR INTERFACE</h2>
        <p className="text-xs text-gray-400 mt-1">Human Machine Interface</p>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="px-4 py-2 border-b border-gray-700">
        <nav className="text-xs font-mono">
          <span className="text-gray-400">PATH:</span>
          <span className="text-industrial-green ml-1">{currentPath || selectedDirectory?.path || '/root/projects/automation-system'}</span>
        </nav>
      </div>

      {/* Directory Tree */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {directoryTree.length > 0 ? (
            renderDirectoryTree(directoryTree)
          ) : (
            <div className="text-center text-gray-400 text-sm font-mono py-8">
              <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No directories found
            </div>
          )}
        </div>
      </div>

      {/* Operation Controls */}
      <div className="border-t border-gray-600 p-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="industrial-button font-mono text-xs"
            onClick={onCreateDirectory}
          >
            <Plus className="w-3 h-3 mr-1" />
            NEW DIR
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="industrial-button font-mono text-xs"
            onClick={onUploadFile}
          >
            <Upload className="w-3 h-3 mr-1" />
            UPLOAD
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="industrial-button font-mono text-xs"
            onClick={onSyncDirectory}
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            SYNC
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="industrial-button font-mono text-xs"
            onClick={onRefreshView}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            REFRESH
          </Button>
        </div>
      </div>
    </div>
  );
}
