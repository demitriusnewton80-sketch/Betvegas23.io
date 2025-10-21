
import { EventEmitter } from 'events';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  max_tokens?: number;
  temperature?: number;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class OpenAIService extends EventEmitter {
  private apiKey: string;
  private apiUrl = 'https://api.openai.com/v1/chat/completions';
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second rate limiting

  constructor() {
    super();
    this.apiKey = process.env.OPENAI_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ OPENAI_API_KEY not found in environment variables');
    } else {
      console.log('✅ OpenAI Service initialized');
    }
  }

  hasValidApiKey(): boolean {
    return this.apiKey.length > 0;
  }

  async getChatCompletion(
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    } = {}
  ): Promise<{ success: boolean; content?: string; error?: string; usage?: any }> {
    if (!this.hasValidApiKey()) {
      return {
        success: false,
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to Secrets.'
      };
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => 
        setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      );
    }

    const messages: OpenAIMessage[] = [];
    
    if (options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt
      });
    }

    messages.push({
      role: 'user',
      content: prompt
    });

    const requestBody: OpenAIRequest = {
      model: options.model || 'gpt-3.5-turbo',
      messages,
      max_tokens: options.maxTokens || 150,
      temperature: options.temperature || 0.7
    };

    try {
      this.lastRequestTime = Date.now();
      this.requestCount++;

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
      }

      const data: OpenAIResponse = await response.json();
      const content = data.choices[0]?.message?.content || 'No response';

      this.emit('completionGenerated', {
        requestCount: this.requestCount,
        model: data.model,
        usage: data.usage
      });

      return {
        success: true,
        content,
        usage: data.usage
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emit('error', { error: errorMessage });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async analyzeSportsPrediction(matchup: string): Promise<{ success: boolean; analysis?: string; error?: string }> {
    const systemPrompt = `You are a sports betting analyst. Provide concise, data-driven predictions for sports matchups. Include win probability, key factors, and betting recommendations.`;

    return await this.getChatCompletion(matchup, {
      systemPrompt,
      maxTokens: 300,
      model: 'gpt-3.5-turbo'
    });
  }

  async analyzeBettingPattern(userHistory: string): Promise<{ success: boolean; analysis?: string; error?: string }> {
    const systemPrompt = `You are a betting behavior analyst. Analyze betting patterns and provide risk assessment and strategic recommendations.`;

    return await this.getChatCompletion(userHistory, {
      systemPrompt,
      maxTokens: 250,
      model: 'gpt-3.5-turbo'
    });
  }

  async generateBettingContent(topic: string): Promise<{ success: boolean; content?: string; error?: string }> {
    const systemPrompt = `You are a sports betting content writer. Generate informative, engaging content about sports betting strategies and insights.`;

    return await this.getChatCompletion(topic, {
      systemPrompt,
      maxTokens: 400,
      model: 'gpt-3.5-turbo'
    });
  }

  getStats() {
    return {
      requestCount: this.requestCount,
      hasApiKey: this.hasValidApiKey(),
      lastRequestTime: this.lastRequestTime
    };
  }
}

export const openAIService = new OpenAIService();
