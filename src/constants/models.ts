export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  costTier?: 'free' | 'budget' | 'standard' | 'premium';
  tags?: string[];
  maxTokens?: number;
  contextWindow?: number;
}

export interface ProviderInfo {
  id: string;
  name: string;
  website?: string;
  icon?: string;
  color?: string;
  models: ModelInfo[];
}

export const AI_PROVIDERS: ProviderInfo[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    website: 'openai.com',
    color: '#00A67E',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable, best for complex reasoning and coding.', costTier: 'premium', tags: ['reasoning', 'coding', 'multimodal'], contextWindow: 128000 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and cost-efficient.', costTier: 'standard', tags: ['fast', 'coding'], contextWindow: 128000 },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Previous generation powerful model.', costTier: 'premium', tags: ['reasoning', 'coding'], contextWindow: 128000 },
      { id: 'gpt-4', name: 'GPT-4', description: 'Classic reasoning model.', costTier: 'premium', tags: ['reasoning'] },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and reliable.', costTier: 'budget', tags: ['fast', 'budget'] },
      { id: 'o1-preview', name: 'O1 Preview', description: 'Advanced reasoning with extended thinking.', costTier: 'premium', tags: ['reasoning', 'math', 'logic'] },
      { id: 'o1-mini', name: 'O1 Mini', description: 'Fast reasoning model.', costTier: 'standard', tags: ['reasoning', 'fast'] },
    ]
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    website: 'makersuite.google.com',
    color: '#4285F4',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Latest Gemini, fastest and most capable.', costTier: 'standard', tags: ['fast', 'multimodal', 'reasoning'], contextWindow: 1000000 },
      { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', description: 'Most advanced with extended context.', costTier: 'premium', tags: ['reasoning', 'long-context'], contextWindow: 2000000 },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Advanced reasoning capabilities.', costTier: 'premium', tags: ['reasoning'] },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast and cost-effective.', costTier: 'standard', tags: ['fast'] },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Previous generation advanced model.', costTier: 'premium' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Previous generation fast model.', costTier: 'standard' },
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    website: 'console.anthropic.com',
    color: '#0066CC',
    models: [
      { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', description: 'Most intelligent, best for analysis.', costTier: 'premium', tags: ['reasoning', 'analysis', 'expert'], contextWindow: 200000 },
      { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', description: 'Ideal balance of intelligence and speed.', costTier: 'standard', tags: ['balanced', 'general'] },
      { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', description: 'Fastest and most cost-efficient.', costTier: 'budget', tags: ['fast', 'budget'] },
      { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', description: 'Previous generation balanced.', costTier: 'standard' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Previous high-intelligence.', costTier: 'premium' },
    ]
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    website: 'console.mistral.ai',
    color: '#FF6B35',
    models: [
      { id: 'mistral-large', name: 'Mistral Large', description: 'Most capable for complex reasoning.', costTier: 'premium', tags: ['reasoning', 'coding'], contextWindow: 128000 },
      { id: 'mistral-medium', name: 'Mistral Medium', description: 'Balanced performance and cost.', costTier: 'standard', tags: ['balanced'] },
      { id: 'mistral-small', name: 'Mistral Small', description: 'Fast and cost-efficient.', costTier: 'budget', tags: ['fast'] },
      { id: 'codestral', name: 'Codestral', description: 'Specialized for code generation.', costTier: 'standard', tags: ['coding', 'expert'] },
    ]
  },
  {
    id: 'cohere',
    name: 'Cohere',
    website: 'cohere.com',
    color: '#6366F1',
    models: [
      { id: 'command-r-plus', name: 'Command R+', description: 'Most powerful Cohere model.', costTier: 'premium', tags: ['reasoning', 'rag'], contextWindow: 128000 },
      { id: 'command-r', name: 'Command R', description: 'Balanced reasoning and efficiency.', costTier: 'standard', tags: ['balanced', 'rag'] },
      { id: 'command-light', name: 'Command Light', description: 'Fast and cost-effective.', costTier: 'budget', tags: ['fast'] },
    ]
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    website: 'www.perplexity.ai',
    color: '#00D084',
    models: [
      { id: 'sonar-pro', name: 'Sonar Pro', description: 'Most advanced with real-time search.', costTier: 'premium', tags: ['reasoning', 'search', 'real-time'] },
      { id: 'sonar', name: 'Sonar', description: 'Fast with internet search.', costTier: 'standard', tags: ['fast', 'search'] },
      { id: 'sonar-small', name: 'Sonar Small', description: 'Lightweight with search.', costTier: 'budget', tags: ['budget', 'search'] },
    ]
  },
  {
    id: 'together',
    name: 'Together AI',
    website: 'www.together.ai',
    color: '#9D4EDD',
    models: [
      { id: 'meta-llama-3-70b', name: 'Llama 3 70B', description: 'Meta\'s powerful open model.', costTier: 'standard', tags: ['open-source', 'reasoning'], contextWindow: 8000 },
      { id: 'meta-llama-2-70b', name: 'Llama 2 70B', description: 'Previous Llama generation.', costTier: 'budget', tags: ['open-source'] },
      { id: 'mistral-7b', name: 'Mistral 7B', description: 'Lightweight high-performance.', costTier: 'budget', tags: ['open-source', 'fast'] },
    ]
  },
  {
    id: 'ollama',
    name: 'Ollama (Self-Hosted)',
    color: '#646464',
    models: [
      { id: 'llama2', name: 'Llama 2', description: 'Meta\'s open-source model.', tags: ['self-hosted', 'open-source'] },
      { id: 'llama3', name: 'Llama 3', description: 'Latest open-source Llama.', tags: ['self-hosted', 'open-source'] },
      { id: 'mistral', name: 'Mistral', description: 'High-performance open model.', tags: ['self-hosted', 'open-source'] },
      { id: 'codellama', name: 'Code Llama', description: 'Specialized for code.', tags: ['self-hosted', 'coding'] },
      { id: 'neural-chat', name: 'Neural Chat', description: 'Intel neural chat model.', tags: ['self-hosted'] },
      { id: 'zephyr', name: 'Zephyr', description: 'Fine-tuned chat model.', tags: ['self-hosted'] },
      { id: 'dolphin-mixtral', name: 'Dolphin Mixtral', description: 'Uncensored mixtral.', tags: ['self-hosted', 'uncensored'] },
    ]
  },
  {
    id: 'groq',
    name: 'Groq',
    website: 'console.groq.com',
    color: '#00C7FD',
    models: [
      { id: 'mixtral-8x7b', name: 'Mixtral 8x7B', description: 'Fastest MoE model.', costTier: 'budget', tags: ['fast', 'budget', 'reasoning'] },
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: 'Super fast inference.', costTier: 'budget', tags: ['fast', 'budget'] },
      { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', description: 'Versatile and quick.', costTier: 'budget', tags: ['fast'] },
      { id: 'gemma-7b-it', name: 'Gemma 7B IT', description: 'Lightweight instruction-tuned.', costTier: 'free', tags: ['fast', 'free', 'lightweight'] },
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    website: 'platform.deepseek.com',
    color: '#1E90FF',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', description: 'Advanced chat and reasoning.', costTier: 'standard', tags: ['reasoning', 'chinese'] },
      { id: 'deepseek-coder', name: 'DeepSeek Coder', description: 'Specialized for code generation.', costTier: 'standard', tags: ['coding', 'expert'] },
      { id: 'deepseek-coder-6.7b', name: 'DeepSeek Coder 6.7B', description: 'Lightweight coding model.', costTier: 'budget', tags: ['coding', 'budget'] },
    ]
  }
];

// Quick reference for settings panel
export const POPULAR_MODELS = {
  coding: ['gpt-4o', 'claude-opus-4-6', 'mistral-large', 'codestral'],
  reasoning: ['o1-preview', 'claude-opus-4-6', 'gemini-3.1-pro', 'mixtral-8x7b'],
  fast: ['gpt-4o-mini', 'gemini-2.0-flash', 'groq-mixtral-8x7b', 'claude-haiku-4-5'],
  budget: ['gpt-3.5-turbo', 'groq-gemma-7b', 'deepseek-coder-6.7b', 'mistral-small'],
};

export const MODEL_PRESETS = [
  { name: 'Best Quality', models: { openai: 'gpt-4o', gemini: 'gemini-3.1-pro', anthropic: 'claude-opus-4-6' } },
  { name: 'Balanced', models: { openai: 'gpt-4o-mini', gemini: 'gemini-2.5-flash', anthropic: 'claude-sonnet-4-6' } },
  { name: 'Fastest', models: { openai: 'gpt-3.5-turbo', gemini: 'gemini-2.0-flash', anthropic: 'claude-haiku-4-5' } },
  { name: 'Budget', models: { groq: 'gemma-7b-it', together: 'mistral-7b', deepseek: 'deepseek-coder-6.7b' } },
];
