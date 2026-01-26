/**
 * Framework B - Chat Service
 * Manage conversations and integrate with RAG Engine
 */

import type {
  Conversation,
  ConversationMessage,
  QueryRequest,
  RAGResponse,
} from '../../types/rag.types';

import type { RAGEngine } from '../rag/RAGEngine';

export interface ChatServiceConfig {
  /** Maximum conversation history length */
  maxHistoryLength: number;
  /** Enable conversation persistence */
  enablePersistence: boolean;
  /** Auto-save interval in ms (0 = disabled) */
  autoSaveInterval: number;
  /** Maximum conversations to keep in memory */
  maxConversationsInMemory: number;
}

export interface SendMessageRequest {
  /** User message */
  message: string;
  /** Conversation ID (optional for new conversation) */
  conversationId?: string;
  /** User ID */
  userId?: string;
  /** Context filters */
  context?: {
    projectId?: string;
    supplierId?: string;
    metadata?: Record<string, any>;
  };
  /** RAG options */
  ragOptions?: {
    topK?: number;
    minScore?: number;
    model?: string;
    temperature?: number;
  };
}

export interface SendMessageResponse {
  /** AI response */
  message: ConversationMessage;
  /** Conversation ID */
  conversationId: string;
  /** Full conversation */
  conversation: Conversation;
  /** RAG metadata */
  metadata?: RAGResponse['metadata'];
}

export class ChatService {
  private ragEngine: RAGEngine;
  private config: ChatServiceConfig;
  private conversations: Map<string, Conversation>;
  private autoSaveTimer: NodeJS.Timeout | null = null;

  constructor(ragEngine: RAGEngine, config?: Partial<ChatServiceConfig>) {
    this.ragEngine = ragEngine;
    this.config = {
      maxHistoryLength: 20,
      enablePersistence: false,
      autoSaveInterval: 0,
      maxConversationsInMemory: 100,
      ...config,
    };

    this.conversations = new Map();

    // Start auto-save if enabled
    if (this.config.autoSaveInterval > 0) {
      this.startAutoSave();
    }
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      // Get or create conversation
      let conversation = request.conversationId
        ? this.conversations.get(request.conversationId)
        : null;

      if (!conversation) {
        conversation = this.createConversation(request.userId, request.context);
      }

      // Add user message to conversation
      const userMessage: ConversationMessage = {
        role: 'user',
        content: request.message,
        timestamp: new Date().toISOString(),
      };

      conversation.messages.push(userMessage);

      // Build RAG request
      const ragRequest: QueryRequest = {
        question: request.message,
        context: {
          conversationId: conversation.id,
          projectId: request.context?.projectId || conversation.metadata?.projectId,
          supplierId: request.context?.supplierId || conversation.metadata?.supplierId,
          metadata: request.context?.metadata,
        },
        retrievalOptions: {
          topK: request.ragOptions?.topK,
          minScore: request.ragOptions?.minScore,
        },
        llmOptions: {
          model: request.ragOptions?.model,
          temperature: request.ragOptions?.temperature,
        },
      };

      // Get answer from RAG engine
      const ragResponse = await this.ragEngine.answer(ragRequest);

      // Create assistant message
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: ragResponse.answer,
        timestamp: new Date().toISOString(),
        citations: ragResponse.citations,
      };

      conversation.messages.push(assistantMessage);
      conversation.updatedAt = new Date().toISOString();

      // Trim conversation if too long
      if (conversation.messages.length > this.config.maxHistoryLength * 2) {
        conversation.messages = conversation.messages.slice(-this.config.maxHistoryLength * 2);
      }

      // Update conversation in storage
      this.conversations.set(conversation.id, conversation);

      // Check memory limit
      this.enforceMemoryLimit();

