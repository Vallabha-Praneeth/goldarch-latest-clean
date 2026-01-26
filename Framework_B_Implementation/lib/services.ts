/**
 * Framework B - Service Initialization
 * Singleton instances of all Framework B services
 */

import { EmbeddingsService } from '../services/embeddings/EmbeddingsService';
import { VectorStore } from '../services/vector-store/VectorStore';
import { DocumentProcessor } from '../services/document-processor/DocumentProcessor';
import { RAGEngine } from '../services/rag/RAGEngine';
import { ChatService } from '../services/ai-chat/ChatService';
import { DocumentSummarizer } from '../services/document-summarizer/DocumentSummarizer';
import { embeddingsConfig, ragConfig } from '../config/ai-services.config';
import { pineconeConfig } from '../config/pinecone.config';
import type { RAGEngineConfig } from '../types/rag.types';

// Singleton instances
let embeddingsServiceInstance: EmbeddingsService | null = null;
let vectorStoreInstance: VectorStore | null = null;
let documentProcessorInstance: DocumentProcessor | null = null;
let ragEngineInstance: RAGEngine | null = null;
let chatServiceInstance: ChatService | null = null;
let documentSummarizerInstance: DocumentSummarizer | null = null;

/**
 * Get EmbeddingsService instance
 */
export function getEmbeddingsService(): EmbeddingsService {
  if (!embeddingsServiceInstance) {
    const apiKey = embeddingsConfig.providers.openai?.apiKey;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    embeddingsServiceInstance = new EmbeddingsService(embeddingsConfig);
  }

  return embeddingsServiceInstance;
}

/**
 * Get VectorStore instance
 */
export function getVectorStore(): VectorStore {
  if (!vectorStoreInstance) {
    if (!pineconeConfig.apiKey) {
      throw new Error('PINECONE_API_KEY is not configured');
    }

    vectorStoreInstance = new VectorStore(pineconeConfig);
  }

  return vectorStoreInstance;
}

/**
 * Get DocumentProcessor instance
 */
export function getDocumentProcessor(): DocumentProcessor {
  if (!documentProcessorInstance) {
    documentProcessorInstance = new DocumentProcessor({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      supportedFormats: ['pdf', 'docx', 'txt', 'md', 'html'],
      extractMetadata: true,
    });
  }

  return documentProcessorInstance;
}

/**
 * Get RAGEngine instance
 */
export function getRAGEngine(): RAGEngine {
  if (!ragEngineInstance) {
    const vectorStore = getVectorStore();
    const embeddingsService = getEmbeddingsService();

    ragEngineInstance = new RAGEngine(ragConfig, vectorStore, embeddingsService);
  }

  return ragEngineInstance;
}

/**
 * Get ChatService instance
 */
export function getChatService(): ChatService {
  if (!chatServiceInstance) {
    const ragEngine = getRAGEngine();

    chatServiceInstance = new ChatService(ragEngine, {
      maxHistoryLength: 20,
      enablePersistence: false,
      autoSaveInterval: 0,
      maxConversationsInMemory: 100,
    });
  }

  return chatServiceInstance;
}

/**
 * Get DocumentSummarizer instance
 */
export function getDocumentSummarizer(): DocumentSummarizer {
  if (!documentSummarizerInstance) {
    const vectorStore = getVectorStore();
    const embeddingsService = getEmbeddingsService();

    const llmProvider = ragConfig.rag.llmProvider;
    const apiKey = ragConfig.llmProviders.openai?.apiKey || '';
    const defaultModel = ragConfig.rag.llmModel;

    if (!apiKey) {
      throw new Error('LLM API key is not configured');
    }

    documentSummarizerInstance = new DocumentSummarizer(
      vectorStore,
      embeddingsService,
      llmProvider,
      apiKey,
      defaultModel
    );
  }

  return documentSummarizerInstance;
}

/**
 * Health check for all services
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  services: {
    embeddings: boolean;
    vectorStore: boolean;
    documentProcessor: boolean;
    ragEngine: boolean;
    chatService: boolean;
  };
  errors: string[];
}> {
  const errors: string[] = [];
  const services = {
    embeddings: false,
    vectorStore: false,
    documentProcessor: false,
    ragEngine: false,
    chatService: false,
  };

  // Check EmbeddingsService
  try {
    getEmbeddingsService();
    services.embeddings = true;
  } catch (error) {
    errors.push(`EmbeddingsService: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Check VectorStore
  try {
    getVectorStore();
    services.vectorStore = true;
  } catch (error) {
    errors.push(`VectorStore: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Check DocumentProcessor
  try {
    getDocumentProcessor();
    services.documentProcessor = true;
  } catch (error) {
    errors.push(`DocumentProcessor: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Check RAGEngine
  try {
    getRAGEngine();
    services.ragEngine = true;
  } catch (error) {
    errors.push(`RAGEngine: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Check ChatService
  try {
    getChatService();
    services.chatService = true;
  } catch (error) {
    errors.push(`ChatService: ${error instanceof Error ? error.message : String(error)}`);
  }

  const status = errors.length === 0 ? 'healthy' : 'unhealthy';

  return { status, services, errors };
}

/**
 * Reset all service instances (useful for testing)
 */
export function resetServices(): void {
  embeddingsServiceInstance = null;
  vectorStoreInstance = null;
  documentProcessorInstance = null;
  ragEngineInstance = null;
  chatServiceInstance = null;
  documentSummarizerInstance = null;
}
