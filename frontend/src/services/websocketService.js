class WebSocketService {
  constructor() {
    this.connections = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect(orderId, onMessage, onError, onClose) {
    const wsUrl = `ws://https://trucking-logistic.onrender.com//ws/tracking/${orderId}/`;

    // Close existing connection for this order if any
    if (this.connections.has(orderId)) {
      this.connections.get(orderId).close();
    }

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`WebSocket connected for order ${orderId}`);
      this.reconnectAttempts = 0;
      this.connections.set(orderId, ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        onError(error);
      }
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error for order ${orderId}:`, error);
      onError(error);
    };

    ws.onclose = (event) => {
      console.log(`WebSocket closed for order ${orderId}:`, event.code, event.reason);
      this.connections.delete(orderId);

      // Attempt to reconnect if not a normal closure
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

        setTimeout(() => {
          this.connect(orderId, onMessage, onError, onClose);
        }, this.reconnectDelay * this.reconnectAttempts);
      } else {
        onClose(event);
      }
    };

    // Send ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);

    return ws;
  }

  disconnect(orderId) {
    if (this.connections.has(orderId)) {
      this.connections.get(orderId).close();
      this.connections.delete(orderId);
    }
  }

  disconnectAll() {
    this.connections.forEach((ws, orderId) => {
      ws.close();
    });
    this.connections.clear();
  }

  sendMessage(orderId, message) {
    if (this.connections.has(orderId)) {
      const ws = this.connections.get(orderId);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    }
  }

  isConnected(orderId) {
    return this.connections.has(orderId) &&
      this.connections.get(orderId).readyState === WebSocket.OPEN;
  }
}

export default new WebSocketService();


