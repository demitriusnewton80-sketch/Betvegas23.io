
import { EventEmitter } from 'events';

interface SmartMessage {
  id: string;
  channel: string;
  payload: any;
  timestamp: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  retryCount: number;
  maxRetries: number;
}

class SmartCommunication extends EventEmitter {
  private static instance: SmartCommunication;
  private messageQueue: Map<string, SmartMessage> = new Map();
  private failedMessages: Map<string, SmartMessage> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.startProcessing();
  }

  static getInstance(): SmartCommunication {
    if (!SmartCommunication.instance) {
      SmartCommunication.instance = new SmartCommunication();
    }
    return SmartCommunication.instance;
  }

  // Send message with automatic retry
  sendMessage(channel: string, payload: any, priority: SmartMessage['priority'] = 'medium') {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const message: SmartMessage = {
      id: messageId,
      channel,
      payload,
      timestamp: Date.now(),
      priority,
      retryCount: 0,
      maxRetries: 3
    };

    this.messageQueue.set(messageId, message);
    console.log(`📤 Queued message: ${channel} (Priority: ${priority})`);
    
    return messageId;
  }

  private startProcessing() {
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 1000);
  }

  private async processQueue() {
    const messages = Array.from(this.messageQueue.values())
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    for (const message of messages) {
      try {
        await this.deliverMessage(message);
        this.messageQueue.delete(message.id);
        console.log(`✅ Message delivered: ${message.channel}`);
      } catch (error) {
        message.retryCount++;
        
        if (message.retryCount >= message.maxRetries) {
          console.error(`❌ Message failed after ${message.maxRetries} retries: ${message.channel}`);
          this.messageQueue.delete(message.id);
          this.failedMessages.set(message.id, message);
          this.emit('message:failed', message);
        } else {
          console.log(`🔄 Retry ${message.retryCount}/${message.maxRetries} for: ${message.channel}`);
        }
      }
    }
  }

  private async deliverMessage(message: SmartMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Emit message to listeners
        this.emit(`channel:${message.channel}`, message.payload);
        this.emit('message:delivered', message);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Get communication stats
  getStats() {
    return {
      queuedMessages: this.messageQueue.size,
      failedMessages: this.failedMessages.size,
      totalProcessed: this.messageQueue.size + this.failedMessages.size,
      timestamp: Date.now()
    };
  }

  // Retry failed messages
  retryFailedMessages() {
    console.log(`🔄 Retrying ${this.failedMessages.size} failed messages...`);
    
    this.failedMessages.forEach((message) => {
      message.retryCount = 0;
      this.messageQueue.set(message.id, message);
    });
    
    this.failedMessages.clear();
  }

  shutdown() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }
}

export const smartCommunication = SmartCommunication.getInstance();
