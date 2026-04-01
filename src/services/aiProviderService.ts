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

// API endpoints for each provider
const PROVIDER_ENDPOINTS: Record<string, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
  xai: 'https://api.x.ai/v1/chat/completions',
  mistral: 'https://api.mistral.ai/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  alibaba: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  cohere: 'https://api.cohere.ai/v2/chat',
  perplexity: 'https://api.perplexity.ai/chat/completions',
  together: 'https://api.together.ai/v1/chat/completions',
  cerebras: 'https://api.cerebras.ai/v1/chat/completions',
  replicate: 'https://api.replicate.com/v1/chat/completions',
};

// Providers that use OpenAI-compatible API format
const OPENAI_COMPATIBLE_PROVIDERS = [
  'openai', 'xai', 'mistral', 'deepseek', 'alibaba', 'groq', 
  'together', 'cerebras', 'perplexity'
];

// Providers known to support CORS from browsers
const CORS_FRIENDLY_PROVIDERS = ['gemini', 'anthropic'];

class AIProviderService {
  /**
   * Get the user-configured CORS proxy URL, or the default one.
   * Returns empty string if no proxy should be used.
   */
  private getCorsProxy(): string {
    try {
      return localStorage.getItem('nexus_cors_proxy') || 'https://corsproxy.io/?';
    } catch {
      return 'https://corsproxy.io/?';
    }
  }

  /**
   * Wrap a URL with the CORS proxy if needed.
   * Only proxies non-CORS-friendly providers.
   */
  private proxiedUrl(provider: string, url: string): string {
    if (CORS_FRIENDLY_PROVIDERS.includes(provider)) return url;
    const proxy = this.getCorsProxy();
    if (!proxy) return url;
    return `${proxy}${encodeURIComponent(url)}`;
  }

  private async callProxy(provider: string, config: AIProviderConfig, body: any): Promise<any> {
    // Always use direct calls — works with CORS proxy for static hosting
    return this.callDirect(provider, config, body);
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
      case 'xai':
        url = 'https://api.x.ai/v1/chat/completions';
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        break;
      case 'mistral':
        url = 'https://api.mistral.ai/v1/chat/completions';
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        break;
      case 'deepseek':
        url = 'https://api.deepseek.com/v1/chat/completions';
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        break;
      case 'alibaba':
        url = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        break;
      case 'groq':
        url = 'https://api.groq.com/openai/v1/chat/completions';
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        break;
      case 'together':
        url = 'https://api.together.ai/v1/chat/completions';
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        break;
      case 'perplexity':
        url = 'https://api.perplexity.ai/chat/completions';
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        break;
      case 'cerebras':
        url = 'https://api.cerebras.ai/v1/chat/completions';
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        break;
      case 'cohere':
        url = 'https://api.cohere.ai/v2/chat';
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        break;
      case 'ollama':
        url = `${config.baseURL || 'http://localhost:11434'}/api/chat`;
        break;
      default:
        throw new Error(`Direct calls not supported for ${provider}`);
    }

