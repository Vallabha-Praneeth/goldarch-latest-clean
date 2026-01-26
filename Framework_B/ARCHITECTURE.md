# Framework B Architecture

## Design Principles

Framework B is built following these core principles from the Modular Multi-AI Project Plan:

1. **Separation of Concerns**: AI functionality is completely separate from CRM business logic
2. **Modularity**: Each service can be developed, tested, and deployed independently
3. **Clear Interfaces**: Well-defined contracts between components
4. **Reusability**: Components designed to be reused in future projects
5. **Extension Points**: Hooks allow Framework A to leverage AI capabilities
6. **Independent Operation**: Can function without Framework A for testing

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Framework A (CRM)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │   Activities │ Deals │ Projects │ Suppliers │ Tasks      │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Integration via Hooks
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Framework B (AI)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Extension Hooks                        │   │
│  │  useDocumentProcessor │ useAIChat │ useVectorSearch      │   │
│  └──────────────┬────────────────────────────┬──────────────┘   │
│                 ▼                            ▼                   │
│  ┌──────────────────────────┐  ┌─────────────────────────────┐  │
│  │   Document Processing    │  │      RAG Engine             │  │
│  │   ├─ Ingestion          │  │      ├─ Query Processing    │  │
│  │   ├─ Text Extraction    │  │      ├─ Context Retrieval   │  │
│  │   └─ Chunking           │  │      └─ Answer Generation   │  │
│  └──────────┬───────────────┘  └──────────┬──────────────────┘  │
│             ▼                              ▼                     │
│  ┌──────────────────────────┐  ┌─────────────────────────────┐  │
│  │  Embeddings Service      │  │    Vector Store             │  │
│  │  ├─ OpenAI              │  │    (Pinecone)               │  │
│  │  ├─ Claude (optional)    │  │    ├─ Indexing             │  │
│  │  └─ Gemini (optional)    │  │    └─ Similarity Search    │  │
│  └──────────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   External Services                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ OpenAI   │  │ Anthropic│  │  Google  │  │  n8n Workflows │  │
│  │   API    │  │   API    │  │  Gemini  │  │  (Optional)    │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Document Processing Service

**Location**: `services/document-processor/`

**Responsibilities**:
- Accept documents from various sources (upload, Google Drive, Supabase Storage)
- Extract text content from multiple formats (PDF, DOCX, TXT, Google Docs)
- Split text into chunks using intelligent strategies
- Extract and preserve metadata
- Trigger embedding generation

**Key Files**:
- `DocumentProcessor.ts` - Main processor class
- `extractors/` - Format-specific text extractors
- `chunkers/` - Chunking strategies
- `metadata.ts` - Metadata extraction utilities

**Extension Points**:
- `onDocumentProcessed` hook - Called after successful processing
- `customExtractor` - Add support for new file formats
- `customChunker` - Implement custom chunking logic

**Configuration**:
```typescript
{
  chunkSize: 1000,
  chunkOverlap: 200,
  preserveFormatting: false,
  extractMetadata: true,
  supportedFormats: ['pdf', 'docx', 'txt', 'gdoc']
}
```

### 2. Embeddings Service

**Location**: `services/embeddings/`

**Responsibilities**:
- Generate vector embeddings from text chunks
- Support multiple AI providers (OpenAI, Claude, Gemini)
- Batch processing for efficiency
- Caching to reduce costs
- Handle rate limiting and retries

**Key Files**:
- `EmbeddingsService.ts` - Main service class
- `providers/` - Provider-specific implementations
  - `OpenAIProvider.ts`
  - `ClaudeProvider.ts` (if supported)
  - `GeminiProvider.ts`
- `cache.ts` - Embedding cache
- `batch.ts` - Batch processing utilities

**Extension Points**:
- `addProvider` - Add new embedding providers
- `customCache` - Implement custom caching strategy
- `onEmbeddingGenerated` - Hook for post-processing

**Configuration**:
```typescript
{
  provider: 'openai',
  model: 'text-embedding-3-small',
  dimensions: 1536,
  batchSize: 100,
  enableCache: true,
  retryAttempts: 3
}
```

### 3. Vector Store Service (Pinecone)

**Location**: `services/vector-store/`

**Responsibilities**:
- Store vector embeddings in Pinecone
- Perform similarity searches
- Manage namespaces for organization
- Handle metadata filtering
- Upsert, query, and delete operations

**Key Files**:
- `VectorStore.ts` - Main vector store interface
- `PineconeClient.ts` - Pinecone-specific implementation
- `namespace-manager.ts` - Namespace utilities
- `query-builder.ts` - Query construction helpers

**Extension Points**:
- `alternativeVectorStore` - Use different vector DB (e.g., Weaviate, Qdrant)
- `onVectorUpsert` - Hook for post-indexing operations
- `customFilter` - Advanced metadata filtering

