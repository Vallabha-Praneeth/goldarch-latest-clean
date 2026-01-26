/**
 * Framework B - RAG (Retrieval-Augmented Generation) Types
 * Type definitions for the RAG engine
 */

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'custom';

export type OpenAIModel =
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-4o'
  | 'gpt-3.5-turbo';

export type AnthropicModel =
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-3-haiku-20240307'
  | 'claude-3-5-sonnet-20241022';

export type GoogleModel =
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash'
  | 'gemini-pro';

export type LLMModel = OpenAIModel | AnthropicModel | GoogleModel | string;

export interface RAGConfig {
  /** Number of top results to retrieve */
  retrievalTopK: number;
  /** Maximum context window size (characters) */
  contextWindow: number;
  /** LLM provider */
  llmProvider: LLMProvider;
  /** LLM model */
  llmModel: LLMModel;
  /** Temperature for response generation (0-1) */
  temperature: number;
  /** Maximum tokens in response */
  maxTokens: number;
  /** Include citations in response */
  includeCitations: boolean;
  /** Fallback message when no relevant context found */
  fallbackMessage: string;
  /** Enable multi-turn conversation */
  enableConversationHistory: boolean;
  /** Max conversation history length */
  maxHistoryLength: number;
}

export interface QueryRequest {
  /** User's question */
  question: string;
  /** Optional context/filters */
  context?: {
    /** Filter by project ID */
    projectId?: string;
    /** Filter by supplier ID */
    supplierId?: string;
    /** Filter by custom metadata */
    metadata?: Record<string, any>;
    /** Conversation ID for multi-turn */
    conversationId?: string;
  };
  /** Override retrieval settings */
  retrievalOptions?: {
    topK?: number;
    minScore?: number;
    namespace?: string;
  };
  /** Override LLM settings */
  llmOptions?: {
    model?: LLMModel;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface RetrievalResult {
  /** Unique ID of the document chunk */
  id: string;
  /** Document ID */
  documentId: string;
  /** Retrieved text content */
  content: string;
  /** Similarity score (0-1) */
  score: number;
  /** Chunk metadata */
  metadata: {
    filename?: string;
    projectId?: string;
    supplierId?: string;
    chunkIndex?: number;
    [key: string]: any;
  };
}

export interface Citation {
  /** Source document */
  source: string;
  /** Relevant excerpt */
  excerpt: string;
  /** Document metadata */
  metadata?: Record<string, any>;
  /** Relevance score */
  score?: number;
}

export interface RAGResponse {
  /** Generated answer */
  answer: string;
  /** Retrieved context chunks */
  retrievedContext: RetrievalResult[];
  /** Citations/sources */
  citations: Citation[];
  /** Confidence score (0-1) */
  confidence: number;
  /** Whether the answer is based on retrieved context */
  grounded: boolean;
  /** Conversation ID (for multi-turn) */
  conversationId?: string;
  /** Processing metadata */
  metadata: {
    /** Number of tokens used */
    tokensUsed: number;
    /** Processing time in milliseconds */
    processingTime: number;
    /** Model used */
    model: string;
    /** Retrieval time */
    retrievalTime: number;
    /** Generation time */
    generationTime: number;
  };
}

export interface ConversationMessage {
  /** Message role */
  role: 'user' | 'assistant' | 'system';
  /** Message content */
  content: string;
  /** Timestamp */
  timestamp: string;
  /** Optional citations for assistant messages */
  citations?: Citation[];
}

export interface Conversation {
  /** Unique conversation ID */
  id: string;
  /** User ID */
  userId?: string;
  /** Conversation messages */
  messages: ConversationMessage[];
  /** Conversation metadata */
  metadata?: {
    projectId?: string;
    supplierId?: string;
    [key: string]: any;
  };
  /** Created timestamp */
  createdAt: string;
  /** Last updated timestamp */
  updatedAt: string;
}

export interface PromptTemplate {
  /** System prompt */
  system: string;
  /** User prompt template with placeholders */
  user: string;
  /** Variables used in the template */
  variables: string[];
}

export interface RAGPromptConfig {
  /** Main Q&A prompt template */
  qa: PromptTemplate;
  /** Prompt when no context is found */
  noContext: PromptTemplate;
  /** Prompt for conversation */
  conversation: PromptTemplate;
  /** Custom prompts */
  custom?: Record<string, PromptTemplate>;
}

export interface LLMProviderConfig {
  /** API key */
  apiKey: string;
  /** Base URL (for custom providers) */
  baseUrl?: string;
  /** Organization ID */
  organizationId?: string;
  /** Default model */
  defaultModel: LLMModel;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Max retries on failure */
  maxRetries?: number;
}

export interface RAGEngineConfig {
  /** RAG configuration */
  rag: RAGConfig;
  /** Prompt templates */
  prompts: RAGPromptConfig;
  /** LLM provider configurations */
  llmProviders: {
    openai?: LLMProviderConfig;
    anthropic?: LLMProviderConfig;
    google?: LLMProviderConfig;
    custom?: LLMProviderConfig;
  };
  /** Vector store configuration */
  vectorStore: {
    provider: 'pinecone' | 'custom';
    config: Record<string, any>;
  };
}

export interface StreamingResponse {
  /** Stream ID */
  streamId: string;
  /** Chunk of the response */
  chunk: string;
  /** Whether this is the final chunk */
  done: boolean;
  /** Accumulated response so far */
  accumulated?: string;
  /** Citations (only in final chunk) */
  citations?: Citation[];
}

export type StreamCallback = (response: StreamingResponse) => void;