      return {
        message: assistantMessage,
        conversationId: conversation.id,
        conversation,
        metadata: ragResponse.metadata,
      };
    } catch (error) {
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Regenerate last response
   */
  async regenerateResponse(conversationId: string): Promise<SendMessageResponse> {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    // Remove last assistant message
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      conversation.messages.pop();
    }

    // Get last user message
    const lastUserMessage = [...conversation.messages]
      .reverse()
      .find(msg => msg.role === 'user');

    if (!lastUserMessage) {
      throw new Error('No user message found to regenerate response');
    }

    // Send the message again
    return await this.sendMessage({
      message: lastUserMessage.content,
      conversationId,
      context: conversation.metadata,
    });
  }

  /**
   * Create a new conversation
   */
  createConversation(userId?: string, metadata?: Record<string, any>): Conversation {
    const conversation: Conversation = {
      id: this.generateConversationId(),
      userId,
      messages: [],
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  /**
   * Get conversation by ID
   */
  getConversation(conversationId: string): Conversation | null {
    return this.conversations.get(conversationId) || null;
  }

  /**
   * Get all conversations for a user
   */
  getUserConversations(userId: string): Conversation[] {
    return Array.from(this.conversations.values())
      .filter(conv => conv.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Get recent conversations
   */
  getRecentConversations(limit: number = 10): Conversation[] {
    return Array.from(this.conversations.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }

  /**
   * Clear conversation messages
   */
  clearConversation(conversationId: string): void {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    conversation.messages = [];
    conversation.updatedAt = new Date().toISOString();
    this.conversations.set(conversationId, conversation);
  }

  /**
   * Delete conversation
   */
  deleteConversation(conversationId: string): boolean {
    return this.conversations.delete(conversationId);
  }

  /**
   * Delete all conversations for a user
   */
  deleteUserConversations(userId: string): number {
    const userConversations = this.getUserConversations(userId);
    let deleted = 0;

    for (const conversation of userConversations) {
      if (this.conversations.delete(conversation.id)) {
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Update conversation metadata
   */
  updateConversationMetadata(
    conversationId: string,
    metadata: Record<string, any>
  ): Conversation {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    conversation.metadata = {
      ...conversation.metadata,
      ...metadata,
    };
    conversation.updatedAt = new Date().toISOString();

    this.conversations.set(conversationId, conversation);
    return conversation;
  }

  /**
   * Search conversations by content
   */
  searchConversations(query: string, userId?: string): Conversation[] {
    const lowerQuery = query.toLowerCase();

    return Array.from(this.conversations.values())
      .filter(conv => {
        // Filter by user if specified
        if (userId && conv.userId !== userId) {
          return false;
        }

        // Search in messages
        return conv.messages.some(msg =>
          msg.content.toLowerCase().includes(lowerQuery)
        );
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Get conversation statistics
   */
  getConversationStats(conversationId: string): {
    messageCount: number;
    userMessageCount: number;
    assistantMessageCount: number;
    avgMessageLength: number;
    duration: number;
  } {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    const userMessages = conversation.messages.filter(m => m.role === 'user');
    const assistantMessages = conversation.messages.filter(m => m.role === 'assistant');
    const avgLength = conversation.messages.reduce((sum, m) => sum + m.content.length, 0) / conversation.messages.length || 0;

    const duration = new Date(conversation.updatedAt).getTime() - new Date(conversation.createdAt).getTime();

    return {
      messageCount: conversation.messages.length,
      userMessageCount: userMessages.length,
      assistantMessageCount: assistantMessages.length,
      avgMessageLength: Math.round(avgLength),
      duration,
    };
  }

  /**
   * Export conversation to JSON
   */
  exportConversation(conversationId: string): string {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    return JSON.stringify(conversation, null, 2);
  }

  /**
   * Import conversation from JSON
   */
  importConversation(json: string): Conversation {
    try {
      const conversation: Conversation = JSON.parse(json);

      // Validate conversation structure
      if (!conversation.id || !Array.isArray(conversation.messages)) {
        throw new Error('Invalid conversation format');
      }

      // Generate new ID to avoid conflicts
      conversation.id = this.generateConversationId();
      conversation.createdAt = new Date().toISOString();
      conversation.updatedAt = new Date().toISOString();

      this.conversations.set(conversation.id, conversation);
      return conversation;
    } catch (error) {
      throw new Error(`Failed to import conversation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate unique conversation ID
   */
  private generateConversationId(): string {
    return `conv-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Enforce memory limit for conversations
   */
  private enforceMemoryLimit(): void {
    if (this.conversations.size <= this.config.maxConversationsInMemory) {
      return;
    }

    // Get oldest conversations
    const conversations = Array.from(this.conversations.values())
      .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

    // Remove oldest conversations
    const toRemove = conversations.slice(0, conversations.length - this.config.maxConversationsInMemory);

    for (const conversation of toRemove) {
      this.conversations.delete(conversation.id);
    }
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(() => {
      this.saveConversations();
    }, this.config.autoSaveInterval);
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Save conversations to persistent storage
   * Override this method to implement custom persistence
   */
  protected async saveConversations(): Promise<void> {
    // Default implementation: no-op
    // Override in subclass to implement database persistence
    if (this.config.enablePersistence) {
      console.log('Saving conversations to persistent storage...');
      // Implement your persistence logic here (e.g., save to database)
    }
  }

  /**
   * Load conversations from persistent storage
   * Override this method to implement custom persistence
   */
  protected async loadConversations(): Promise<void> {
    // Default implementation: no-op
    // Override in subclass to implement database loading
    if (this.config.enablePersistence) {
      console.log('Loading conversations from persistent storage...');
      // Implement your loading logic here (e.g., load from database)
    }
  }

  /**
   * Get service statistics
   */
  getServiceStats(): {
    totalConversations: number;
    totalMessages: number;
    activeConversations: number;
  } {
    const conversations = Array.from(this.conversations.values());
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const activeConversations = conversations.filter(
      conv => new Date(conv.updatedAt).getTime() > oneHourAgo
    ).length;

    return {
      totalConversations: conversations.length,
      totalMessages,
      activeConversations,
    };
  }

  /**
   * Cleanup old conversations
   */
  cleanupOldConversations(olderThanMs: number): number {
    const cutoffTime = Date.now() - olderThanMs;
    let deleted = 0;

    for (const [id, conversation] of this.conversations.entries()) {
      if (new Date(conversation.updatedAt).getTime() < cutoffTime) {
        this.conversations.delete(id);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Shutdown service
   */
  shutdown(): void {
    this.stopAutoSave();

    if (this.config.enablePersistence) {
      this.saveConversations();
    }

    this.conversations.clear();
  }
}
