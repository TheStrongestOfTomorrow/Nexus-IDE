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
  private async callProxy(provider: string, config: AIProviderConfig, body: any): Promise<any> {
    const isStatic = window.location.host.includes('github.io') || 
                    window.location.host.includes('vercel.app') || 
                    window.location.host.includes('netlify.app');

    // If static mode, try direct API calls
    if (isStatic) {
      return this.callDirect(provider, config, body);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    };

    if (provider === 'ollama' && config.baseURL) {
      headers['x-ollama-url'] = config.baseURL;
    }

    const response = await fetch(`/api/ai/${provider}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `${provider} API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async callDirect(provider: string, config: AIProviderConfig, body: any): Promise<any> {
    let url = '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    switch (provider) {
      case 'openai':
        url = 'https://api.openai.com/v1/chat/completions';
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        break;
      case 'anthropic':
        url = 'https://api.anthropic.com/v1/messages';
        headers['x-api-key'] = config.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        headers['anthropic-dangerous-direct-browser-access'] = 'true';
        break;
      case 'groq':
        url = 'https://api.groq.com/openai/v1/chat/completions';
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        break;
      case 'deepseek':
        url = 'https://api.deepseek.com/v1/chat/completions';
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        break;
      case 'ollama':
        url = `${config.baseURL || 'http://localhost:11434'}/api/chat`;
        break;
      default:
        throw new Error(`Direct calls not supported for ${provider}`);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || error.error || `${provider} API error: ${response.statusText}`);
    }

    return response.json();
  }

  async callProvider(provider: string, config: AIProviderConfig, prompt: string): Promise<AIResponse> {
    const body = {
      model: config.model,
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: config.temperature || 0.2,
      max_tokens: config.maxTokens || 2048,
    };

    // Special handling for Anthropic structure
    if (provider === 'anthropic') {
      const anthropicBody = {
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        system: config.systemPrompt,
        max_tokens: config.maxTokens || 2048,
        temperature: config.temperature || 0.2
      };
      const data = await this.callProxy(provider, config, anthropicBody);
      return {
        text: data.content[0]?.text || '',
        usage: {
          inputTokens: data.usage?.input_tokens || 0,
          outputTokens: data.usage?.output_tokens || 0,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
      };
    }

    const data = await this.callProxy(provider, config, body);
    
    // Unified response parsing for OpenAI-compatible providers (Mistral, Groq, Deepseek, Together)
    return {
      text: data.choices?.[0]?.message?.content || data.message?.content || '',
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