    // Apply CORS proxy for non-CORS-friendly providers
    const fetchUrl = this.proxiedUrl(provider, url);

    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      let errorMsg = `${provider} API error: ${response.statusText}`;
      try {
        const error = await response.json();
        errorMsg = error.error?.message || error.error || errorMsg;
      } catch {
        // Response body is not JSON, use status text
      }
      throw new Error(errorMsg);
    }

    return response.json();
  }

  /** Get the current CORS proxy URL setting */
  getCorsProxySetting(): string {
    try {
      return localStorage.getItem('nexus_cors_proxy') || 'https://corsproxy.io/?';
    } catch {
      return 'https://corsproxy.io/?';
    }
  }

  /** Set a custom CORS proxy URL (empty string = no proxy) */
  setCorsProxySetting(proxy: string): void {
    try {
      localStorage.setItem('nexus_cors_proxy', proxy);
    } catch {
      // Ignore
    }
  }

  async callProvider(provider: string, config: AIProviderConfig, prompt: string): Promise<AIResponse> {
    const body = {
      model: config.model,
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: config.temperature ?? 0.2,
      max_tokens: config.maxTokens ?? 2048,
    };

    // Special handling for Gemini (uses Google's Generative AI REST API)
    if (provider === 'gemini') {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
      const geminiBody = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: config.systemPrompt }] },
        generationConfig: {
          temperature: config.temperature ?? 0.2,
          maxOutputTokens: config.maxTokens ?? 2048,
        },
      };
      const data = await this.callProxy(provider, config, geminiBody);
      // Fallback: try direct call for static hosting
      let geminiData = data;
      if (window.location.host.includes('github.io') || window.location.host.includes('vercel.app')) {
        const directResp = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiBody),
        });
        if (directResp.ok) geminiData = await directResp.json();
      }
      return {
        text: geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '',
        usage: {
          inputTokens: geminiData.usageMetadata?.promptTokenCount || 0,
          outputTokens: geminiData.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: geminiData.usageMetadata?.totalTokenCount || 0,
        },
      };
    }

    // Special handling for Anthropic structure
    if (provider === 'anthropic') {
      const anthropicBody = {
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        system: config.systemPrompt,
        max_tokens: config.maxTokens ?? 4096,
        temperature: config.temperature ?? 0.2
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

    // Special handling for Cohere
    if (provider === 'cohere') {
      const cohereBody = {
        model: config.model,
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: config.temperature ?? 0.2,
        max_tokens: config.maxTokens ?? 2048,
      };
      const data = await this.callProxy(provider, config, cohereBody);
      return {
        text: data.message?.content?.[0]?.text || data.text || '',
        usage: {
          inputTokens: data.usage?.tokens?.input_tokens || 0,
          outputTokens: data.usage?.tokens?.output_tokens || 0,
          totalTokens: data.usage?.tokens?.total_tokens || 0,
        },
      };
    }

    // Special handling for Ollama
    if (provider === 'ollama') {
      const ollamaBody = {
        model: config.model,
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: prompt }
        ],
        stream: false,
        options: {
          temperature: config.temperature ?? 0.2,
          num_predict: config.maxTokens ?? 2048,
        }
      };
      const data = await this.callProxy(provider, config, ollamaBody);
      return {
        text: data.message?.content || '',
        usage: {
          inputTokens: data.prompt_eval_count || 0,
          outputTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
      };
    }

    // OpenAI-compatible providers (OpenAI, xAI, Mistral, DeepSeek, Alibaba, Groq, Together, Perplexity, Cerebras)
    const data = await this.callProxy(provider, config, body);
    
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

  // Get available models for a provider (static list)
  getAvailableModels(provider: string): string[] {
    const models: Record<string, string[]> = {
      openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini', 'o3-mini'],
      anthropic: ['claude-opus-4-20250514', 'claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
      xai: ['grok-3', 'grok-3-fast', 'grok-3-mini', 'grok-2-1212', 'grok-2-vision-1212', 'grok-beta'],
      mistral: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'codestral-latest', 'pixtral-large-latest', 'ministral-8b-latest'],
      deepseek: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner', 'deepseek-r1'],
      alibaba: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen-long', 'qwen-coder-plus', 'qwen-coder-turbo', 'qwen-vl-max'],
      groq: ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it', 'deepseek-r1-distill-llama-70b'],
      cohere: ['command-r-plus-08-2024', 'command-r-08-2024', 'command', 'command-light', 'command-nightly'],
      perplexity: ['sonar-pro', 'sonar', 'sonar-reasoning-pro', 'sonar-reasoning', 'r1-1776'],
      together: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo', 'mistralai/Mistral-Small-24B-Instruct-2501', 'Qwen/Qwen2.5-72B-Instruct-Turbo', 'deepseek-ai/DEEPSEEK-R1'],
      cerebras: ['llama-3.3-70b', 'llama-3.1-70b', 'llama-3.1-8b'],
      ollama: ['llama3.2', 'llama3.1', 'llama3', 'mistral', 'codellama', 'deepseek-coder-v2', 'qwen2.5-coder', 'phi4', 'gemma3', 'dolphin-mixtral'],
    };
    return models[provider] || [];
  }
}

export default new AIProviderService();
