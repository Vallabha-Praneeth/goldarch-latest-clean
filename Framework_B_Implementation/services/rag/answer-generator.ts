/**
 * Framework B - Answer Generator
 * Generate answers using LLM
 */

import type { LLMProvider, LLMModel } from '../../types/rag.types';

export interface GenerateAnswerRequest {
  systemPrompt: string;
  userPrompt: string;
  model?: LLMModel;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateAnswerResponse {
  answer: string;
  model: string;
  tokensUsed: number;
  generationTime: number;
}

export class AnswerGenerator {
  private provider: LLMProvider;
  private apiKey: string;
  private defaultModel: LLMModel;
  private baseUrl?: string;

  constructor(
    provider: LLMProvider,
    apiKey: string,
    defaultModel: LLMModel,
    baseUrl?: string
  ) {
    this.provider = provider;
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
    this.baseUrl = baseUrl;
  }

  /**
   * Generate answer using LLM
   */
  async generate(request: GenerateAnswerRequest): Promise<GenerateAnswerResponse> {
    const startTime = Date.now();

    switch (this.provider) {
      case 'openai':
        return await this.generateWithOpenAI(request, startTime);
      case 'anthropic':
        return await this.generateWithClaude(request, startTime);
      case 'google':
        return await this.generateWithGemini(request, startTime);
      default:
        throw new Error(`Unsupported LLM provider: ${this.provider}`);
    }
  }

  /**
   * Generate with OpenAI
   */
  private async generateWithOpenAI(
    request: GenerateAnswerRequest,
    startTime: number
  ): Promise<GenerateAnswerResponse> {
    const url = this.baseUrl || 'https://api.openai.com/v1/chat/completions';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model || this.defaultModel,
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.userPrompt },
        ],
        temperature: request.temperature || 0.3,
        max_tokens: request.maxTokens || 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      answer: data.choices[0].message.content,
      model: data.model,
      tokensUsed: data.usage?.total_tokens || 0,
      generationTime: Date.now() - startTime,
    };
  }

  /**
   * Generate with Anthropic Claude
   */
  private async generateWithClaude(
    request: GenerateAnswerRequest,
    startTime: number
  ): Promise<GenerateAnswerResponse> {
    const url = this.baseUrl || 'https://api.anthropic.com/v1/messages';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model || this.defaultModel,
        system: request.systemPrompt,
        messages: [
          { role: 'user', content: request.userPrompt },
        ],
        temperature: request.temperature || 0.3,
        max_tokens: request.maxTokens || 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Claude API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      answer: data.content[0].text,
      model: data.model,
      tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || 0,
      generationTime: Date.now() - startTime,
    };
  }

  /**
   * Generate with Google Gemini
   */
  private async generateWithGemini(
    request: GenerateAnswerRequest,
    startTime: number
  ): Promise<GenerateAnswerResponse> {
    const model = request.model || this.defaultModel;
    const url = this.baseUrl || `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const response = await fetch(`${url}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${request.systemPrompt}\n\n${request.userPrompt}`,
          }],
        }],
        generationConfig: {
          temperature: request.temperature || 0.3,
          maxOutputTokens: request.maxTokens || 1000,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      answer: data.candidates[0].content.parts[0].text,
      model: model,
      tokensUsed: 0, // Gemini doesn't return token usage in the same format
      generationTime: Date.now() - startTime,
    };
  }

  /**
   * Validate answer
   */
  validateAnswer(answer: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!answer || answer.trim().length === 0) {
      issues.push('Answer is empty');
    }

    if (answer.length < 10) {
      issues.push('Answer is too short');
    }

    // Check for common error patterns
    if (answer.toLowerCase().includes('as an ai') || answer.toLowerCase().includes('i cannot')) {
      issues.push('Answer contains refusal pattern');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
