/**
 * Framework B - Prompt Builder
 * Build prompts for LLM with retrieved context
 */

import type { RetrievalResult, PromptTemplate } from '../../types/rag.types';

export interface PromptBuildRequest {
  question: string;
  context: RetrievalResult[];
  conversationHistory?: Array<{ role: string; content: string }>;
  template?: PromptTemplate;
}

export interface BuiltPrompt {
  systemPrompt: string;
  userPrompt: string;
  contextUsed: string;
  sources: string[];
}

export class PromptBuilder {
  private defaultTemplate: PromptTemplate = {
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
  };

  /**
   * Build prompt from context and question
   */
  build(request: PromptBuildRequest): BuiltPrompt {
    const template = request.template || this.defaultTemplate;

    // Build context string from retrieval results
    const contextStr = this.buildContextString(request.context);

    // Build system prompt
    const systemPrompt = this.fillTemplate(template.system, {
      context: contextStr,
      question: request.question,
    });

    // Build user prompt
    let userPrompt = this.fillTemplate(template.user, {
      context: contextStr,
      question: request.question,
    });

    // Add conversation history if provided
    if (request.conversationHistory && request.conversationHistory.length > 0) {
      const historyStr = this.buildHistoryString(request.conversationHistory);
      userPrompt = `Previous conversation:\n${historyStr}\n\n${userPrompt}`;
    }

    // Extract sources
    const sources = request.context.map(r =>
      r.metadata.filename || r.metadata.source || r.documentId
    );

    return {
      systemPrompt,
      userPrompt,
      contextUsed: contextStr,
      sources: [...new Set(sources)], // Remove duplicates
    };
  }

  /**
   * Build context string from retrieval results
   */
  private buildContextString(results: RetrievalResult[]): string {
    if (results.length === 0) {
      return 'No relevant context found in the knowledge base.';
    }

    return results
      .map((result, index) => {
        const source = result.metadata.filename || `Document ${result.documentId}`;
        return `[Source ${index + 1}: ${source}]\n${result.content}\n`;
      })
      .join('\n---\n\n');
  }

  /**
   * Build conversation history string
   */
  private buildHistoryString(history: Array<{ role: string; content: string }>): string {
    return history
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');
  }

  /**
   * Fill template with variables
   */
  private fillTemplate(template: string, variables: Record<string, string>): string {
    let filled = template;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      filled = filled.replace(regex, value);
    });

    return filled;
  }

  /**
   * Build prompt for no context scenario
   */
  buildNoContextPrompt(question: string): BuiltPrompt {
    return {
      systemPrompt: this.defaultTemplate.system,
      userPrompt: `I don't have specific documents in my knowledge base that directly answer this question: "${question}"

However, I can provide general information if that would be helpful, or you can:
1. Upload relevant documents to the system
2. Rephrase your question to be more specific
3. Ask about topics that are already in the knowledge base

What would you like to do?`,
      contextUsed: '',
      sources: [],
    };
  }

  /**
   * Optimize prompt for token limit
   */
  optimizeForTokens(prompt: BuiltPrompt, maxTokens: number): BuiltPrompt {
    // Rough estimation: ~4 characters per token
    const estimatedTokens = (prompt.systemPrompt.length + prompt.userPrompt.length) / 4;

    if (estimatedTokens <= maxTokens) {
      return prompt;
    }

    // Truncate context if needed
    const maxChars = maxTokens * 4;
    const systemLength = prompt.systemPrompt.length;
    const remainingForUser = maxChars - systemLength;

    if (remainingForUser < 100) {
      // Context is too large, need to truncate significantly
      const truncatedContext = prompt.contextUsed.substring(0, remainingForUser - 100) + '\n... (context truncated)';

      return {
        ...prompt,
        contextUsed: truncatedContext,
        userPrompt: this.fillTemplate(this.defaultTemplate.user, {
          context: truncatedContext,
          question: prompt.userPrompt.match(/User Question: (.+)/)?.[1] || '',
        }),
      };
    }

    return prompt;
  }
}
