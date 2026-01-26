# Framework B - Quick Start

## 5-Minute Setup Guide

### Step 1: Configure Environment (2 minutes)

```bash
# Copy environment template
cp Framework_B/.env.example .env.local

# Edit .env.local and add your keys
```

**Minimum required:**
```env
OPENAI_API_KEY=sk-your-key-here
PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX_NAME=goldarch-docs
```

### Step 2: Create Pinecone Index (1 minute)

1. Go to https://www.pinecone.io/
2. Create new index:
   - Name: `goldarch-docs`
   - Dimensions: `1536`
   - Metric: `cosine`

### Step 3: Add AI Chat to Your CRM (2 minutes)

```typescript
// app/app-dashboard/documents/page.tsx

'use client';

import { useAIChat } from '@/Framework_B/hooks/useAIChat';
import { useState } from 'react';

export default function DocumentsPage() {
  const { ask, messages, isLoading } = useAIChat();
  const [question, setQuestion] = useState('');

  return (
    <div className="p-4">
      <h1>Documents with AI Assistant</h1>

      {/* Chat Interface */}
      <div className="mt-4 border rounded p-4">
        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'text-blue-600' : ''}>
            {msg.content}
          </div>
        ))}

        {/* Input */}
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask({ question })}
          placeholder="Ask about documents..."
          className="w-full border p-2 mt-4"
        />

        <button
          onClick={() => ask({ question })}
          disabled={isLoading}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          {isLoading ? 'Thinking...' : 'Ask AI'}
        </button>
      </div>
    </div>
  );
}
```

### Step 4: Test It!

```bash
npm run dev
```

Navigate to your documents page and try asking a question!

## Next Steps

### Enable Document Upload Processing

```typescript
import { useDocumentProcessor } from '@/Framework_B/hooks/useDocumentProcessor';

const { processDocument } = useDocumentProcessor();

const handleUpload = async (file: File) => {
  await processDocument({
    file,
    metadata: { projectId: 'proj-123' },
    namespace: 'project-docs',
  });
};
```

### Add Semantic Search

```typescript
import { useVectorSearch } from '@/Framework_B/hooks/useVectorSearch';

const { search, results } = useVectorSearch();

const handleSearch = async (query: string) => {
  await search({ query, topK: 5 });
  // results contains matching documents
};
```

## Using n8n Instead (Alternative)

If you prefer visual workflow orchestration:

1. **Install n8n** (optional)
   ```bash
   npm install -g n8n
   n8n start
   ```

2. **Import workflows**
   - Open http://localhost:5678
   - Import `Framework_B/n8n-workflows/document-ingestion.json`
   - Import `Framework_B/n8n-workflows/chatbot-qa.json`

3. **Configure credentials** in n8n UI

4. **Get webhook URLs** and update `.env.local`:
   ```env
   N8N_ENABLED=true
   N8N_WEBHOOK_CHATBOT_QA=https://your-n8n/webhook/...
   ```

## Troubleshooting

**"API key not configured"**
→ Check `.env.local` has `OPENAI_API_KEY` and `PINECONE_API_KEY`

**"Failed to process document"**
→ Ensure Pinecone index exists with correct dimensions (1536)

**"No results"**
→ You need to index documents first using `useDocumentProcessor`

## What's Included Out of the Box

✅ React hooks for AI features
✅ TypeScript types
✅ Configuration system
✅ Text chunking utilities
✅ n8n workflow templates
✅ Comprehensive documentation

## What You Need to Implement

🔨 API Routes (see `Framework_B/api/chat/route.example.ts`)
🔨 Backend services (or use n8n workflows)

## Learn More

- `Framework_B/README.md` - Full documentation
- `Framework_B/ARCHITECTURE.md` - System design
- `Framework_B/INTEGRATION_GUIDE.md` - Detailed integration
- `Framework_B/SUMMARY.md` - What was built

## Support

Questions? Check the docs or create an issue!
