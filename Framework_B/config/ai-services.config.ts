/**
 * Framework B - AI Services Configuration
 * Configuration for AI service providers
 */

import type {
  EmbeddingServiceConfig,
  RAGEngineConfig,
  PromptTemplate,
} from '../types';

/**
 * Embeddings Service Configuration
 */
export const embeddingsConfig: EmbeddingServiceConfig = {
  embedding: {
    provider: (process.env.EMBEDDING_PROVIDER as any) || 'openai',
    model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
    dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS || '1536'),
    batchSize: parseInt(process.env.EMBEDDING_BATCH_SIZE || '100'),
    enableCache: process.env.EMBEDDING_CACHE_ENABLED !== 'false',
    retryAttempts: parseInt(process.env.EMBEDDING_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.EMBEDDING_RETRY_DELAY || '1000'),
  },
  providers: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      organizationId: process.env.OPENAI_ORG_ID,
      rateLimit: parseInt(process.env.OPENAI_RATE_LIMIT || '3000'),
      timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000'),
    },
    claude: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      timeout: parseInt(process.env.ANTHROPIC_TIMEOUT || '30000'),
    },
    gemini: {
      apiKey: process.env.GOOGLE_AI_API_KEY || '',
      timeout: parseInt(process.env.GOOGLE_AI_TIMEOUT || '30000'),
    },
  },
  cache: {
    enabled: process.env.EMBEDDING_CACHE_ENABLED !== 'false',
    type: (process.env.EMBEDDING_CACHE_TYPE as any) || 'memory',
    ttl: parseInt(process.env.EMBEDDING_CACHE_TTL || '86400'), // 24 hours
    maxSize: parseInt(process.env.EMBEDDING_CACHE_MAX_SIZE || '10000'),
  },
};

/**
 * Default Prompt Templates for RAG
 */
const defaultPrompts = {
  qa: {
    system: `You are a helpful AI assistant for Gold.Arch Construction Supplier CRM.
You have access to a knowledge base of documents including project details, supplier information,
quotes, and activities. Use the provided context to answer questions accurately and cite your sources.

If the context doesn't contain enough information to answer the question, acknowledge this and
provide what information is available, or suggest what additional information would be needed.`,
    user: `Context from knowledge base:
{context}

User Question: {question}

Please provide a helpful answer based on the context above. If you use specific information from
the context, mention which document or source it came from.`,
    variables: ['context', 'question'],
  } as PromptTemplate,

  noContext: {
    system: `You are a helpful AI assistant for Gold.Arch Construction Supplier CRM.`,
    user: `I don't have specific documents in my knowledge base that directly answer this question: "{question}"

However, I can provide general information if that would be helpful, or you can:
1. Upload relevant documents to the system
2. Rephrase your question to be more specific
3. Ask about topics that are already in the knowledge base

What would you like to do?`,
    variables: ['question'],
  } as PromptTemplate,

  conversation: {
    system: `You are a helpful AI assistant for Gold.Arch Construction Supplier CRM.
You maintain context from previous messages in the conversation. Use the knowledge base
context when available, and remember previous questions and answers to provide coherent responses.`,
    user: `Previous conversation:
{history}

Current context from knowledge base:
{context}

Current question: {question}

Provide a helpful answer that takes into account both the conversation history and the
current context.`,
    variables: ['history', 'context', 'question'],
  } as PromptTemplate,
};

/**
 * RAG Engine Configuration
 */
export const ragConfig: RAGEngineConfig = {
  rag: {
    retrievalTopK: parseInt(process.env.RAG_RETRIEVAL_TOP_K || '5'),
    contextWindow: parseInt(process.env.RAG_CONTEXT_WINDOW || '4000'),
    llmProvider: (process.env.LLM_PROVIDER as any) || 'openai',
    llmModel: process.env.LLM_MODEL || 'gpt-4',
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.3'),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '1000'),
    includeCitations: process.env.RAG_INCLUDE_CITATIONS !== 'false',
    fallbackMessage: process.env.RAG_FALLBACK_MESSAGE ||
      "I don't have enough information in my knowledge base to answer that question accurately.",
    enableConversationHistory: process.env.RAG_ENABLE_HISTORY !== 'false',
    maxHistoryLength: parseInt(process.env.RAG_MAX_HISTORY_LENGTH || '10'),
  },
  prompts: {
    qa: defaultPrompts.qa,
    noContext: defaultPrompts.noContext,
    conversation: defaultPrompts.conversation,
  },
  llmProviders: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      organizationId: process.env.OPENAI_ORG_ID,
      defaultModel: (process.env.OPENAI_DEFAULT_MODEL as any) || 'gpt-4',
      timeout: parseInt(process.env.OPENAI_TIMEOUT || '60000'),
      maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || '3'),
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      defaultModel: (process.env.ANTHROPIC_DEFAULT_MODEL as any) || 'claude-3-5-sonnet-20241022',
      timeout: parseInt(process.env.ANTHROPIC_TIMEOUT || '60000'),
      maxRetries: parseInt(process.env.ANTHROPIC_MAX_RETRIES || '3'),
    },
    google: {
      apiKey: process.env.GOOGLE_AI_API_KEY || '',
      defaultModel: (process.env.GOOGLE_DEFAULT_MODEL as any) || 'gemini-1.5-pro',
      timeout: parseInt(process.env.GOOGLE_AI_TIMEOUT || '60000'),
      maxRetries: parseInt(process.env.GOOGLE_AI_MAX_RETRIES || '3'),
    },
  },
  vectorStore: {
    provider: 'pinecone',
    config: {
      // Pinecone config is in separate file
    },
  },
};

/**
 * Validate configuration on load
 */
export function validateAIConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for required API keys based on selected providers
  if (embeddingsConfig.embedding.provider === 'openai' && !embeddingsConfig.providers.openai?.apiKey) {
    errors.push('OPENAI_API_KEY is required when using OpenAI as embedding provider');
  }

  if (embeddingsConfig.embedding.provider === 'claude' && !embeddingsConfig.providers.claude?.apiKey) {
    errors.push('ANTHROPIC_API_KEY is required when using Claude as embedding provider');
  }

  if (ragConfig.rag.llmProvider === 'openai' && !ragConfig.llmProviders.openai?.apiKey) {
    errors.push('OPENAI_API_KEY is required when using OpenAI as LLM provider');
  }

  if (ragConfig.rag.llmProvider === 'anthropic' && !ragConfig.llmProviders.anthropic?.apiKey) {
    errors.push('ANTHROPIC_API_KEY is required when using Anthropic as LLM provider');
  }

  // Validate numeric ranges
  if (ragConfig.rag.temperature < 0 || ragConfig.rag.temperature > 1) {
    errors.push('LLM temperature must be between 0 and 1');
  }

  if (ragConfig.rag.retrievalTopK < 1 || ragConfig.rag.retrievalTopK > 100) {
    errors.push('Retrieval topK must be between 1 and 100');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get provider-specific configuration
 */
export function getProviderConfig(provider: string) {
  switch (provider) {
    case 'openai':
      return {
        embedding: embeddingsConfig.providers.openai,
        llm: ragConfig.llmProviders.openai,
      };
    case 'anthropic':
    case 'claude':
      return {
        embedding: embeddingsConfig.providers.claude,
        llm: ragConfig.llmProviders.anthropic,
      };
    case 'google':
    case 'gemini':
      return {
        embedding: embeddingsConfig.providers.gemini,
        llm: ragConfig.llmProviders.google,
      };
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
