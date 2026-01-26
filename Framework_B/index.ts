/**
 * Framework B - Main Entry Point
 * Export all public APIs, hooks, types, and utilities
 */

// ============================================
// Types
// ============================================
export type * from './types/document.types';
export type * from './types/embeddings.types';
export type * from './types/rag.types';

// ============================================
// Hooks (React Integration)
// ============================================
export { useDocumentProcessor } from './hooks/useDocumentProcessor';
export { useAIChat } from './hooks/useAIChat';
export { useVectorSearch } from './hooks/useVectorSearch';

// ============================================
// Configuration
// ============================================
export {
  embeddingsConfig,
  ragConfig,
  validateAIConfig,
  getProviderConfig,
} from './config/ai-services.config';

export {
  pineconeConfig,
  validatePineconeConfig,
  getNamespace,
  buildMetadataFilter,
} from './config/pinecone.config';

export {
  n8nConfig,
  workflows,
  validateN8nConfig,
  callWorkflow,
  getWorkflowStatus,
} from './config/n8n-workflows.config';

// ============================================
// Utilities
// ============================================
export { TextSplitter, createDefaultChunkingConfig } from './utils/text-splitter';

// ============================================
// Version
// ============================================
export const VERSION = '1.0.0';
export const FRAMEWORK_NAME = 'Framework B - AI Document Intelligence';
