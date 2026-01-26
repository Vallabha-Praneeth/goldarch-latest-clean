# Framework B - AI-Powered Document Intelligence & RAG System

## Overview

Framework B is a standalone, modular AI framework that provides document intelligence and Retrieval-Augmented Generation (RAG) capabilities. It is designed to work alongside Framework A (the main CRM system) but operates independently with clear interfaces and hooks for integration.

## Purpose

This framework handles all AI-related functionality, including:
- Document processing and ingestion
- Vector embeddings generation
- Semantic search via Pinecone
- AI-powered Q&A using RAG
- Integration with external AI services (OpenAI, Claude, Gemini)
- n8n workflow orchestration

## Architecture

Framework B follows a modular architecture with these key components:

```
Framework_B/
├── README.md                          # This file
├── ARCHITECTURE.md                    # Detailed architecture documentation
├── config/                            # Configuration and environment
│   ├── ai-services.config.ts         # AI service configurations
│   ├── pinecone.config.ts            # Vector DB configuration
│   └── n8n-workflows.config.ts       # Workflow configurations
├── services/                          # Core services
│   ├── document-processor/           # Document ingestion and processing
│   ├── embeddings/                   # Vector embeddings generation
│   ├── vector-store/                 # Pinecone integration
│   ├── rag/                         # RAG engine
│   └── ai-chat/                     # Chat interface
├── hooks/                            # Extension points for integration
│   ├── useDocumentProcessor.ts      # Hook for document processing
│   ├── useAIChat.ts                 # Hook for AI chat
│   └── useVectorSearch.ts           # Hook for semantic search
├── types/                           # TypeScript type definitions
│   ├── document.types.ts
│   ├── embeddings.types.ts
│   └── rag.types.ts
├── utils/                           # Utility functions
│   ├── text-splitter.ts
│   ├── prompt-builder.ts
│   └── response-formatter.ts
├── api/                             # API routes for Framework B
│   ├── chat/                        # Chat endpoints
│   ├── documents/                   # Document management endpoints
│   └── search/                      # Search endpoints
├── n8n-workflows/                   # n8n workflow definitions (exported JSON)
│   ├── document-ingestion.json
│   └── chatbot-qa.json
└── tests/                           # Isolation tests
    └── integration/
```

## Key Features

### 1. Document Processing Pipeline
- **Automatic ingestion** from Google Drive, Supabase Storage, or direct upload
- **Multi-format support**: PDF, DOCX, TXT, Google Docs
- **Intelligent chunking** with configurable strategies
- **Metadata extraction** for better retrieval

### 2. Vector Embeddings
- **Multiple AI providers**: OpenAI, Claude, Google Gemini
- **Configurable models**: Choose embedding model based on use case
- **Batch processing**: Efficient handling of large document sets
- **Cost optimization**: Smart caching and model selection

### 3. Pinecone Vector Store
- **Semantic search**: Find relevant content by meaning, not keywords
- **Namespacing**: Organize vectors by project, supplier, or category
- **Metadata filtering**: Combine semantic + traditional search
- **Scalable**: Handles millions of vectors

### 4. RAG Engine
- **Context-aware answers**: Retrieve relevant docs before generating response
- **Citation tracking**: Know which documents were used
- **Multi-turn conversations**: Maintain context across questions
- **Fallback handling**: Gracefully handle out-of-scope queries

### 5. AI Chat Interface
- **Clean API**: Simple request/response interface
- **Streaming support**: Real-time response generation
- **Error handling**: Robust error management
- **Rate limiting**: Prevent API abuse

## Integration Hooks

Framework B provides clear hooks for Framework A integration:

### `useDocumentProcessor()`
Process and index documents into the knowledge base.

```typescript
const { processDocument, status, error } = useDocumentProcessor();

await processDocument({
  file: uploadedFile,
  metadata: { supplier_id, project_id },
  namespace: 'project-docs'
});
```

### `useAIChat()`
Ask questions and get AI-powered answers from the knowledge base.

```typescript
const { ask, messages, isLoading } = useAIChat();

const answer = await ask({
  question: "What are the latest supplier quotes?",
  context: { project_id: "123" }
});
```

### `useVectorSearch()`
Perform semantic search across documents.

```typescript
const { search, results } = useVectorSearch();

const docs = await search({
  query: "fire safety compliance",
  filters: { project_id: "123" },
  topK: 5
});
```

## Configuration

Framework B uses environment variables for configuration:

```env
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Pinecone
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX_NAME=goldarch-docs

# n8n
N8N_WEBHOOK_URL=https://...
N8N_API_KEY=...
```

## n8n Workflows

Framework B includes two main n8n workflows:

### 1. Document Ingestion Workflow
- **Trigger**: Google Drive file added/updated
- **Steps**:
  1. Download file from Google Drive
  2. Extract text content
  3. Split into chunks
  4. Generate embeddings (OpenAI)
  5. Upsert to Pinecone
- **Export**: `n8n-workflows/document-ingestion.json`

### 2. Chatbot Q&A Workflow
- **Trigger**: HTTP webhook (from chat interface)
- **Steps**:
  1. Receive user question
  2. Generate query embedding
  3. Search Pinecone for relevant chunks
  4. Build RAG prompt with context
  5. Generate answer (OpenAI/Claude)
  6. Return formatted response
- **Export**: `n8n-workflows/chatbot-qa.json`

## Deployment

Framework B components can be deployed independently:

- **API Routes**: Deploy with Framework A on Vercel (Next.js API routes)
- **n8n Workflows**: Deploy to n8n Cloud or self-hosted n8n instance
- **Pinecone**: Managed cloud service
- **AI Services**: API-based (OpenAI, Anthropic, Google)

## Testing

Framework B includes comprehensive tests:

```bash
# Run all tests
npm run test:framework-b

# Run integration tests
npm run test:framework-b:integration

# Test in isolation
npm run test:framework-b:isolated
```

## Reusability

This framework is designed for reuse across projects:

1. **Configuration-driven**: Change env vars to adapt to new projects
2. **Modular services**: Use only what you need
3. **Clear interfaces**: Easy to understand and integrate
4. **Well-documented**: Comprehensive docs and examples
5. **Type-safe**: Full TypeScript support

## Future Enhancements

Potential extensions for Framework B:

- [ ] Multi-language support
- [ ] Advanced summarization capabilities
- [ ] Document comparison and diff analysis
- [ ] Automated tagging and categorization
- [ ] Integration with more AI models (Gemini, Llama, etc.)
- [ ] Real-time collaboration features
- [ ] Analytics and usage insights

## License

Same as the main project.

## Support

For issues specific to Framework B, please check:
1. This README
2. ARCHITECTURE.md for detailed design
3. Individual service READMEs in their directories
