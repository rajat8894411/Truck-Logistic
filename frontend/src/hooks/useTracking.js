import { useState, useEffect, useCallback, useRef } from 'react';
import websocketService from '../services/websocketService';

const useTracking = (orderId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locations, setLocations] = useState([]);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case 'initial_data':
        setOrder(data.data.order);
        setCurrentLocation(data.data.current_location);
        setLocations(data.data.recent_locations);
        setIsLoading(false);
        break;
        
      case 'location_update':
        setCurrentLocation(data.data);
        setLocations(prev => [data.data, ...prev.slice(0, 49)]); // Keep last 50 locations
        break;
        
      case 'order_status_update':
        setOrder(prev => ({ ...prev, ...data.data }));
        break;
        
      case 'locations':
        setLocations(data.data);
        break;
        
      case 'error':
        setError(data.message);
        break;
        
      case 'pong':
        // Connection is alive
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  }, []);

  const handleError = useCallback((error) => {
    console.error('WebSocket error:', error);
    setError('Connection error occurred');
  }, []);

  const handleClose = useCallback((event) => {
    console.log('WebSocket closed:', event);
    setIsConnected(false);
    
    if (event.code !== 1000) {
      setError('Connection lost. Attempting to reconnect...');
    }
  }, []);

  const connect = useCallback(() => {
    if (!orderId) return;
    
    setError(null);
    setIsLoading(true);
    
    try {
      wsRef.current = websocketService.connect(
        orderId,
        handleMessage,
        handleError,
        handleClose
      );
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        setError(null);
      };
      
    } catch (error) {
      console.error('Failed to connect:', error);
      setError('Failed to establish connection');
      setIsLoading(false);
    }
  }, [orderId, handleMessage, handleError, handleClose]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      websocketService.disconnect(orderId);
      wsRef.current = null;
    }
    setIsConnected(false);
  }, [orderId]);

  const requestLocations = useCallback(() => {
    if (isConnected) {
      websocketService.sendMessage(orderId, { type: 'get_locations' });
    }
  }, [orderId, isConnected]);

  // Auto-connect when orderId changes
  useEffect(() => {
    if (orderId) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [orderId, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    currentLocation,
    locations,
    order,
    error,
    isLoading,
    connect,
    disconnect,
    requestLocations
  };
};

export default useTracking;
