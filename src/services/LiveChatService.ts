
import { EventEmitter } from 'events';

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  roomId: string;
  gameId?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  gameId?: string;
  participants: Set<string>;
  messages: ChatMessage[];
}

class LiveChatService extends EventEmitter {
  private rooms: Map<string, ChatRoom> = new Map();
  private userRooms: Map<string, Set<string>> = new Map();

  constructor() {
    super();
    this.initializeDefaultRooms();
  }

  private initializeDefaultRooms() {
    const defaultRooms = [
      { id: 'general', name: 'General Discussion' },
      { id: 'nfl', name: 'NFL Chat' },
      { id: 'nba', name: 'NBA Chat' },
      { id: 'mlb', name: 'MLB Chat' },
      { id: 'soccer', name: 'Soccer Chat' }
    ];

    defaultRooms.forEach(room => {
      this.rooms.set(room.id, {
        ...room,
        participants: new Set(),
        messages: []
      });
    });
  }

  joinRoom(userId: string, roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.participants.add(userId);
    
    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, new Set());
    }
    this.userRooms.get(userId)!.add(roomId);

    this.emit('user:joined', { userId, roomId });
    return true;
  }

  leaveRoom(userId: string, roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.participants.delete(userId);
    this.userRooms.get(userId)?.delete(roomId);

    this.emit('user:left', { userId, roomId });
    return true;
  }

  sendMessage(userId: string, username: string, roomId: string, message: string): ChatMessage | null {
    const room = this.rooms.get(roomId);
    if (!room || !room.participants.has(userId)) return null;

    const chatMessage: ChatMessage = {
      id: `msg_${Date.now()}_${userId}`,
      userId,
      username,
      message,
      timestamp: new Date(),
      roomId
    };

    room.messages.push(chatMessage);
    
    // Keep only last 100 messages
    if (room.messages.length > 100) {
      room.messages = room.messages.slice(-100);
    }

    this.emit('message:new', chatMessage);
    return chatMessage;
  }

  getRoomMessages(roomId: string, limit: number = 50): ChatMessage[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return room.messages.slice(-limit);
  }

  getAllRooms(): ChatRoom[] {
    return Array.from(this.rooms.values()).map(room => ({
      ...room,
      participants: new Set(room.participants)
    }));
  }

  getRoomInfo(roomId: string): ChatRoom | null {
    const room = this.rooms.get(roomId);
    return room ? { ...room, participants: new Set(room.participants) } : null;
  }
}

export const liveChatService = new LiveChatService();
