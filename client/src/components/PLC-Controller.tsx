import { useState } from 'react';
import { FileCode, FileText, List, Grid3X3, Settings, Archive, Shield, Search, Zap, History, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StatusIndicator } from './StatusIndicator';
import { FileItem, OperationQueue } from '../types/industrial';

interface PLCControllerProps {
  files: FileItem[];
  operations: OperationQueue[];
  selectedFile: FileItem | null;
  onSelectFile: (file: FileItem) => void;
  onCreateBackup: () => void;
  onValidatePermissions: () => void;
  onScanErrors: () => void;
  onOptimizeStorage: () => void;
  onResolveConflict: () => void;
  onViewHistory: () => void;
}

export function PLCController({
  files,
  operations,
  selectedFile,
  onSelectFile,
  onCreateBackup,
  onValidatePermissions,
  onScanErrors,
  onOptimizeStorage,
  onResolveConflict,
  onViewHistory,
}: PLCControllerProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'javascript':
      case 'typescript':
        return <FileCode className="text-industrial-blue" />;
      case 'json':
      case 'text':
        return <FileText className="text-industrial-amber" />;
      default:
        return <FileCode className="text-industrial-blue" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(date));
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'COPY_FILE':
        return <Settings className="w-4 h-4" />;
      case 'VALIDATE_PERM':
        return <Shield className="w-4 h-4" />;
      case 'BACKUP_DIR':
        return <Archive className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* PLC Control Header */}
      <div className="industrial-panel border-b border-gray-600 px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-mono font-semibold text-industrial-blue">PLC - DIRECTORY CONTROLLER</h2>
            <p className="text-xs text-gray-400">Programmable Logic Controller</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="industrial-button px-3 py-1 rounded text-xs font-mono">
              <StatusIndicator status="online" size="sm" animate />
              <span className="ml-2">AUTO MODE</span>
            </div>
            <div className="text-xs font-mono">
              <span className="text-gray-400">CYCLE TIME:</span>
              <span className="text-industrial-green ml-1">247ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operation Queue */}
      <div className="industrial-panel border-b border-gray-600 px-6 py-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-mono text-sm font-medium">OPERATION QUEUE</h3>
          <span className="text-xs font-mono text-gray-400">
            {operations.filter(op => op.status === 'pending').length} PENDING
          </span>
        </div>
        
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {operations.length > 0 ? (
            operations.slice(0, 3).map(operation => (
              <div
                key={operation.id}
                className="flex-shrink-0 industrial-button px-3 py-2 rounded-lg min-w-48"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {operation.status === 'running' ? (
                      <Settings className="w-4 h-4 animate-spin text-industrial-blue" />
                    ) : (
                      <StatusIndicator 
                        status={operation.status === 'completed' ? 'sync' : operation.status === 'failed' ? 'error' : 'warning'} 
                        size="sm" 
                      />
                    )}
                    <span className="font-mono text-xs">{operation.type}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {operation.status === 'running' ? `${operation.progress}%` : operation.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-gray-400 font-mono mt-1 truncate">
                  {operation.target}
                </div>
                {operation.status === 'running' && (
                  <Progress value={operation.progress} className="mt-2 h-1" />
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 text-xs font-mono py-2">
              No operations in queue
            </div>
          )}
        </div>
      </div>

      {/* Main File View */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* File List */}
          <div className="lg:col-span-2">
            <div className="industrial-panel rounded-lg h-full">
              <div className="border-b border-gray-600 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm font-medium">DIRECTORY CONTENTS</h3>
                  <div className="flex items-center space-x-2 text-xs font-mono">
                    <span className="text-gray-400">VIEW:</span>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      className="industrial-button px-2 py-1 text-xs"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-3 h-3" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      className="industrial-button px-2 py-1 text-xs"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {files.length > 0 ? (
                  <>
                    {/* File Table Header */}
                    <div className="grid grid-cols-12 gap-4 pb-2 border-b border-gray-700 text-xs font-mono text-gray-400">
                      <div className="col-span-6">NAME</div>
                      <div className="col-span-2">STATUS</div>
                      <div className="col-span-2">SIZE</div>
                      <div className="col-span-2">MODIFIED</div>
                    </div>

                    {/* File Rows */}
                    <div className="space-y-1 mt-2">
                      {files.map(file => (
                        <div
                          key={file.id}
                          className={`
                            grid grid-cols-12 gap-4 py-2 rounded cursor-pointer group transition-colors
                            ${selectedFile?.id === file.id ? 'bg-industrial-blue/20' : 'hover:bg-gray-700'}
                          `}
                          onClick={() => onSelectFile(file)}
                        >
                          <div className="col-span-6 flex items-center space-x-2">
                            {getFileIcon(file.type)}
                            <span className="font-mono text-sm">{file.name}</span>
                          </div>
                          <div className="col-span-2 flex items-center">
                            <StatusIndicator status={file.status} size="sm" />
                            <span className="text-xs font-mono text-gray-300 ml-2">
                              {file.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="col-span-2 flex items-center">
                            <span className="text-xs font-mono text-gray-300">
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                          <div className="col-span-2 flex items-center">
                            <span className="text-xs font-mono text-gray-300">
                              {formatTime(file.lastModified)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-400 text-sm font-mono py-8">
                    <FileCode className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No files in current directory
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* File Details Panel */}
          <div className="space-y-4">
            {/* Selected File Info */}
            <div className="industrial-panel rounded-lg p-4">
              <h3 className="font-mono text-sm font-medium mb-3">FILE PROPERTIES</h3>
              {selectedFile ? (
                <div className="space-y-3 text-xs font-mono">
                  <div>
                    <span className="text-gray-400">NAME:</span>
                    <span className="text-white ml-2">{selectedFile.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">TYPE:</span>
                    <span className="text-white ml-2">{selectedFile.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">SIZE:</span>
                    <span className="text-white ml-2">{formatFileSize(selectedFile.size)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">STATUS:</span>
                    <span className={`ml-2 ${
                      selectedFile.status === 'conflict' ? 'text-industrial-amber' : 
                      selectedFile.status === 'error' ? 'text-industrial-red' : 'text-white'
                    }`}>
                      {selectedFile.status === 'conflict' ? 'CONFLICT DETECTED' : selectedFile.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">LAST MOD:</span>
                    <span className="text-white ml-2">
                      {new Intl.DateTimeFormat('en-CA', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                      }).format(new Date(selectedFile.lastModified)).replace(',', '')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">CHECKSUM:</span>
                    <span className="text-white ml-2">{selectedFile.checksum}</span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {selectedFile.status === 'conflict' && (
                      <Button
                        size="sm"
                        className="w-full industrial-button font-mono text-xs"
                        onClick={onResolveConflict}
                      >
                        <Wrench className="w-3 h-3 mr-2" />
                        RESOLVE CONFLICT
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full industrial-button font-mono text-xs"
                      onClick={onViewHistory}
                    >
                      <History className="w-3 h-3 mr-2" />
                      VIEW HISTORY
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 text-xs font-mono py-4">
                  Select a file to view properties
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="industrial-panel rounded-lg p-4">
              <h3 className="font-mono text-sm font-medium mb-3">QUICK ACTIONS</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full industrial-button font-mono text-xs"
                  onClick={onCreateBackup}
                >
                  <Archive className="w-3 h-3 mr-2" />
                  BACKUP DIR
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full industrial-button font-mono text-xs"
                  onClick={onValidatePermissions}
                >
                  <Shield className="w-3 h-3 mr-2" />
                  CHECK PERMS
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full industrial-button font-mono text-xs"
                  onClick={onScanErrors}
                >
                  <Search className="w-3 h-3 mr-2" />
                  SCAN ERRORS
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full industrial-button font-mono text-xs"
                  onClick={onOptimizeStorage}
                >
                  <Zap className="w-3 h-3 mr-2" />
                  OPTIMIZE
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
