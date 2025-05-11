interface WebSocketMessage {
  type: 'lock_block' | 'unlock_block' | 'update_block' | 'typing' | 'stop_typing' | 'connected' | 'error' | 'ping' | 'update_story_content' | 'story_content_updated';
  blockId?: string;
  content?: string;
  storyId?: number;
  userId?: number;
  username?: string;
  message?: string;
  lastEditedAt?: string;
}

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000; // Start with 1 second
  private pingInterval: NodeJS.Timeout | null = null;
  private token: string | null = null;
  private isDisconnecting = false;

  private constructor() {
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    // Listen for beforeunload to cleanup
    window.addEventListener('beforeunload', () => this.disconnect());
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      // Page is hidden, mark as disconnecting but don't actually disconnect
      this.isDisconnecting = true;
    } else {
      // Page is visible again, reconnect if we were disconnecting
      if (this.isDisconnecting && this.token) {
        this.isDisconnecting = false;
        this.connect(this.token);
      }
    }
  };

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private clearPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public connect(token: string) {
    // Store token for reconnection
    this.token = token;
    this.isDisconnecting = false;

    // If already connected with the same token, don't reconnect
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    // If connecting or closing, wait for the state to change
    if (this.ws?.readyState === WebSocket.CONNECTING || this.ws?.readyState === WebSocket.CLOSING) {
      return;
    }

    // Clear any existing connection
    this.disconnect(true);

    const wsUrl =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `ws://localhost:3001/ws?token=${token}`
        : `wss://storytelling-app.onrender.com/ws?token=${token}`;
    console.log('Connecting to WebSocket at:', wsUrl);
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected successfully');
        this.reconnectAttempts = 0;
        this.reconnectTimeout = 1000;
        
        // Set up ping interval to keep connection alive
        this.clearPingInterval();
        this.pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 10000);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('Received WebSocket message:', message);
          
          if (message.type === 'error') {
            console.error('Server error:', message.message);
            return;
          }
          
          this.messageHandlers.forEach(handler => handler(message));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.clearPingInterval();
        
        // Only attempt to reconnect if:
        // 1. We have a stored token
        // 2. We're not intentionally disconnecting
        // 3. It's an abnormal closure (1006) or unexpected closure
        // 4. We haven't reached max reconnect attempts
        if (this.token && 
            !this.isDisconnecting &&
            (event.code === 1006 || (event.code !== 1000 && event.code !== 1001)) && 
            this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect(this.token);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Don't attempt to reconnect here, let onclose handle it
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      if (this.token && !this.isDisconnecting) {
        this.attemptReconnect(this.token);
      }
    }
  }

  private attemptReconnect(token: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      this.reconnectAttempts++;
      this.reconnectTimeout *= 2; // Exponential backoff
      this.connect(token);
    }, this.reconnectTimeout);
  }

  public addMessageHandler(handler: MessageHandler) {
    this.messageHandlers.add(handler);
  }

  public removeMessageHandler(handler: MessageHandler) {
    this.messageHandlers.delete(handler);
  }

  public sendMessage(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  public disconnect(isReconnecting = false) {
    if (!isReconnecting) {
      this.token = null;
      this.isDisconnecting = true;
    }
    this.clearPingInterval();
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.ws.close(1000, 'Normal closure');
      this.ws = null;
    }
  }

  // Convenience methods for common operations
  public lockBlock(blockId: string, storyId: number) {
    this.sendMessage({
      type: 'lock_block',
      blockId,
      storyId
    });
  }

  public unlockBlock(blockId: string, storyId: number) {
    this.sendMessage({
      type: 'unlock_block',
      blockId,
      storyId
    });
  }

  public updateBlock(blockId: string, content: string, storyId: number) {
    this.sendMessage({
      type: 'update_block',
      blockId,
      content,
      storyId
    });
  }

  public startTyping(storyId: number) {
    this.sendMessage({
      type: 'typing',
      storyId
    });
  }

  public stopTyping(storyId: number) {
    this.sendMessage({
      type: 'stop_typing',
      storyId
    });
  }
}

export default WebSocketService; 