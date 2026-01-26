/**
 * Framework B - n8n Workflows Configuration
 * Configuration for n8n workflow orchestration
 */

export interface N8nConfig {
  /** n8n instance URL */
  baseUrl: string;
  /** API key for n8n (if using n8n API) */
  apiKey?: string;
  /** Webhook URLs for workflows */
  webhooks: {
    documentIngestion?: string;
    chatbotQA?: string;
    documentAnalysis?: string;
    [key: string]: string | undefined;
  };
  /** Enable n8n workflows (false = use direct API calls) */
  enabled: boolean;
}

/**
 * n8n Configuration
 */
export const n8nConfig: N8nConfig = {
  baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
  apiKey: process.env.N8N_API_KEY,
  webhooks: {
    documentIngestion: process.env.N8N_WEBHOOK_DOCUMENT_INGESTION,
    chatbotQA: process.env.N8N_WEBHOOK_CHATBOT_QA,
    documentAnalysis: process.env.N8N_WEBHOOK_DOCUMENT_ANALYSIS,
  },
  enabled: process.env.N8N_ENABLED === 'true',
};

/**
 * Workflow Definitions
 * These describe the workflows available in n8n
 */
export const workflows = {
  documentIngestion: {
    name: 'Document Ingestion Pipeline',
    description: 'Processes uploaded documents and indexes them in Pinecone',
    trigger: 'webhook',
    webhookUrl: n8nConfig.webhooks.documentIngestion,
    steps: [
      'Google Drive Trigger / Webhook',
      'Download File',
      'Extract Text Content',
      'Split into Chunks',
      'Generate Embeddings (OpenAI)',
      'Upsert to Pinecone',
      'Return Success Response',
    ],
    inputSchema: {
      fileUrl: 'string',
      filename: 'string',
      metadata: 'object',
      namespace: 'string',
    },
    outputSchema: {
      success: 'boolean',
      documentId: 'string',
      chunksCreated: 'number',
      vectorsIndexed: 'number',
    },
  },

  chatbotQA: {
    name: 'Chatbot Q&A Pipeline',
    description: 'Handles user questions using RAG approach',
    trigger: 'webhook',
    webhookUrl: n8nConfig.webhooks.chatbotQA,
    steps: [
      'Receive Question via Webhook',
      'Generate Query Embedding',
      'Search Pinecone for Relevant Chunks',
      'Build RAG Prompt',
      'Generate Answer (OpenAI/Claude)',
      'Format Response with Citations',
      'Return Answer',
    ],
    inputSchema: {
      question: 'string',
      context: 'object',
      conversationId: 'string (optional)',
    },
    outputSchema: {
      answer: 'string',
      citations: 'array',
      confidence: 'number',
    },
  },

  documentAnalysis: {
    name: 'Document Analysis',
    description: 'Analyzes document content and extracts insights',
    trigger: 'webhook',
    webhookUrl: n8nConfig.webhooks.documentAnalysis,
    steps: [
      'Receive Document ID',
      'Retrieve Document Chunks from Pinecone',
      'Combine Content',
      'Analyze with LLM',
      'Extract Key Points',
      'Return Analysis',
    ],
    inputSchema: {
      documentId: 'string',
      analysisType: 'string',
    },
    outputSchema: {
      summary: 'string',
      keyPoints: 'array',
      entities: 'array',
      sentiment: 'string',
    },
  },
};

/**
 * Validate n8n configuration
 */
export function validateN8nConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (n8nConfig.enabled) {
    if (!n8nConfig.baseUrl) {
      errors.push('N8N_BASE_URL is required when n8n is enabled');
    }

    // Check that at least one webhook is configured
    const hasWebhook = Object.values(n8nConfig.webhooks).some(url => !!url);
    if (!hasWebhook) {
      errors.push('At least one n8n webhook URL must be configured');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Call n8n workflow via webhook
 */
export async function callWorkflow(
  workflowName: keyof typeof workflows,
  data: any
): Promise<any> {
  if (!n8nConfig.enabled) {
    throw new Error('n8n workflows are disabled. Enable with N8N_ENABLED=true');
  }

  const workflow = workflows[workflowName];
  const webhookUrl = workflow.webhookUrl;

  if (!webhookUrl) {
    throw new Error(`Webhook URL not configured for workflow: ${workflowName}`);
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(n8nConfig.apiKey ? { 'X-N8N-API-KEY': n8nConfig.apiKey } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`n8n workflow failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error calling n8n workflow ${workflowName}:`, error);
    throw error;
  }
}

/**
 * Get workflow status (if n8n API is configured)
 */
export async function getWorkflowStatus(workflowId: string): Promise<any> {
  if (!n8nConfig.apiKey) {
    throw new Error('N8N_API_KEY required to check workflow status');
  }

  try {
    const response = await fetch(`${n8nConfig.baseUrl}/api/v1/executions/${workflowId}`, {
      headers: {
        'X-N8N-API-KEY': n8nConfig.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get workflow status: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting workflow status:', error);
    throw error;
  }
}