**Configuration**:
```typescript
{
  indexName: 'goldarch-docs',
  environment: 'us-west1-gcp',
  dimension: 1536,
  metric: 'cosine',
  namespaces: {
    projects: 'project-docs',
    suppliers: 'supplier-docs',
    general: 'general-docs'
  }
}
```

### 4. RAG Engine

**Location**: `services/rag/`

**Responsibilities**:
- Orchestrate the RAG pipeline
- Process user queries
- Retrieve relevant context from vector store
- Build prompts with retrieved context
- Generate answers using LLMs
- Track citations and sources
- Handle multi-turn conversations

**Key Files**:
- `RAGEngine.ts` - Main orchestration class
- `query-processor.ts` - Query understanding and expansion
- `context-retriever.ts` - Retrieval logic
- `prompt-builder.ts` - Prompt construction
- `answer-generator.ts` - LLM interaction
- `citation-tracker.ts` - Source tracking

**Extension Points**:
- `customRetrieval` - Implement advanced retrieval strategies
- `customPrompt` - Modify prompt templates
- `onAnswerGenerated` - Post-process answers

**Configuration**:
```typescript
{
  retrievalTopK: 5,
  contextWindow: 4000,
  llmProvider: 'openai',
  llmModel: 'gpt-4',
  temperature: 0.3,
  includeCitations: true,
  fallbackMessage: 'I don\'t have enough information to answer that.'
}
```

### 5. AI Chat Service

**Location**: `services/ai-chat/`

**Responsibilities**:
- Provide chat interface for user interactions
- Manage conversation history
- Handle streaming responses (optional)
- Error handling and retries
- User feedback collection

**Key Files**:
- `ChatService.ts` - Main chat service
- `conversation-manager.ts` - Conversation state management
- `streaming.ts` - Streaming response support
- `feedback.ts` - User feedback handling

**Extension Points**:
- `onMessageReceived` - Pre-process user messages
- `onResponseGenerated` - Post-process AI responses
- `customStreaming` - Implement custom streaming logic

**Configuration**:
```typescript
{
  enableStreaming: false,
  maxHistoryLength: 10,
  enableFeedback: true,
  anonymousMode: false,
  rateLimitPerUser: 20 // per hour
}
```

## Data Flow

### Document Ingestion Flow

```
1. Document Upload/Trigger
   ↓
2. DocumentProcessor
   ├─ Extract text
   ├─ Split into chunks
   └─ Extract metadata
   ↓
3. EmbeddingsService
   ├─ Generate embeddings (OpenAI/Claude)
   └─ Return vectors
   ↓
4. VectorStore (Pinecone)
   ├─ Upsert vectors with metadata
   └─ Confirm indexing
   ↓
5. Success Response
```

### Query/Answer Flow (RAG)

```
1. User Question
   ↓
2. QueryProcessor
   ├─ Understand intent
   └─ Expand/reformulate if needed
   ↓
3. EmbeddingsService
   └─ Generate query embedding
   ↓
4. VectorStore
   ├─ Similarity search
   └─ Return top K relevant chunks
   ↓
5. PromptBuilder
   ├─ Combine question + context
   └─ Build LLM prompt
   ↓
6. LLM (OpenAI/Claude)
   ├─ Generate answer
   └─ Return response
   ↓
7. CitationTracker
   └─ Add source references
   ↓
8. Formatted Response to User
```

## Integration with Framework A

Framework B provides clean integration hooks that Framework A can use:

### Example: Document Upload from CRM

```typescript
// In Framework A (CRM) - Documents page
import { useDocumentProcessor } from '@/Framework_B/hooks/useDocumentProcessor';

export default function DocumentsPage() {
  const { processDocument, status } = useDocumentProcessor();

  const handleUpload = async (file: File, projectId: string) => {
    // Upload to Supabase Storage (Framework A)
    const { url } = await uploadToSupabase(file);

    // Index with AI (Framework B)
    await processDocument({
      file,
      metadata: {
        project_id: projectId,
        source: 'crm-upload',
        uploaded_at: new Date().toISOString()
      },
      namespace: `project-${projectId}`
    });
  };

  // ...
}
```

### Example: AI-Powered Search in CRM

```typescript
// In Framework A - Search feature
import { useVectorSearch } from '@/Framework_B/hooks/useVectorSearch';

export default function SmartSearch() {
  const { search } = useVectorSearch();

  const handleSearch = async (query: string) => {
    // Semantic search using Framework B
    const results = await search({
      query,
      filters: {
        user_id: currentUserId
      },
      topK: 10
    });

    // Display results in Framework A UI
    setSearchResults(results);
  };

  // ...
}
```

### Example: AI Chat Assistant in CRM

