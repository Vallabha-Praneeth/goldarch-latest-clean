# Framework B - Implementation

Complete service implementations for the AI-powered document intelligence and chatbot platform.

## 📁 Project Structure

```
Framework_B_Implementation/
├── services/
│   ├── embeddings/           # Vector embeddings generation
│   │   ├── EmbeddingsService.ts
│   │   ├── providers/
│   │   │   └── OpenAIProvider.ts
│   │   ├── cache.ts
│   │   └── batch.ts
│   │
│   ├── vector-store/         # Pinecone vector database
│   │   ├── VectorStore.ts
│   │   ├── PineconeClient.ts
│   │   ├── namespace-manager.ts
│   │   └── query-builder.ts
│   │
│   ├── document-processor/   # Document text extraction
│   │   ├── DocumentProcessor.ts
│   │   └── extractors/
│   │       ├── BaseExtractor.ts
│   │       ├── TXTExtractor.ts
│   │       ├── PDFExtractor.ts
│   │       └── DOCXExtractor.ts
│   │
│   ├── rag/                  # RAG (Retrieval-Augmented Generation)
│   │   ├── RAGEngine.ts
│   │   ├── query-processor.ts
│   │   ├── context-retriever.ts
│   │   ├── prompt-builder.ts
│   │   ├── answer-generator.ts
│   │   └── citation-tracker.ts
│   │
│   └── ai-chat/              # Conversation management
│       └── ChatService.ts
│
├── types/                    # TypeScript type definitions
│   ├── document.types.ts
│   ├── embeddings.types.ts
│   └── rag.types.ts
│
├── config/                   # Configuration files
│   ├── ai-services.config.ts
│   └── pinecone.config.ts
│
├── utils/                    # Utility functions
│   └── text-splitter.ts
│
└── index.ts                  # Main export file
```

## 🚀 Services Overview

### 1. EmbeddingsService

**Location:** `services/embeddings/`

**Purpose:** Generate vector embeddings for text using OpenAI API.

**Features:**
- OpenAI provider integration (text-embedding-3-small, text-embedding-3-large, ada-002)
- In-memory caching with SHA256 hashing
- Batch processing with rate limiting
- Retry logic with exponential backoff
- Progress tracking

**Usage:**
```typescript
import { EmbeddingsService } from './services/embeddings/EmbeddingsService';

const service = new EmbeddingsService({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'text-embedding-3-small',
  enableCache: true,
  enableRateLimiting: true,
});

// Single embedding
const result = await service.generateEmbedding('Hello world');

// Batch embeddings
const batch = await service.generateBatchEmbeddings({
  texts: ['text1', 'text2', 'text3'],
  batchSize: 100,
});
```

### 2. VectorStore

**Location:** `services/vector-store/`

**Purpose:** Manage vector storage and similarity search using Pinecone.

**Features:**
- Pinecone API integration
- Namespace management (organize by project/supplier)
- Query builder with filters
- Batch upsert operations
- Semantic search

**Usage:**
```typescript
import { VectorStore } from './services/vector-store/VectorStore';

const vectorStore = new VectorStore({
  apiKey: process.env.PINECONE_API_KEY!,
  environment: process.env.PINECONE_ENVIRONMENT!,
  indexName: 'goldarch-docs',
});

// Upsert document chunks
await vectorStore.upsertChunks({
  chunks: documentChunks,
  embeddings: embeddingVectors,
  namespace: 'project-123',
});

// Semantic search
const results = await vectorStore.search({
  queryEmbedding: queryVector,
  topK: 5,
  namespace: 'project-123',
  filters: { projectId: '123' },
  minScore: 0.7,
});
```

### 3. DocumentProcessor

**Location:** `services/document-processor/`

**Purpose:** Extract text from various document formats and create chunks.

**Features:**
- Multi-format support: PDF, DOCX, TXT, MD, HTML
- Multiple extraction libraries:
  - PDF: pdf-parse, pdfjs-dist
  - DOCX: mammoth
  - TXT: native
- Text chunking with 5 strategies:
  - Fixed-size
  - Sentence-boundary
  - Paragraph
  - Recursive
  - Semantic (experimental)
- Metadata extraction
- File validation

