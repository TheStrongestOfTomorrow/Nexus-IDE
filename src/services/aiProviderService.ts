// AI Provider Service - Unified interface for all AI providers

export interface AIProviderConfig {
  baseURL?: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  text: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  metadata?: any;
}

class AIProviderService {
  async callProvider(provider: string, config: AIProviderConfig, prompt: string): Promise<AIResponse> {
    switch (provider) {
      case 'mistral':
        return this.callMistral(config, prompt);
      case 'cohere':
        return this.callCohere(config, prompt);
      case 'perplexity':
        return this.callPerplexity(config, prompt);
      case 'together':
        return this.callTogether(config, prompt);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async callMistral(config: AIProviderConfig, prompt: string): Promise<AIResponse> {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: config.temperature || 0.2,
        max_tokens: config.maxTokens || 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      text: data.choices[0]?.message?.content || '',
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  }

  private async callCohere(config: AIProviderConfig, prompt: string): Promise<AIResponse> {
    const response = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        message: prompt,
        preamble: config.systemPrompt,
        temperature: config.temperature || 0.2,
        max_tokens: config.maxTokens || 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cohere API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      text: data.text || '',
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      },
    };
  }

  private async callPerplexity(config: AIProviderConfig, prompt: string): Promise<AIResponse> {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: config.temperature || 0.2,
        max_tokens: config.maxTokens || 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      text: data.choices[0]?.message?.content || '',
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      },
    };
  }

  private async callTogether(config: AIProviderConfig, prompt: string): Promise<AIResponse> {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: config.temperature || 0.2,
        max_tokens: config.maxTokens || 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`Together API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      text: data.choices[0]?.message?.content || '',
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  }

  // Helper method to validate API key
  async validateApiKey(provider: string, apiKey: string, model: string): Promise<boolean> {
    try {
      const response = await this.callProvider(provider, {
        apiKey,
        model,
        systemPrompt: 'You are a helpful assistant.',
        temperature: 0.5,
      }, 'Hello');

      return response.text.length > 0;
    } catch {
      return false;
    }
  }
}

export default new AIProviderService();
