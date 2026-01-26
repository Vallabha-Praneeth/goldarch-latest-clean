/**
 * Framework B - RAG Engine
 * Main orchestrator for Retrieval-Augmented Generation
 */

import type {
  QueryRequest,
  RAGResponse,
  Conversation,
  RAGEngineConfig,
} from '../../types/rag.types';

import { VectorStore } from '../vector-store/VectorStore';
import { EmbeddingsService } from '../embeddings/EmbeddingsService';
import { QueryProcessor } from './query-processor';
import { ContextRetriever } from './context-retriever';
import { PromptBuilder } from './prompt-builder';
import { AnswerGenerator } from './answer-generator';
import { CitationTracker } from './citation-tracker';

export class RAGEngine {
  private vectorStore: VectorStore;
  private embeddingsService: EmbeddingsService;
  private queryProcessor: QueryProcessor;
  private contextRetriever: ContextRetriever;
  private promptBuilder: PromptBuilder;
  private answerGenerator: AnswerGenerator;
  private citationTracker: CitationTracker;
  private config: RAGEngineConfig;
  private conversations: Map<string, Conversation>;

  constructor(
    config: RAGEngineConfig,
    vectorStore: VectorStore,
    embeddingsService: EmbeddingsService
  ) {
    this.config = config;
    this.vectorStore = vectorStore;
    this.embeddingsService = embeddingsService;

    // Initialize components
    this.queryProcessor = new QueryProcessor();
    this.contextRetriever = new ContextRetriever(vectorStore, embeddingsService);
    this.promptBuilder = new PromptBuilder();
    this.answerGenerator = this.createAnswerGenerator();
    this.citationTracker = new CitationTracker();

    // Conversation storage
    this.conversations = new Map();
  }

  /**
   * Answer a question using RAG
   */
  async answer(request: QueryRequest): Promise<RAGResponse> {
    const startTime = Date.now();

    try {
      // 1. Validate and process query
      const validation = this.queryProcessor.validate(request.question);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const processedQuery = this.queryProcessor.process(request.question);

      // 2. Retrieve relevant context
      const retrievalRequest = {
        query: processedQuery.cleaned,
        topK: request.retrievalOptions?.topK || this.config.rag.retrievalTopK,
        namespace: request.retrievalOptions?.namespace || this.getNamespace(request.context),
        filters: this.buildFilters(request.context),
        minScore: request.retrievalOptions?.minScore || 0.6,
      };

      const retrievalResponse = await this.contextRetriever.retrieve(retrievalRequest);

      // 3. Check if we have enough context
      if (retrievalResponse.results.length === 0) {
        return this.buildNoContextResponse(request, startTime);
      }

      // 4. Get conversation history if needed
      let conversationHistory;
      if (this.config.rag.enableConversationHistory && request.context?.conversationId) {
        const conversation = this.conversations.get(request.context.conversationId);
        conversationHistory = conversation?.messages.slice(-this.config.rag.maxHistoryLength);
      }

      // 5. Build prompt
      const prompt = this.promptBuilder.build({
        question: request.question,
        context: retrievalResponse.results,
        conversationHistory,
        template: this.config.prompts.qa,
      });

      // 6. Generate answer
      const answerResponse = await this.answerGenerator.generate({
        systemPrompt: prompt.systemPrompt,
        userPrompt: prompt.userPrompt,
        model: request.llmOptions?.model || this.config.rag.llmModel,
        temperature: request.llmOptions?.temperature || this.config.rag.temperature,
        maxTokens: request.llmOptions?.maxTokens || this.config.rag.maxTokens,
      });

      // 7. Build citations
      const citations = this.config.rag.includeCitations
        ? this.citationTracker.buildCitations(retrievalResponse.results)
        : [];

      // 8. Calculate confidence
      const confidence = this.calculateConfidence(retrievalResponse.results);

      // 9. Store conversation if enabled
      let conversationId = request.context?.conversationId;
      if (this.config.rag.enableConversationHistory) {
        conversationId = this.storeMessage(
          conversationId,
          request.question,
          answerResponse.answer,
          request.context
        );
      }

      const totalTime = Date.now() - startTime;

      return {
        answer: answerResponse.answer,
        retrievedContext: retrievalResponse.results,
        citations: this.citationTracker.deduplicate(citations),
        confidence,
        grounded: true,
        conversationId,
        metadata: {
          tokensUsed: answerResponse.tokensUsed,
          processingTime: totalTime,
          model: answerResponse.model,
          retrievalTime: retrievalResponse.retrievalTime,
          generationTime: answerResponse.generationTime,
        },
      };
    } catch (error) {
      console.error('RAG Engine error:', error);
      throw error;
    }
  }

  /**
   * Build response when no context found
   */
  private buildNoContextResponse(request: QueryRequest, startTime: number): RAGResponse {
    const conversationId = request.context?.conversationId || this.generateConversationId();

    return {
      answer: this.config.rag.fallbackMessage,
      retrievedContext: [],
      citations: [],
      confidence: 0,
      grounded: false,
      conversationId,
      metadata: {
        tokensUsed: 0,
        processingTime: Date.now() - startTime,
        model: this.config.rag.llmModel,
        retrievalTime: 0,
        generationTime: 0,
      },
    };
  }

  /**
   * Create answer generator based on provider
   */
  private createAnswerGenerator(): AnswerGenerator {
    const provider = this.config.rag.llmProvider;
    const providerConfig = this.config.llmProviders[provider];

    if (!providerConfig) {
      throw new Error(`LLM provider ${provider} not configured`);
    }

    return new AnswerGenerator(
      provider,
      providerConfig.apiKey,
      providerConfig.defaultModel,
      providerConfig.baseUrl
    );
  }

  /**
   * Get namespace from context
   */
  private getNamespace(context?: QueryRequest['context']): string | undefined {
    if (!context) return undefined;

    return this.vectorStore.getNamespace({
      projectId: context.projectId,
      supplierId: context.supplierId,
    });
  }

  /**
   * Build metadata filters from context
   */
  private buildFilters(context?: QueryRequest['context']): Record<string, any> | undefined {
    if (!context?.metadata) return undefined;

    const filters = this.vectorStore.buildQuery();

    if (context.projectId) {
      filters.forProject(context.projectId);
    }

    if (context.supplierId) {
      filters.forSupplier(context.supplierId);
    }

    Object.entries(context.metadata).forEach(([key, value]) => {
      filters.equals(key, value);
    });

    return filters.build();
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(results: RetrievalResult[]): number {
    if (results.length === 0) return 0;

    // Simple average of top results' scores
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

    return Math.min(avgScore, 1);
  }

  /**
   * Store message in conversation
   */
  private storeMessage(
    conversationId: string | undefined,
    question: string,
    answer: string,
    context?: QueryRequest['context']
  ): string {
    const id = conversationId || this.generateConversationId();

    let conversation = this.conversations.get(id);

    if (!conversation) {
      conversation = {
        id,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: context,
      };
    }

    conversation.messages.push(
      {
        role: 'user',
        content: question,
        timestamp: new Date().toISOString(),
      },
      {
        role: 'assistant',
        content: answer,
        timestamp: new Date().toISOString(),
      }
    );

    conversation.updatedAt = new Date().toISOString();

    this.conversations.set(id, conversation);

    return id;
  }

  /**
   * Generate conversation ID
   */
  private generateConversationId(): string {
    return `conv-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Get conversation
   */
  getConversation(conversationId: string): Conversation | undefined {
    return this.conversations.get(conversationId);
  }

  /**
   * Clear conversation
   */
  clearConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
  }
}