**Usage:**
```typescript
import { DocumentProcessor } from './services/document-processor/DocumentProcessor';

const processor = new DocumentProcessor({
  maxFileSize: 50 * 1024 * 1024, // 50MB
  defaultChunking: {
    chunkSize: 1000,
    chunkOverlap: 200,
    strategy: 'recursive',
  },
});

// Process document
const response = await processor.processDocument({
  file: uploadedFile,
  metadata: {
    filename: 'contract.pdf',
    projectId: '123',
    source: 'upload',
  },
});

// Extract and chunk
const { document, chunks } = await processor.extractAndChunk(file, metadata);
```

### 4. RAGEngine

**Location:** `services/rag/`

**Purpose:** Orchestrate the complete RAG pipeline for question answering.

**Features:**
- Query processing (cleaning, keyword extraction, intent detection)
- Context retrieval from vector store
- Prompt building with context
- Answer generation (OpenAI, Claude, Gemini)
- Citation tracking
- Conversation history support
- Confidence scoring

**Usage:**
```typescript
import { RAGEngine } from './services/rag/RAGEngine';

const ragEngine = new RAGEngine(
  config,
  vectorStore,
  embeddingsService
);

// Ask a question
const response = await ragEngine.answer({
  question: 'What is the project budget?',
  context: {
    projectId: '123',
    conversationId: 'conv-456',
  },
  retrievalOptions: {
    topK: 5,
    minScore: 0.7,
  },
  llmOptions: {
    model: 'gpt-4',
    temperature: 0.3,
  },
});

console.log(response.answer);
console.log(response.citations);
console.log(response.confidence);
```

### 5. ChatService

**Location:** `services/ai-chat/`

**Purpose:** Manage conversations and integrate with RAG Engine.

**Features:**
- Conversation management (create, retrieve, update, delete)
- RAG integration for answering
- Conversation history
- Message regeneration
- Search conversations
- Import/export conversations
- Statistics and analytics
- Auto-save support
- Memory management

**Usage:**
```typescript
import { ChatService } from './services/ai-chat/ChatService';

const chatService = new ChatService(ragEngine, {
  maxHistoryLength: 20,
  enablePersistence: false,
  maxConversationsInMemory: 100,
});

// Send a message
const response = await chatService.sendMessage({
  message: 'What documents are related to supplier XYZ?',
  conversationId: 'conv-123', // Optional
  context: {
    projectId: '123',
    supplierId: 'xyz',
  },
});

// Regenerate last response
await chatService.regenerateResponse('conv-123');

// Get conversation
const conversation = chatService.getConversation('conv-123');

// Search conversations
const results = chatService.searchConversations('contract', 'user-456');
```

## 🔧 Configuration

### AI Services Configuration

Located in `config/ai-services.config.ts`:

```typescript
export const aiServicesConfig: AIServicesConfig = {
  embeddings: {
    provider: 'openai',
    model: 'text-embedding-3-small',
    dimensions: 1536,
    batchSize: 100,
    enableCache: true,
    cacheConfig: {
      enabled: true,
      ttl: 86400000,
      maxSize: 10000,
    },
  },
  llmProviders: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY!,
      defaultModel: 'gpt-4-turbo-preview',
      baseUrl: 'https://api.openai.com/v1',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY!,
      defaultModel: 'claude-3-sonnet-20240229',
      baseUrl: 'https://api.anthropic.com/v1',
    },
  },
  rag: {
    retrievalTopK: 5,
    retrievalMinScore: 0.7,
    llmProvider: 'openai',
    llmModel: 'gpt-4-turbo-preview',
    temperature: 0.3,
    maxTokens: 1000,
    enableConversationHistory: true,
    maxHistoryLength: 10,
    includeCitations: true,
  },
};
```

### Pinecone Configuration

Located in `config/pinecone.config.ts`:

```typescript
export const pineconeConfig: PineconeConfig = {
  apiKey: process.env.PINECONE_API_KEY!,
  environment: process.env.PINECONE_ENVIRONMENT || 'us-west1-gcp',
  indexName: 'goldarch-docs',
  dimension: 1536,
  metric: 'cosine',
  cloud: 'gcp',
  region: 'us-west1',
};
```

## 📦 Dependencies

### Required npm packages:

