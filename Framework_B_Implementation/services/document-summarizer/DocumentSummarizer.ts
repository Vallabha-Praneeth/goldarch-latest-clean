/**
 * Framework B - Document Summarizer
 * Generate AI-powered summaries of documents
 */

import type { VectorStore } from '../vector-store/VectorStore';
import type { EmbeddingsService } from '../embeddings/EmbeddingsService';
import { AnswerGenerator } from '../rag/answer-generator';
import type { LLMProvider, LLMModel } from '../../types/rag.types';

export interface SummarizeDocumentRequest {
  documentId: string;
  namespace?: string;
  summaryType?: 'brief' | 'detailed' | 'bullet-points';
  maxLength?: number;
}

export interface SummarizeDocumentResponse {
  summary: string;
  documentId: string;
  summaryType: string;
  metadata: {
    chunkCount: number;
    totalTokens: number;
    processingTime: number;
    model: string;
  };
}

export class DocumentSummarizer {
  private vectorStore: VectorStore;
  private embeddingsService: EmbeddingsService;
  private answerGenerator: AnswerGenerator;

  constructor(
    vectorStore: VectorStore,
    embeddingsService: EmbeddingsService,
    llmProvider: LLMProvider,
    llmApiKey: string,
    defaultModel: LLMModel
  ) {
    this.vectorStore = vectorStore;
    this.embeddingsService = embeddingsService;
    this.answerGenerator = new AnswerGenerator(
      llmProvider,
      llmApiKey,
      defaultModel
    );
  }

  /**
   * Generate a summary of a document
   */
  async summarizeDocument(
    request: SummarizeDocumentRequest
  ): Promise<SummarizeDocumentResponse> {
    const startTime = Date.now();
    const summaryType = request.summaryType || 'brief';

    // Step 1: Retrieve all chunks for this document
    const embedding = await this.embeddingsService.generateEmbedding(
      `document content ${request.documentId}`
    );

    const searchResults = await this.vectorStore.search({
      queryEmbedding: embedding.vector,
      topK: 50, // Get many chunks to cover the whole document
      namespace: request.namespace,
      minScore: 0.1, // Low threshold to get all document chunks
    });

    // Filter to only chunks from this specific document
    const documentChunks = searchResults.results.filter(
      (result) => result.documentId === request.documentId
    );

    if (documentChunks.length === 0) {
      throw new Error(`Document ${request.documentId} not found in vector store`);
    }

    // Step 2: Combine all chunk content
    const fullContent = documentChunks
      .sort((a, b) => {
        const posA = a.metadata?.position || 0;
        const posB = b.metadata?.position || 0;
        return posA - posB;
      })
      .map((chunk) => chunk.content)
      .join('\n\n');

    // Step 3: Build summary prompt based on type
    const systemPrompt = this.getSystemPrompt(summaryType);
    const userPrompt = this.getUserPrompt(fullContent, summaryType, request.maxLength);

    // Step 4: Generate summary using LLM
    const response = await this.answerGenerator.generate({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      maxTokens: this.getMaxTokens(summaryType, request.maxLength),
    });

    const processingTime = Date.now() - startTime;

    return {
      summary: response.answer,
      documentId: request.documentId,
      summaryType,
      metadata: {
        chunkCount: documentChunks.length,
        totalTokens: response.tokensUsed,
        processingTime,
        model: response.model,
      },
    };
  }

  /**
   * Generate multiple summaries for different documents in parallel
   */
  async summarizeDocuments(
    requests: SummarizeDocumentRequest[]
  ): Promise<SummarizeDocumentResponse[]> {
    const promises = requests.map((request) => this.summarizeDocument(request));
    return await Promise.all(promises);
  }

  /**
   * Get system prompt for summary generation
   */
  private getSystemPrompt(summaryType: string): string {
    const basePrompt = `You are a professional document summarizer. Your task is to create accurate,
concise summaries that capture the key information and main points of documents.`;

    switch (summaryType) {
      case 'brief':
        return `${basePrompt} Create a brief, high-level summary focusing on the most important points.`;

      case 'detailed':
        return `${basePrompt} Create a comprehensive summary that covers all major points and important details.`;

      case 'bullet-points':
        return `${basePrompt} Create a summary using clear bullet points that organize the key information logically.`;

      default:
        return basePrompt;
    }
  }

  /**
   * Get user prompt for summary generation
   */
  private getUserPrompt(
    content: string,
    summaryType: string,
    maxLength?: number
  ): string {
    const lengthGuidance = maxLength
      ? `Keep the summary to approximately ${maxLength} words.`
      : this.getDefaultLengthGuidance(summaryType);

    let format = '';
    if (summaryType === 'bullet-points') {
      format = 'Format your response as a bulleted list with clear, concise points.';
    }

    return `Please summarize the following document content:

${content}

${lengthGuidance}
${format}

Provide a clear, accurate summary that captures the essential information.`;
  }

  /**
   * Get default length guidance based on summary type
   */
  private getDefaultLengthGuidance(summaryType: string): string {
    switch (summaryType) {
      case 'brief':
        return 'Keep the summary to 2-3 sentences (50-75 words).';
      case 'detailed':
        return 'Provide a thorough summary of 200-300 words.';
      case 'bullet-points':
        return 'Use 5-10 bullet points covering the main topics.';
      default:
        return 'Keep the summary concise and focused.';
    }
  }

  /**
   * Get max tokens based on summary type
   */
  private getMaxTokens(summaryType: string, customMax?: number): number {
    if (customMax) {
      // Rough estimate: 1 word ≈ 1.3 tokens
      return Math.ceil(customMax * 1.5);
    }

    switch (summaryType) {
      case 'brief':
        return 150;
      case 'detailed':
        return 500;
      case 'bullet-points':
        return 300;
      default:
        return 250;
    }
  }
}