```typescript
// In Framework A - Add chat widget
import { useAIChat } from '@/Framework_B/hooks/useAIChat';

export function AIChatWidget() {
  const { ask, messages, isLoading } = useAIChat();

  const handleAsk = async (question: string) => {
    const answer = await ask({
      question,
      context: {
        // Provide CRM context for better answers
        current_project_id: selectedProjectId,
        user_role: userRole
      }
    });
  };

  return (
    // Chat UI...
  );
}
```

## Technology Stack

### Core Technologies
- **Language**: TypeScript
- **Runtime**: Node.js (Next.js API routes)
- **Framework**: Next.js (for API routes and hooks)

### AI Services
- **Embeddings**: OpenAI (text-embedding-3-small)
- **LLM**: OpenAI (GPT-4) or Anthropic (Claude Sonnet)
- **Optional**: Google Gemini for long-context scenarios

### Vector Database
- **Primary**: Pinecone (managed cloud)
- **Alternative**: Easily swappable for Weaviate, Qdrant, etc.

### Orchestration
- **n8n**: Workflow automation (optional, for complex pipelines)
- **Alternative**: Direct API calls from Next.js

### Storage
- **Documents**: Google Drive or Supabase Storage
- **Metadata**: Supabase PostgreSQL
- **Vectors**: Pinecone

## Deployment Strategy

### Option 1: Integrated Deployment (Recommended)
- Deploy Framework B API routes alongside Framework A on Vercel
- Share the same Next.js application
- Framework B lives in `/Framework_B` directory
- API routes accessible at `/api/framework-b/*`

### Option 2: Separate Deployment
- Deploy Framework B as separate Next.js app
- Framework A calls Framework B via HTTP
- Better isolation but more complex

### Option 3: Hybrid
- Core hooks and types shared (Framework B in mono-repo)
- Heavy processing (n8n workflows) deployed separately
- Best of both worlds

## Security Considerations

1. **API Key Management**
   - Never expose API keys in client-side code
   - Use environment variables
   - Rotate keys regularly

2. **Data Privacy**
   - Ensure compliance with data protection regulations
   - Implement row-level security in Supabase
   - Sanitize inputs before processing

3. **Access Control**
   - Verify user authentication before processing requests
   - Implement namespace-based access control
   - Rate limiting per user

4. **Vector Store Security**
   - Use namespaces to isolate data
   - Implement metadata-based filtering
   - Regular audits of indexed data

## Performance Optimization

1. **Caching**
   - Cache embeddings to avoid regeneration
   - Cache frequent queries
   - Use CDN for static assets

2. **Batch Processing**
   - Process multiple documents in batches
   - Batch embedding generation
   - Batch vector upserts

3. **Lazy Loading**
   - Load Framework B only when needed
   - Code splitting for large components
   - On-demand workflow triggering

4. **Query Optimization**
   - Use appropriate topK values
   - Implement query result caching
   - Pre-filter with metadata before vector search

## Monitoring and Observability

1. **Metrics to Track**
   - Document processing time
   - Embedding generation latency
   - Vector search performance
   - LLM response time
   - API error rates
   - Cost per query

2. **Logging**
   - Structured logging for all operations
   - Error tracking and alerting
   - User interaction logs (anonymized)

3. **Cost Monitoring**
   - Track OpenAI/Claude API usage
   - Monitor Pinecone vector count
   - Set budget alerts

## Testing Strategy

1. **Unit Tests**
   - Test each service independently
   - Mock external APIs
   - Test utility functions

2. **Integration Tests**
   - Test service interactions
   - Test hooks with real scenarios
   - Test n8n workflows

3. **End-to-End Tests**
   - Test complete document ingestion flow
   - Test RAG query/answer flow
   - Test Framework A integration

4. **Isolation Tests**
   - Verify Framework B works without Framework A
   - Test with minimal configuration
   - Validate modularity

## Future Roadmap

### Phase 1: Core Functionality (Current)
- [x] Document processing pipeline
- [x] Vector embeddings with OpenAI
- [x] Pinecone integration
- [x] Basic RAG engine
- [x] Chat interface

### Phase 2: Enhanced Features
- [ ] Multi-language support
- [ ] Advanced chunking strategies
- [ ] Query expansion and reformulation
- [ ] Multi-model support (Claude, Gemini)
- [ ] Conversation memory

### Phase 3: Advanced Capabilities
- [ ] Document summarization
- [ ] Comparative analysis
- [ ] Automated tagging/categorization
- [ ] Trend detection
- [ ] Predictive insights

### Phase 4: Enterprise Features
- [ ] Multi-tenancy support
- [ ] Advanced analytics dashboard
- [ ] Custom model fine-tuning
- [ ] Integration marketplace
- [ ] White-label deployment

## Conclusion

Framework B is designed as a production-ready, modular AI system that can operate independently or integrate seamlessly with Framework A. Its architecture emphasizes reusability, clear interfaces, and ease of maintenance, making it suitable for both the current Gold.Arch project and future AI-powered applications.