```json
{
  "dependencies": {
    "openai": "^4.x",
    "@anthropic-ai/sdk": "^0.x",
    "@pinecone-database/pinecone": "^2.x",
    "pdf-parse": "^1.x",
    "mammoth": "^1.x"
  }
}
```

### Optional packages:

```json
{
  "dependencies": {
    "pdfjs-dist": "^4.x",
    "pizzip": "^3.x",
    "docxtemplater": "^3.x"
  }
}
```

## 🔑 Environment Variables

Create a `.env` file with the following:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic Claude (optional)
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini (optional)
GOOGLE_API_KEY=...

# Pinecone
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX_NAME=goldarch-docs
```

## 🧪 Testing

### Unit Tests

Test individual services:

```typescript
// Test EmbeddingsService
import { EmbeddingsService } from './services/embeddings/EmbeddingsService';

const service = new EmbeddingsService(config);
const result = await service.generateEmbedding('test');
console.assert(result.embedding.length === 1536);
```

### Integration Tests

Test complete workflow:

```typescript
// 1. Process document
const { document, chunks } = await processor.extractAndChunk(file);

// 2. Generate embeddings
const embeddings = await embeddingsService.generateBatchEmbeddings({
  texts: chunks.map(c => c.content),
});

// 3. Store in vector database
await vectorStore.upsertChunks({
  chunks,
  embeddings: embeddings.embeddings,
});

// 4. Ask a question
const answer = await ragEngine.answer({
  question: 'What is the contract value?',
});

console.log(answer.answer);
console.log(answer.citations);
```

## 📊 Performance Considerations

### Embeddings
- Cache embeddings to reduce API costs
- Use batch processing for multiple texts
- Rate limiting prevents API throttling
- Retry logic handles transient failures

### Vector Store
- Use namespaces to organize documents
- Batch upsert operations (100 vectors at a time)
- Filter by metadata to improve search speed
- Set appropriate minScore to filter irrelevant results

### Document Processing
- Validate file size before processing
- Use appropriate chunking strategy
- Consider processing large documents in background

### RAG Engine
- Limit conversation history length
- Adjust temperature based on use case
- Use citations to track sources
- Monitor token usage

## 🔗 Integration with Framework A

These services are designed to integrate seamlessly with the existing CRM (Framework A):

```typescript
// In your Next.js API route
import {
  EmbeddingsService,
  VectorStore,
  DocumentProcessor,
  RAGEngine,
  ChatService
} from '@/Framework_B_Implementation';

// Initialize services
const embeddingsService = new EmbeddingsService(embeddingsConfig);
const vectorStore = new VectorStore(pineconeConfig);
const processor = new DocumentProcessor();
const ragEngine = new RAGEngine(ragConfig, vectorStore, embeddingsService);
const chatService = new ChatService(ragEngine);

// Use in API routes
export async function POST(request: Request) {
  const { message, conversationId } = await request.json();

  const response = await chatService.sendMessage({
    message,
    conversationId,
    context: {
      projectId: request.headers.get('x-project-id'),
    },
  });

  return Response.json(response);
}
```

## 📝 Next Steps

1. **Create API Routes:** Implement Next.js API routes in `/api` to expose these services
2. **Setup External Services:** Configure Pinecone index and OpenAI API keys
3. **Test Integration:** Verify services work with real documents
4. **Add Error Handling:** Implement comprehensive error handling and logging
5. **Add Monitoring:** Track usage, performance, and costs
6. **Implement Persistence:** Add database storage for conversations

## 📚 Additional Resources

- [Framework B Architecture](../Framework_B/ARCHITECTURE.md)
- [Integration Guide](../Framework_B/INTEGRATION_GUIDE.md)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [Pinecone Documentation](https://docs.pinecone.io/)
- [Retrieval-Augmented Generation (RAG)](https://arxiv.org/abs/2005.11401)

## 🎯 Implementation Status

- ✅ **EmbeddingsService** - Complete with OpenAI provider, caching, and batch processing
- ✅ **VectorStore** - Complete with Pinecone integration and namespace management
- ✅ **DocumentProcessor** - Complete with multi-format support and text chunking
- ✅ **RAGEngine** - Complete with full RAG pipeline and multi-provider LLM support
- ✅ **ChatService** - Complete with conversation management and RAG integration

All core services are implemented and ready for integration!
