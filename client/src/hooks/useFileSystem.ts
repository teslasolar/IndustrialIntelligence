import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { DirectoryItem, FileItem, OperationQueue, SystemAlarm, SystemMetrics } from '../types/industrial';
import { useWebSocket } from './useWebSocket';

export function useFileSystem() {
  const queryClient = useQueryClient();
  const { isConnected, sendMessage, onMessage } = useWebSocket('/ws');
  
  const [selectedDirectory, setSelectedDirectory] = useState<DirectoryItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [expandedDirectories, setExpandedDirectories] = useState<Set<number>>(new Set([1, 2, 3])); // Start with some expanded

  // Fetch directories
  const { data: directories = [], isLoading: directoriesLoading } = useQuery<DirectoryItem[]>({
    queryKey: ['/api/directories'],
  });

  // Fetch files for selected directory
  const { data: files = [], isLoading: filesLoading } = useQuery<FileItem[]>({
    queryKey: ['/api/directories', selectedDirectory?.id, 'files'],
    enabled: !!selectedDirectory,
  });

  // Fetch operations
  const { data: operations = [], isLoading: operationsLoading } = useQuery<OperationQueue[]>({
    queryKey: ['/api/operations'],
  });

  // Fetch alarms
  const { data: alarms = [], isLoading: alarmsLoading } = useQuery<SystemAlarm[]>({
    queryKey: ['/api/alarms'],
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Fetch metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<SystemMetrics>({
    queryKey: ['/api/metrics'],
    select: (data: SystemMetrics | SystemMetrics[]) => Array.isArray(data) ? data[0] : data,
  });

  // Create directory mutation
  const createDirectoryMutation = useMutation({
    mutationFn: async (directoryData: { name: string; path: string; parentId: number | null }) => {
      const response = await apiRequest('POST', '/api/directories', directoryData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/directories'] });
    },
  });

  // Create operation mutation
  const createOperationMutation = useMutation({
    mutationFn: async (operationData: { type: string; target: string; metadata?: any }) => {
      const response = await apiRequest('POST', '/api/operations', operationData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/operations'] });
    },
  });

  // Acknowledge alarm mutation
  const acknowledgeAlarmMutation = useMutation({
    mutationFn: async (alarmId: number) => {
      const response = await apiRequest('PUT', `/api/alarms/${alarmId}/acknowledge`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alarms'] });
    },
  });

  // WebSocket message handlers
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribers = [
      onMessage('INITIAL_DATA', (data) => {
        console.log('Received initial data:', data);
        // Update query cache with initial data
        if (data.directories) {
          queryClient.setQueryData(['/api/directories'], data.directories);
        }
        if (data.alarms) {
          queryClient.setQueryData(['/api/alarms'], data.alarms);
        }
        if (data.metrics) {
          queryClient.setQueryData(['/api/metrics'], data.metrics);
        }
        if (data.operations) {
          queryClient.setQueryData(['/api/operations'], data.operations);
        }
      }),

      onMessage('DIRECTORIES_UPDATE', (data) => {
        queryClient.setQueryData(['/api/directories'], data);
      }),

      onMessage('FILES_UPDATE', (data) => {
        if (selectedDirectory) {
          queryClient.setQueryData(['/api/directories', selectedDirectory.id, 'files'], data);
        }
      }),

      onMessage('METRICS_UPDATE', (data) => {
        queryClient.setQueryData(['/api/metrics'], data);
      }),

      onMessage('OPERATION_CREATED', (data) => {
        queryClient.setQueryData(['/api/operations'], (old: OperationQueue[] = []) => [...old, data]);
      }),

      onMessage('OPERATION_UPDATED', (data) => {
        queryClient.setQueryData(['/api/operations'], (old: OperationQueue[] = []) =>
          old.map(op => op.id === data.id ? data : op)
        );
      }),

      onMessage('ALARM_ACKNOWLEDGED', (data) => {
        queryClient.setQueryData(['/api/alarms'], (old: SystemAlarm[] = []) =>
          old.map(alarm => alarm.id === data.id ? data : alarm)
        );
      }),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [isConnected, onMessage, queryClient, selectedDirectory]);

  // Helper functions
  const toggleDirectory = (directoryId: number) => {
    setExpandedDirectories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(directoryId)) {
        newSet.delete(directoryId);
      } else {
        newSet.add(directoryId);
        // Request files for this directory
        sendMessage('GET_FILES', { directoryId });
      }
      return newSet;
    });
  };

  const selectDirectory = (directory: DirectoryItem) => {
    setSelectedDirectory(directory);
    sendMessage('GET_FILES', { directoryId: directory.id });
  };

  const selectFile = (file: FileItem) => {
    setSelectedFile(file);
  };

  const createDirectory = (name: string, parentPath: string, parentId: number | null) => {
    const path = parentPath === '/' ? `/${name}` : `${parentPath}/${name}`;
    createDirectoryMutation.mutate({ name, path, parentId });
  };

  const createOperation = (type: string, target: string, metadata?: any) => {
    createOperationMutation.mutate({ type, target, metadata });
  };

  const acknowledgeAlarm = (alarmId: number) => {
    acknowledgeAlarmMutation.mutate(alarmId);
    sendMessage('ACKNOWLEDGE_ALARM', { alarmId });
  };

  return {
    // Data
    directories,
    files,
    operations,
    alarms,
    metrics,
    selectedDirectory,
    selectedFile,
    expandedDirectories,
    
    // Loading states
    directoriesLoading,
    filesLoading,
    operationsLoading,
    alarmsLoading,
    metricsLoading,
    
    // Connection state
    isConnected,
    
    // Actions
    toggleDirectory,
    selectDirectory,
    selectFile,
    createDirectory,
    createOperation,
    acknowledgeAlarm,
    
    // Mutations
    createDirectoryMutation,
    createOperationMutation,
    acknowledgeAlarmMutation,
  };
}
