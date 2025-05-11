import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { query } from './db/db';

interface StoryBlock {
  id: string;
  content: string;
  storyId: number;
  order: number;
  lockedBy: string | null;
  lastEditedAt: Date;
  lastEditedBy: string | null;
}

interface WebSocketMessage {
  type: 'lock_block' | 'unlock_block' | 'update_block' | 'typing' | 'stop_typing' | 'connected' | 'error' | 'ping' | 'update_story_content' | 'story_content_updated';
  blockId?: string;
  content?: string;
  storyId?: number;
  userId?: number;
  username?: string;
  message?: string;
  lastEditedAt?: string;
  last_edited_by_name?: string;
}

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  username?: string;
  isAlive: boolean;
}

interface AuthenticatedIncomingMessage extends IncomingMessage {
  userId?: number;
  username?: string;
}

class CollaborativeEditingServer {
  private wss: WebSocketServer;
  private activeBlocks: Map<string, { userId: number; username: string }> = new Map();
  private typingUsers: Map<number, Set<string>> = new Map(); // storyId -> Set of usernames

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      verifyClient: async (info: { req: AuthenticatedIncomingMessage }, callback) => {
        try {
          const url = new URL(info.req.url!, `ws://${info.req.headers.host}`);
          const token = url.searchParams.get('token');
          
          if (!token) {
            callback(false, 401, 'Authentication token required');
            return;
          }

          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
          info.req.userId = decoded.id;
          info.req.username = decoded.username;
          callback(true);
        } catch (error) {
          console.error('WebSocket authentication error:', error);
          callback(false, 401, 'Invalid authentication token');
        }
      }
    });

    console.log('WebSocket server initialized at /ws endpoint');
    this.setupWebSocketServer();
    this.startHeartbeat();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', async (ws: AuthenticatedWebSocket, request: AuthenticatedIncomingMessage) => {
      try {
        // Token is already verified in verifyClient
        ws.userId = request.userId;
        ws.username = request.username;
        ws.isAlive = true;

        console.log(`User connected to WebSocket: ${ws.username} (${ws.userId})`);

        // Set up ping-pong for connection monitoring
        ws.on('pong', () => {
          ws.isAlive = true;
        });

        // Handle messages
        ws.on('message', (data: string) => {
          try {
            this.handleMessage(ws, data);
          } catch (error) {
            console.error('Error handling WebSocket message:', error);
            ws.send(JSON.stringify({ type: 'error', message: 'Failed to process message' }));
          }
        });

        // Handle disconnection
        ws.on('close', () => {
          console.log(`User disconnected from WebSocket: ${ws.username} (${ws.userId})`);
          this.handleDisconnection(ws);
        });

        // Send initial connection success message
        ws.send(JSON.stringify({ type: 'connected', userId: ws.userId, username: ws.username }));

      } catch (error) {
        console.error('WebSocket connection setup error:', error);
        ws.close(1011, 'Internal server error');
      }
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });
  }

  private async handleMessage(ws: AuthenticatedWebSocket, data: string) {
    try {
      const message = JSON.parse(data);
      console.log('Received WebSocket message:', message);
      switch (message.type) {
        case 'ping':
          // Just update isAlive, no response needed
          ws.isAlive = true;
          break;

        case 'lock_block':
          if (message.blockId) {
            await this.lockBlock(message.blockId, ws.userId!, ws.username!);
            this.broadcastToStory(message.storyId!, {
              type: 'lock_block',
              blockId: message.blockId,
              userId: ws.userId,
              username: ws.username
            });
          }
          break;

        case 'unlock_block':
          if (message.blockId) {
            await this.unlockBlock(message.blockId, ws.userId!);
            this.broadcastToStory(message.storyId!, {
              type: 'unlock_block',
              blockId: message.blockId
            });
          }
          break;

        case 'update_block':
          if (message.blockId && message.content) {
            await this.updateBlock(message.blockId, message.content, ws.userId!);
            this.broadcastToStory(message.storyId!, {
              type: 'update_block',
              blockId: message.blockId,
              content: message.content,
              userId: ws.userId,
              username: ws.username
            });
          }
          break;

        case 'typing':
          if (message.storyId) {
            this.addTypingUser(message.storyId, ws.username!);
            this.broadcastToStory(message.storyId, {
              type: 'typing',
              username: ws.username
            });
          }
          break;

        case 'stop_typing':
          if (message.storyId) {
            this.removeTypingUser(message.storyId, ws.username!);
            this.broadcastToStory(message.storyId, {
              type: 'stop_typing',
              username: ws.username
            });
          }
          break;

        case 'update_story_content':
          console.log('[update_story_content] Incoming:', {
            storyId: message.storyId,
            content: message.content,
            userId: message.userId,
            username: message.username
          });
          if (message.storyId && typeof message.content === 'string') {
            try {
              console.log('[update_story_content] Editing by userId:', message.userId, 'username:', message.username);
              const result = await query(
                'UPDATE stories SET content = $1, last_edited_by = $2, last_edited_at = NOW() WHERE id = $3 RETURNING last_edited_at',
                [message.content, message.userId, message.storyId]
              );
              const lastEditedAt = result.rows[0]?.last_edited_at || new Date().toISOString();
              // Fetch the username for last_edited_by
              let lastEditedByName = message.username;
              try {
                const userResult = await query('SELECT username FROM users WHERE id = $1', [message.userId]);
                console.log('[update_story_content] DB username for userId', message.userId, ':', userResult.rows[0]?.username);
                lastEditedByName = userResult.rows[0]?.username || message.username;
              } catch (e) {
                // fallback to message.username
              }
              this.broadcastToStory(message.storyId, {
                type: 'story_content_updated',
                storyId: message.storyId,
                content: message.content,
                lastEditedAt,
                userId: message.userId,
                username: message.username,
                last_edited_by_name: lastEditedByName
              });
            } catch (err: any) {
              console.error('[update_story_content] Query error:', err);
              ws.send(JSON.stringify({ type: 'error', message: 'Failed to update story content', details: err.message }));
            }
          } else {
            console.error('[update_story_content] Missing storyId or content:', message);
            ws.send(JSON.stringify({ type: 'error', message: 'Missing storyId or content' }));
          }
          break;
      }
    } catch (error: any) {
      console.error('Error handling message:', error, data);
      ws.send(JSON.stringify({ 
        type: 'error',
        message: 'Failed to process message',
        details: error.message
      }));
    }
  }

  private async lockBlock(blockId: string, userId: number, username: string) {
    try {
      await query(
        'UPDATE story_blocks SET locked_by = $1, locked_at = NOW() WHERE id = $2 AND (locked_by IS NULL OR locked_at < NOW() - INTERVAL \'5 minutes\')',
        [userId, blockId]
      );
      this.activeBlocks.set(blockId, { userId, username });
    } catch (error) {
      console.error('Error locking block:', error);
      // If the table doesn't exist yet, just track the lock in memory
      this.activeBlocks.set(blockId, { userId, username });
    }
  }

  private async unlockBlock(blockId: string, userId: number) {
    try {
      await query(
        'UPDATE story_blocks SET locked_by = NULL, locked_at = NULL WHERE id = $1 AND locked_by = $2',
        [blockId, userId]
      );
      this.activeBlocks.delete(blockId);
    } catch (error) {
      console.error('Error unlocking block:', error);
      // If the table doesn't exist yet, just remove the lock from memory
      this.activeBlocks.delete(blockId);
    }
  }

  private async updateBlock(blockId: string, content: string, userId: number) {
    try {
      // First, save the current version
      await query(
        'INSERT INTO block_versions (block_id, content, edited_by) VALUES ($1, (SELECT content FROM story_blocks WHERE id = $1), $2)',
        [blockId, userId]
      );

      // Then update the block
      await query(
        'UPDATE story_blocks SET content = $1, last_edited_by = $2, last_edited_at = NOW() WHERE id = $3',
        [content, userId, blockId]
      );
    } catch (error) {
      console.error('Error updating block:', error);
      // If the table doesn't exist yet, we'll just broadcast the update
      // The content will be saved when the table is created
    }
  }

  private addTypingUser(storyId: number, username: string) {
    if (!this.typingUsers.has(storyId)) {
      this.typingUsers.set(storyId, new Set());
    }
    this.typingUsers.get(storyId)!.add(username);
  }

  private removeTypingUser(storyId: number, username: string) {
    if (this.typingUsers.has(storyId)) {
      this.typingUsers.get(storyId)!.delete(username);
    }
  }

  private broadcastToStory(storyId: number, message: WebSocketMessage) {
    this.wss.clients.forEach((client) => {
      const authClient = client as AuthenticatedWebSocket;
      if (authClient.readyState === WebSocket.OPEN) {
        authClient.send(JSON.stringify(message));
      }
    });
  }

  private handleDisconnection(ws: AuthenticatedWebSocket) {
    if (!ws.userId) return; // Skip if already disconnected
    
    console.log(`User disconnected: ${ws.username} (${ws.userId})`);
    
    // Release all blocks locked by this user
    this.activeBlocks.forEach(async (value, blockId) => {
      if (value.userId === ws.userId) {
        await this.unlockBlock(blockId, ws.userId!);
        this.broadcastToStory(0, {
          type: 'unlock_block',
          blockId: blockId
        });
      }
    });

    // Remove user from typing indicators
    this.typingUsers.forEach((users, storyId) => {
      if (ws.username && users.has(ws.username)) {
        this.removeTypingUser(storyId, ws.username);
        this.broadcastToStory(storyId, {
          type: 'stop_typing',
          username: ws.username
        });
      }
    });
  }

  private startHeartbeat() {
    const interval = setInterval(() => {
      (this.wss.clients as Set<AuthenticatedWebSocket>).forEach((ws) => {
        if (!ws.isAlive) {
          ws.terminate();
          return;
        }
        
        ws.isAlive = false;
        ws.ping(() => {
          ws.isAlive = true;
        });
      });
    }, 15000); // Check every 15 seconds

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }
}

export default CollaborativeEditingServer; 