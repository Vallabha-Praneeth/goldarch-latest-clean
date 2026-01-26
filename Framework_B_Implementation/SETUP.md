# Framework B - Setup Guide

Environment variables have been configured. Follow these steps to complete the setup.

## ✅ Step 1: Environment Variables (DONE)

Your `.env` file has been updated with:
```bash
OPENAI_API_KEY=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
PINECONE_API_KEY=pcsk_4j19rT_7XA8RXccLE3ssLg99bVoSQjrnKFV7vP2UfrcRMJKiVAkNZGfF7PTNPBriu2g3qD
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX_NAME=goldarch-docs
```

## 📦 Step 2: Install Dependencies

Install the required npm packages:

```bash
npm install openai @pinecone-database/pinecone pdf-parse mammoth
```

Optional packages for additional features:
```bash
npm install pdfjs-dist pizzip docxtemplater
```

## 🔧 Step 3: Create Pinecone Index

You need to create a Pinecone index before the system can work.

### Option A: Using Pinecone Console (Easiest)

1. Go to https://app.pinecone.io/
2. Login with your account
3. Click "Create Index"
4. Configure:
   - **Name:** `goldarch-docs`
   - **Dimensions:** `1536` (for OpenAI text-embedding-3-small)
   - **Metric:** `cosine`
   - **Region:** `us-west1-gcp`
5. Click "Create Index"

### Option B: Using Pinecone CLI

```bash
# Install Pinecone CLI
pip install pinecone-client

# Create index
pinecone create-index \
  --name goldarch-docs \
  --dimension 1536 \
  --metric cosine \
  --environment us-west1-gcp
```

### Option C: Using API

```bash
curl -X POST https://controller.us-west1-gcp.pinecone.io/databases \
  -H "Api-Key: pcsk_4j19rT_7XA8RXccLE3ssLg99bVoSQjrnKFV7vP2UfrcRMJKiVAkNZGfF7PTNPBriu2g3qD" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "goldarch-docs",
    "dimension": 1536,
    "metric": "cosine",
    "pods": 1,
    "replicas": 1,
    "pod_type": "p1.x1"
  }'
```

## 🧪 Step 4: Test the Setup

### Start Development Server

```bash
npm run dev
```

### Test Health Check

Open your browser or use curl:
```bash
curl http://localhost:3000/api/framework-b/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "embeddings": true,
    "vectorStore": true,
    "documentProcessor": true,
    "ragEngine": true,
    "chatService": true
  },
  "errors": [],
  "timestamp": "2024-01-07T19:00:00.000Z"
}
```

If you see errors, check:
- Environment variables are set correctly
- Pinecone index exists
- OpenAI API key is valid

### Test Document Upload

```bash
# Create a test text file
echo "This is a test document about Gold.Arch project management." > test.txt

# Upload it
curl -X POST http://localhost:3000/api/framework-b/documents/upload \
  -F "file=@test.txt" \
  -F "projectId=test-123"
```

Expected response:
```json
{
  "success": true,
  "documentId": "doc-...",
  "chunksCreated": 1,
  "vectorsIndexed": 1,
  "namespace": "project-test-123"
}
```

### Test Search

```bash
curl -X POST http://localhost:3000/api/framework-b/documents/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "project management",
    "topK": 3
  }'
```

### Test Chat

```bash
curl -X POST http://localhost:3000/api/framework-b/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What documents do we have?"
  }'
```

## 🐛 Troubleshooting

### Error: "OPENAI_API_KEY is not configured"

**Solution:** Restart your dev server after adding environment variables.
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Error: "PINECONE_API_KEY is not configured"

**Solution:** Check your `.env` file and restart dev server.

### Error: "Index not found"

**Solution:** Create the Pinecone index (see Step 3).

### Error: "Failed to generate embeddings"

**Possible causes:**
- Invalid OpenAI API key
- Rate limit exceeded
- Network issues

**Solution:** Check your OpenAI API key at https://platform.openai.com/api-keys

### Error: "Failed to upsert vectors"

**Possible causes:**
- Pinecone index doesn't exist
- Wrong dimensions (should be 1536)
- Invalid API key

**Solution:**
1. Check Pinecone console: https://app.pinecone.io/
2. Verify index name is `goldarch-docs`
3. Verify dimensions are `1536`

### Pinecone Free Tier Limits

Pinecone free tier includes:
- 1 index
- 100K vectors
- p1 pods
- No time limit

If you need more, upgrade at https://app.pinecone.io/

## 📊 Usage Monitoring

### Monitor OpenAI Usage

Check your usage at: https://platform.openai.com/usage

Costs (as of 2024):
- `text-embedding-3-small`: $0.02 per 1M tokens
- `gpt-4-turbo`: ~$0.03 per 1K tokens

### Monitor Pinecone Usage

Check your usage at: https://app.pinecone.io/

Free tier includes:
- Storage: Up to 100K vectors
- Queries: Unlimited

## 🎯 Next Steps

Once setup is complete:

1. **Integrate with Frontend:**
   - Use the React hooks from Framework B
   - Build UI components for document upload
   - Create chat interface

2. **Add Authentication:**
   - Protect API routes with Next.js middleware
   - Add user session checks
   - Implement row-level security

3. **Test with Real Documents:**
   - Upload PDFs, DOCX files
   - Test semantic search
   - Ask questions via chat

4. **Monitor Performance:**
   - Track API costs
   - Monitor response times
   - Log errors

5. **Optimize:**
   - Adjust chunking strategy
   - Tune retrieval parameters
   - Optimize prompts

## 🔐 Security Notes

1. **Never commit `.env` file to git**
   - Already in `.gitignore`
   - Use environment variables in production

2. **Rotate API keys regularly**
   - OpenAI: https://platform.openai.com/api-keys
   - Pinecone: https://app.pinecone.io/

3. **Implement rate limiting**
   - Prevent API abuse
   - Control costs

4. **Add authentication**
   - Protect endpoints
   - Validate user access

---

Setup complete! You're ready to use Framework B. 🎉
