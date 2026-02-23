export interface ModelInfo {
  id: string;
  name: string;
  description: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  models: ModelInfo[];
}

export const AI_PROVIDERS: ProviderInfo[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'gpt-5.2', name: 'GPT-5.2', description: 'Best for complex reasoning, broad knowledge, and advanced coding.' },
      { id: 'gpt-5.2-pro', name: 'GPT-5.2 Pro', description: 'Uses more compute for smarter, more precise answers.' },
      { id: 'gpt-5-mini', name: 'GPT-5 Mini', description: 'Faster and more cost-efficient version for general tasks.' },
      { id: 'gpt-5-nano', name: 'GPT-5 Nano', description: 'Fastest and most cost-efficient, ideal for simple instructions.' },
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Fast, multimodal model with text, audio, and vision.' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Highly cost-efficient and faster alternative to GPT-3.5.' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Optimized for chat, reliable and widely used.' },
    ]
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    models: [
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview', description: 'Most advanced model for complex, multimodal tasks.' },
      { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', description: 'Advanced reasoning model.' },
      { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', description: 'Efficient, cost-effective, and fast.' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Stable version of Pro, known for advanced reasoning.' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast, versatile model for general use cases.' },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'Most cost-efficient and fastest option in 2.5 family.' },
      { id: 'gemma-3-27b-it', name: 'Gemma 3 27B IT', description: 'Open Gemma family model available through Gemini API.' },
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    models: [
      { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', description: 'Most intelligent model for complex reasoning and coding.' },
      { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', description: 'Ideal balance of intelligence and speed.' },
      { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', description: 'Fastest and most cost-efficient for high-volume tasks.' },
      { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', description: 'Legacy high-intelligence model.' },
      { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1', description: 'Previous generation high-intelligence model.' },
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'Previous generation balanced model.' },
      { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', description: 'Highly capable balanced model.' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Classic high-intelligence model.' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Classic balanced model.' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Classic fast model.' },
    ]
  }
];
