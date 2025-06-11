import { useState, useEffect, useCallback, useRef } from 'react';
import { WebSocketMessage } from '../types/industrial';

export function useWebSocket(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const messageHandlers = useRef<Map<string, (data: any) => void>>(new Map());

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
    const wsUrl = `${protocol}//${host}:${port}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setSocket(ws);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setSocket(null);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        // Handle date serialization for alarm and metrics data
        if (message.type === 'METRICS_UPDATE' && message.data) {
          message.data = {
            ...message.data,
            timestamp: message.data.timestamp ? new Date(message.data.timestamp) : new Date()
          };
        }
        
        if (message.type === 'ALARM_ACKNOWLEDGED' && message.data) {
          message.data = {
            ...message.data,
            createdAt: message.data.createdAt ? new Date(message.data.createdAt) : new Date()
          };
        }
        
        if (message.type === 'INITIAL_DATA' && message.data) {
          // Fix dates in initial data
          if (message.data.alarms) {
            message.data.alarms = message.data.alarms.map((alarm: any) => ({
              ...alarm,
              createdAt: alarm.createdAt ? new Date(alarm.createdAt) : new Date()
            }));
          }
          if (message.data.metrics) {
            message.data.metrics = {
              ...message.data.metrics,
              timestamp: message.data.metrics.timestamp ? new Date(message.data.metrics.timestamp) : new Date()
            };
          }
        }
        
        setLastMessage(message);
        
        const handler = messageHandlers.current.get(message.type);
        if (handler) {
          handler(message.data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = useCallback((type: string, data?: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify({ type, data }));
    }
  }, [socket, isConnected]);

  const onMessage = useCallback((type: string, handler: (data: any) => void) => {
    messageHandlers.current.set(type, handler);
    
    return () => {
      messageHandlers.current.delete(type);
    };
  }, []);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    onMessage,
  };
}
