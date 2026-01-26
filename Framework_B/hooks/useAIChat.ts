/**
 * Framework B - useAIChat Hook
 * React hook for AI-powered chat with RAG
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import type {
  QueryRequest,
  RAGResponse,
  ConversationMessage,
} from '../types/rag.types';

interface UseAIChatReturn {
  /** Ask a question */
  ask: (request: Omit<QueryRequest, 'context'> & { context?: QueryRequest['context'] }) => Promise<RAGResponse>;
  /** Conversation messages */
  messages: ConversationMessage[];
  /** Whether a request is in progress */
  isLoading: boolean;
  /** Error message if failed */
  error: string | null;
  /** Conversation ID */
  conversationId: string | null;
  /** Clear conversation */
  clearConversation: () => void;
  /** Regenerate last answer */
  regenerate: () => Promise<RAGResponse | null>;
}

export function useAIChat(): UseAIChatReturn {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const lastQuestionRef = useRef<QueryRequest | null>(null);

  const ask = useCallback(async (
    request: Omit<QueryRequest, 'context'> & { context?: QueryRequest['context'] }
  ): Promise<RAGResponse> => {
    setIsLoading(true);
    setError(null);

    // Add user message
    const userMessage: ConversationMessage = {
      role: 'user',
      content: request.question,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Build request with conversation context
      const queryRequest: QueryRequest = {
        question: request.question,
        context: {
          ...request.context,
          conversationId: conversationId || undefined,
        },
        retrievalOptions: request.retrievalOptions,
        llmOptions: request.llmOptions,
      };

      lastQuestionRef.current = queryRequest;

      // Call Framework B API
      const response = await fetch('/api/framework-b/chat/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Failed to get answer');
      }

      const result: RAGResponse = await response.json();

      // Set conversation ID if new
      if (result.conversationId && !conversationId) {
        setConversationId(result.conversationId);
      }

      // Add assistant message
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: result.answer,
        timestamp: new Date().toISOString(),
        citations: result.citations,
      };
      setMessages(prev => [...prev, assistantMessage]);

      setIsLoading(false);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred';
      setError(errorMessage);

      // Add error message
      const errorMsg: ConversationMessage = {
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);

      setIsLoading(false);
      throw err;
    }
  }, [conversationId]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    lastQuestionRef.current = null;
  }, []);

  const regenerate = useCallback(async (): Promise<RAGResponse | null> => {
    if (!lastQuestionRef.current) {
      setError('No previous question to regenerate');
      return null;
    }

    // Remove last assistant message
    setMessages(prev => {
      const filtered = prev.filter((msg, idx) => idx !== prev.length - 1 || msg.role !== 'assistant');
      return filtered;
    });

    // Re-ask the same question
    return ask(lastQuestionRef.current);
  }, [ask]);

  return {
    ask,
    messages,
    isLoading,
    error,
    conversationId,
    clearConversation,
    regenerate,
  };
}
