
import express, { Request, Response } from 'express';
import { liveChatService } from '../services/LiveChatService.js';

const router = express.Router();

// Get all chat rooms
router.get('/rooms', (req: Request, res: Response) => {
  const rooms = liveChatService.getAllRooms();
  
  res.json({
    success: true,
    rooms: rooms.map(r => ({
      id: r.id,
      name: r.name,
      participantCount: r.participants.size,
      messageCount: r.messages.length
    })),
    fccEntity: '20130314143016'
  });
});

// Join a chat room
router.post('/rooms/:roomId/join', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'userId is required'
    });
  }

  const joined = liveChatService.joinRoom(userId, roomId);

  if (!joined) {
    return res.status(404).json({
      success: false,
      error: 'Room not found'
    });
  }

  res.json({
    success: true,
    message: 'Joined room successfully',
    roomId,
    fccEntity: '20130314143016'
  });
});

// Send a message
router.post('/rooms/:roomId/messages', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { userId, username, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({
      success: false,
      error: 'userId and message are required'
    });
  }

  const chatMessage = liveChatService.sendMessage(userId, username || 'Anonymous', roomId, message);

  if (!chatMessage) {
    return res.status(400).json({
      success: false,
      error: 'Failed to send message. User may not be in room.'
    });
  }

  res.json({
    success: true,
    message: chatMessage,
    fccEntity: '20130314143016'
  });
});

// Get room messages
router.get('/rooms/:roomId/messages', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;

  const messages = liveChatService.getRoomMessages(roomId, limit);

  res.json({
    success: true,
    roomId,
    messages,
    count: messages.length,
    fccEntity: '20130314143016'
  });
});

export default router;
