# Framework B Integration Guide

## Quick Start - Integrating with Framework A (CRM)

This guide shows how to integrate Framework B's AI capabilities into Framework A (the main CRM application).

## Installation

Framework B is already included in the project at `/Framework_B`. No additional installation needed.

## Configuration

1. **Copy environment template:**
   ```bash
   cp Framework_B/.env.example .env.local
   ```

2. **Fill in your API keys:**
   - OpenAI API key (required for embeddings and LLM)
   - Pinecone API key (required for vector storage)
   - Anthropic API key (optional, for Claude)
   - n8n webhook URLs (optional, if using n8n workflows)

3. **Verify configuration:**
   ```typescript
   import { validateAIConfig, validatePineconeConfig } from '@/Framework_B/config';

   const aiValidation = validateAIConfig();
   const pineconeValidation = validatePineconeConfig();

   if (!aiValidation.valid) {
     console.error('AI Config errors:', aiValidation.errors);
   }
   ```

## Usage Examples

### 1. Adding AI Chat to a CRM Page

Add an AI assistant to help users query documents:

```typescript
// In app/app-dashboard/documents/page.tsx

'use client';

import { useAIChat } from '@/Framework_B/hooks/useAIChat';
import { useState } from 'react';

export default function DocumentsPage() {
  const { ask, messages, isLoading, clearConversation } = useAIChat();
  const [question, setQuestion] = useState('');

  const handleAsk = async () => {
    if (!question.trim()) return;

    await ask({
      question,
      context: {
        // Optionally filter by current project
        projectId: currentProjectId,
      },
    });

    setQuestion('');
  };

  return (
    <div>
      {/* Your existing documents UI */}

      {/* AI Chat Widget */}
      <div className="mt-8 border rounded-lg p-4">
        <h3 className="font-semibold mb-4">Ask AI About Documents</h3>

        {/* Messages */}
        <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded ${
                msg.role === 'user' ? 'bg-blue-100 ml-12' : 'bg-gray-100 mr-12'
              }`}
            >
              <p>{msg.content}</p>
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  <strong>Sources:</strong> {msg.citations.map(c => c.source).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="Ask a question about your documents..."
            className="flex-1 border rounded px-3 py-2"
            disabled={isLoading}
          />
          <button
            onClick={handleAsk}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {isLoading ? 'Thinking...' : 'Ask'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 2. Processing Documents on Upload

Automatically index documents when users upload them:

```typescript
// In app/app-dashboard/documents/page.tsx

import { useDocumentProcessor } from '@/Framework_B/hooks/useDocumentProcessor';
import { supabase } from '@/lib/supabase-client';

export default function DocumentsPage() {
  const { processDocument, status, progress } = useDocumentProcessor();

  const handleFileUpload = async (file: File, projectId: string) => {
    try {
      // 1. Upload to Supabase Storage (Framework A)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`${projectId}/${file.name}`, file);

      if (uploadError) throw uploadError;

      // 2. Save metadata to Supabase database
      const { data: docData, error: dbError } = await supabase
        .from('documents')
        .insert({
          filename: file.name,
          project_id: projectId,
          url: uploadData.path,
          size: file.size,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 3. Index with AI (Framework B)
      const result = await processDocument({
        file,
        metadata: {
          filename: file.name,
          projectId: projectId,
          documentId: docData.id,
          uploadedAt: new Date().toISOString(),
        },
        namespace: `project-${projectId}`,
      });

      if (result.success) {
        toast.success(`Document indexed: ${result.chunksCreated} chunks created`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    }
  };

  return (
    // Your upload UI with handleFileUpload callback
  );
}
```

### 3. Semantic Search in CRM

Add intelligent search across documents:

```typescript
// In app/app-dashboard/search/page.tsx

import { useVectorSearch } from '@/Framework_B/hooks/useVectorSearch';

export default function SearchPage() {
  const { search, results, isSearching } = useVectorSearch();
  const [query, setQuery] = useState('');

  const handleSearch = async () => {
    const searchResults = await search({
      query,
      filters: {
        projectId: selectedProjectId, // Optional filter
      },
      topK: 10,
      minScore: 0.7, // Minimum similarity threshold
    });

    // searchResults.results contains RetrievalResult[]
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search documents by meaning..."
      />
      <button onClick={handleSearch} disabled={isSearching}>
        Search
      </button>

      <div className="mt-4">
        {results.map((result) => (
          <div key={result.id} className="border p-4 mb-2">
            <h3 className="font-semibold">{result.metadata.filename}</h3>
            <p className="text-sm text-gray-600">{result.content}</p>
            <span className="text-xs">Relevance: {(result.score * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## API Routes Setup

To enable the hooks, create the API routes in your Next.js app:

### 1. Chat API Route

Create `app/api/framework-b/chat/ask/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
// Import your RAG implementation or use n8n workflow
// See Framework_B/api/chat/route.example.ts for reference

export async function POST(request: NextRequest) {
  // Implement or delegate to n8n
}
```

### 2. Document Processing API Route

Create `app/api/framework-b/documents/process/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
// Implement document processing or use n8n workflow

export async function POST(request: NextRequest) {
  // Implement or delegate to n8n
}
```

### 3. Search API Route

Create `app/api/framework-b/search/vector/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
// Implement vector search

export async function POST(request: NextRequest) {
  // Implement Pinecone search
}
```

## Using n8n Workflows (Optional)

If you prefer to use n8n for orchestration:

1. **Import workflows to n8n:**
   - Open n8n interface
   - Import `Framework_B/n8n-workflows/document-ingestion.json`
   - Import `Framework_B/n8n-workflows/chatbot-qa.json`

2. **Configure credentials in n8n:**
   - Add OpenAI API credentials
   - Add Pinecone API credentials
   - Add Google Drive credentials (if needed)

3. **Activate workflows and get webhook URLs**

4. **Update environment variables:**
   ```env
   N8N_ENABLED=true
   N8N_WEBHOOK_DOCUMENT_INGESTION=https://your-n8n.com/webhook/...
   N8N_WEBHOOK_CHATBOT_QA=https://your-n8n.com/webhook/...
   ```

5. **Use n8n client in API routes:**
   ```typescript
   import { callWorkflow } from '@/Framework_B/config/n8n-workflows.config';

   export async function POST(request: NextRequest) {
     const data = await request.json();
     const result = await callWorkflow('chatbotQA', data);
     return NextResponse.json(result);
   }
   ```

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
const { ask, error } = useAIChat();

try {
  const response = await ask({ question: 'Your question' });
} catch (err) {
  if (error) {
    // Show user-friendly error message
    toast.error(error);
  }
}
```

### 2. Loading States

Show loading indicators:

```typescript
const { isLoading, isProcessing, isSearching } = useAIChat();

return (
  <button disabled={isLoading}>
    {isLoading ? 'Loading...' : 'Ask'}
  </button>
);
```

### 3. Namespacing

Use namespaces to organize vectors by category:

```typescript
processDocument({
  file,
  namespace: `project-${projectId}`, // Separate by project
});

search({
  query,
  namespace: 'supplier-docs', // Search only supplier documents
});
```

### 4. Context Filtering

Pass context to improve AI responses:

```typescript
ask({
  question: 'What are the requirements?',
  context: {
    projectId: currentProject.id,
    supplierId: currentSupplier.id,
  },
});
```

## Troubleshooting

### "API key not configured"

Make sure you've set up `.env.local` with required API keys:
- `OPENAI_API_KEY`
- `PINECONE_API_KEY`

### "Failed to process document"

Check:
1. File size is under limit (10MB default)
2. File format is supported (PDF, DOCX, TXT)
3. API keys are valid
4. Pinecone index exists

### "No results found"

Possible causes:
1. No documents have been indexed yet
2. Query is too specific or different from indexed content
3. Namespace mismatch (searching in wrong namespace)

### Performance Issues

For large document sets:
1. Use batch processing
2. Enable embedding cache
3. Adjust chunk size/overlap
4. Use appropriate Pinecone pod type

## Next Steps

1. **Customize prompts:** Edit prompt templates in `config/ai-services.config.ts`
2. **Add more features:** Implement document summarization, comparison, etc.
3. **Monitor usage:** Track API costs and usage via OpenAI/Pinecone dashboards
4. **Scale:** Upgrade Pinecone tier and optimize batch processing

## Support

For issues specific to Framework B:
- Check `Framework_B/README.md`
- Check `Framework_B/ARCHITECTURE.md`
- Review type definitions in `Framework_B/types/`
