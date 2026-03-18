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
    website: 'platform.openai.com',
    color: '#00A67E',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable, best for complex reasoning and coding.', costTier: 'premium', tags: ['reasoning', 'coding', 'multimodal'], contextWindow: 128000 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and cost-efficient.', costTier: 'standard', tags: ['fast', 'coding'], contextWindow: 128000 },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Previous generation powerful model.', costTier: 'premium', tags: ['reasoning', 'coding'], contextWindow: 128000 },
      { id: 'gpt-4', name: 'GPT-4', description: 'Classic reasoning model.', costTier: 'premium', tags: ['reasoning'] },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and reliable.', costTier: 'budget', tags: ['fast', 'budget'] },
      { id: 'o1-preview', name: 'O1 Preview', description: 'Advanced reasoning with extended thinking.', costTier: 'premium', tags: ['reasoning', 'math', 'logic'] },
      { id: 'o1-mini', name: 'O1 Mini', description: 'Fast reasoning model.', costTier: 'standard', tags: ['reasoning', 'fast'] },
      { id: 'o3-mini', name: 'O3 Mini', description: 'Latest efficient reasoning model.', costTier: 'standard', tags: ['reasoning', 'fast', 'coding'] },
    ]
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    website: 'makersuite.google.com',
    color: '#4285F4',
    models: [
      { id: 'gemini-2.5-pro-preview-06-05', name: 'Gemini 2.5 Pro', description: 'Latest Gemini with advanced reasoning.', costTier: 'premium', tags: ['reasoning', 'multimodal', 'latest'], contextWindow: 1000000 },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Fast and versatile multimodal model.', costTier: 'standard', tags: ['fast', 'multimodal', 'reasoning'], contextWindow: 1000000 },
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', description: 'Lightweight and cost-effective.', costTier: 'budget', tags: ['fast', 'budget'], contextWindow: 1000000 },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Previous generation with long context.', costTier: 'premium', tags: ['reasoning', 'long-context'], contextWindow: 2000000 },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast with extended context.', costTier: 'standard', tags: ['fast'], contextWindow: 1000000 },
      { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', description: 'Smallest, fastest Gemini model.', costTier: 'budget', tags: ['fast', 'budget'], contextWindow: 1000000 },
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    website: 'console.anthropic.com',
    color: '#D97706',
    models: [
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', description: 'Most intelligent, best for complex analysis.', costTier: 'premium', tags: ['reasoning', 'analysis', 'expert'], contextWindow: 200000 },
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'Ideal balance of intelligence and speed.', costTier: 'standard', tags: ['balanced', 'general'], contextWindow: 200000 },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Previous generation balanced model.', costTier: 'standard', tags: ['balanced', 'coding'], contextWindow: 200000 },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Fastest and most cost-efficient.', costTier: 'budget', tags: ['fast', 'budget'], contextWindow: 200000 },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Previous high-intelligence model.', costTier: 'premium', tags: ['reasoning'] },
    ]
  },
  {
    id: 'xai',
    name: 'xAI (Grok)',
    website: 'console.x.ai',
    color: '#000000',
    models: [
      { id: 'grok-3', name: 'Grok 3', description: 'Latest xAI model with advanced reasoning.', costTier: 'premium', tags: ['reasoning', 'coding', 'latest'], contextWindow: 131072 },
      { id: 'grok-3-fast', name: 'Grok 3 Fast', description: 'Faster variant of Grok 3.', costTier: 'standard', tags: ['fast', 'reasoning'], contextWindow: 131072 },
      { id: 'grok-3-mini', name: 'Grok 3 Mini', description: 'Lightweight Grok for simple tasks.', costTier: 'budget', tags: ['fast', 'budget'], contextWindow: 131072 },
      { id: 'grok-2-1212', name: 'Grok 2', description: 'Previous generation Grok.', costTier: 'standard', tags: ['reasoning', 'coding'], contextWindow: 131072 },
      { id: 'grok-2-vision-1212', name: 'Grok 2 Vision', description: 'Grok with image understanding.', costTier: 'premium', tags: ['multimodal', 'vision'], contextWindow: 32768 },
      { id: 'grok-beta', name: 'Grok Beta', description: 'Beta access to latest features.', costTier: 'standard', tags: ['beta'], contextWindow: 131072 },
    ]
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    website: 'console.mistral.ai',
    color: '#FF6B35',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large', description: 'Most capable for complex reasoning.', costTier: 'premium', tags: ['reasoning', 'coding'], contextWindow: 128000 },
      { id: 'mistral-medium-latest', name: 'Mistral Medium', description: 'Balanced performance and cost.', costTier: 'standard', tags: ['balanced'], contextWindow: 128000 },
      { id: 'mistral-small-latest', name: 'Mistral Small', description: 'Fast and cost-efficient.', costTier: 'budget', tags: ['fast'], contextWindow: 128000 },
      { id: 'codestral-latest', name: 'Codestral', description: 'Specialized for code generation.', costTier: 'standard', tags: ['coding', 'expert'], contextWindow: 256000 },
      { id: 'pixtral-large-latest', name: 'Pixtral Large', description: 'Multimodal with vision.', costTier: 'premium', tags: ['multimodal', 'vision'], contextWindow: 128000 },
      { id: 'ministral-8b-latest', name: 'Ministral 8B', description: 'Lightweight edge model.', costTier: 'budget', tags: ['fast', 'edge'], contextWindow: 128000 },
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    website: 'platform.deepseek.com',
    color: '#1E90FF',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', description: 'Advanced chat and reasoning.', costTier: 'standard', tags: ['reasoning', 'chat'], contextWindow: 64000 },
      { id: 'deepseek-coder', name: 'DeepSeek Coder', description: 'Specialized for code generation.', costTier: 'standard', tags: ['coding', 'expert'], contextWindow: 64000 },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', description: 'Extended reasoning capabilities.', costTier: 'premium', tags: ['reasoning', 'analysis'], contextWindow: 64000 },
      { id: 'deepseek-r1', name: 'DeepSeek R1', description: 'Advanced reasoning model.', costTier: 'premium', tags: ['reasoning', 'math', 'logic'], contextWindow: 64000 },
    ]
  },
  {
    id: 'alibaba',
    name: 'Alibaba Qwen',
    website: 'bailian.console.aliyun.com',
    color: '#FF6A00',
    models: [
      { id: 'qwen-max', name: 'Qwen Max', description: 'Most powerful Qwen model.', costTier: 'premium', tags: ['reasoning', 'coding'], contextWindow: 32768 },
      { id: 'qwen-plus', name: 'Qwen Plus', description: 'Balanced performance.', costTier: 'standard', tags: ['balanced'], contextWindow: 131072 },
      { id: 'qwen-turbo', name: 'Qwen Turbo', description: 'Fast and efficient.', costTier: 'budget', tags: ['fast'], contextWindow: 131072 },
      { id: 'qwen-long', name: 'Qwen Long', description: 'Extended context handling.', costTier: 'standard', tags: ['long-context'], contextWindow: 1000000 },
      { id: 'qwen-coder-plus', name: 'Qwen Coder Plus', description: 'Coding specialist.', costTier: 'standard', tags: ['coding'], contextWindow: 131072 },
      { id: 'qwen-coder-turbo', name: 'Qwen Coder Turbo', description: 'Fast coding model.', costTier: 'budget', tags: ['coding', 'fast'], contextWindow: 131072 },
      { id: 'qwen-vl-max', name: 'Qwen VL Max', description: 'Vision-language model.', costTier: 'premium', tags: ['multimodal', 'vision'], contextWindow: 32768 },
    ]
  },
  {
    id: 'groq',
    name: 'Groq',
    website: 'console.groq.com',
    color: '#00C7FD',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: 'Versatile and super fast.', costTier: 'budget', tags: ['fast', 'budget'], contextWindow: 128000 },
      { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', description: 'Fast inference model.', costTier: 'budget', tags: ['fast'], contextWindow: 131072 },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', description: 'Ultra-fast lightweight.', costTier: 'free', tags: ['fast', 'free', 'lightweight'], contextWindow: 128000 },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: 'Fastest MoE model.', costTier: 'budget', tags: ['fast', 'reasoning'], contextWindow: 32768 },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B', description: 'Google\'s efficient model.', costTier: 'free', tags: ['fast', 'free'], contextWindow: 8192 },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill', description: 'Reasoning on Groq.', costTier: 'budget', tags: ['reasoning', 'fast'], contextWindow: 131072 },
    ]
  },
  {
    id: 'cohere',
    name: 'Cohere',
    website: 'cohere.com',
    color: '#39594D',
    models: [
      { id: 'command-r-plus-08-2024', name: 'Command R+', description: 'Most powerful Cohere model.', costTier: 'premium', tags: ['reasoning', 'rag'], contextWindow: 128000 },
      { id: 'command-r-08-2024', name: 'Command R', description: 'Balanced reasoning and efficiency.', costTier: 'standard', tags: ['balanced', 'rag'], contextWindow: 128000 },
      { id: 'command', name: 'Command', description: 'General purpose model.', costTier: 'standard', tags: ['general'], contextWindow: 4096 },
      { id: 'command-light', name: 'Command Light', description: 'Fast and cost-effective.', costTier: 'budget', tags: ['fast'], contextWindow: 4096 },
      { id: 'command-nightly', name: 'Command Nightly', description: 'Latest experimental features.', costTier: 'standard', tags: ['experimental'], contextWindow: 4096 },
    ]
  },
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    website: 'www.perplexity.ai',
    color: '#00D084',
    models: [
      { id: 'sonar-pro', name: 'Sonar Pro', description: 'Most advanced with real-time search.', costTier: 'premium', tags: ['reasoning', 'search', 'real-time'], contextWindow: 200000 },
      { id: 'sonar', name: 'Sonar', description: 'Fast with internet search.', costTier: 'standard', tags: ['fast', 'search'], contextWindow: 127072 },
      { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro', description: 'Deep reasoning with search.', costTier: 'premium', tags: ['reasoning', 'search'], contextWindow: 127072 },
      { id: 'sonar-reasoning', name: 'Sonar Reasoning', description: 'Reasoning with web access.', costTier: 'standard', tags: ['reasoning', 'search'], contextWindow: 127072 },
      { id: 'r1-1776', name: 'R1 1776', description: 'DeepSeek R1 with search.', costTier: 'standard', tags: ['reasoning', 'search'], contextWindow: 127072 },
    ]
  },
  {
    id: 'together',
    name: 'Together AI',
    website: 'www.together.ai',
    color: '#9D4EDD',
    models: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B', description: 'Meta\'s powerful open model.', costTier: 'standard', tags: ['open-source', 'reasoning'], contextWindow: 131072 },
      { id: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo', name: 'Llama 3.2 90B Vision', description: 'Multimodal Llama.', costTier: 'premium', tags: ['open-source', 'vision'], contextWindow: 131072 },
      { id: 'mistralai/Mistral-Small-24B-Instruct-2501', name: 'Mistral Small 24B', description: 'Efficient Mistral model.', costTier: 'budget', tags: ['fast'], contextWindow: 32768 },
      { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B', description: 'Powerful Qwen model.', costTier: 'standard', tags: ['reasoning', 'coding'], contextWindow: 32768 },
      { id: 'deepseek-ai/DEEPSEEK-R1', name: 'DeepSeek R1', description: 'Open reasoning model.', costTier: 'standard', tags: ['reasoning', 'open-source'], contextWindow: 16384 },
    ]
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    color: '#646464',
    models: [
      { id: 'llama3.2', name: 'Llama 3.2', description: 'Latest open-source Llama.', tags: ['self-hosted', 'open-source'], contextWindow: 128000 },
      { id: 'llama3.1', name: 'Llama 3.1', description: 'Previous Llama generation.', tags: ['self-hosted', 'open-source'], contextWindow: 128000 },
      { id: 'llama3', name: 'Llama 3', description: 'Meta\'s open-source model.', tags: ['self-hosted', 'open-source'], contextWindow: 8192 },
      { id: 'mistral', name: 'Mistral', description: 'High-performance open model.', tags: ['self-hosted', 'open-source'], contextWindow: 32768 },
      { id: 'codellama', name: 'Code Llama', description: 'Specialized for code.', tags: ['self-hosted', 'coding'], contextWindow: 16384 },
      { id: 'deepseek-coder-v2', name: 'DeepSeek Coder V2', description: 'Open coding model.', tags: ['self-hosted', 'coding'], contextWindow: 32768 },
      { id: 'qwen2.5-coder', name: 'Qwen 2.5 Coder', description: 'Open Qwen coding model.', tags: ['self-hosted', 'coding'], contextWindow: 32768 },
      { id: 'phi4', name: 'Phi-4', description: 'Microsoft\'s efficient model.', tags: ['self-hosted', 'efficient'], contextWindow: 16384 },
      { id: 'gemma3', name: 'Gemma 3', description: 'Google\'s open model.', tags: ['self-hosted', 'open-source'], contextWindow: 8192 },
      { id: 'dolphin-mixtral', name: 'Dolphin Mixtral', description: 'Uncensored mixtral.', tags: ['self-hosted', 'uncensored'], contextWindow: 32768 },
      { id: 'neural-chat', name: 'Neural Chat', description: 'Intel neural chat model.', tags: ['self-hosted'], contextWindow: 8192 },
    ]
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    website: 'cloud.cerebras.ai',
    color: '#E31937',
    models: [
      { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', description: 'Ultra-fast inference on Cerebras.', costTier: 'standard', tags: ['fast', 'reasoning'], contextWindow: 8192 },
      { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', description: 'Fast Llama inference.', costTier: 'standard', tags: ['fast'], contextWindow: 8192 },
      { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', description: 'Lightning-fast small model.', costTier: 'budget', tags: ['fast', 'budget'], contextWindow: 8192 },
    ]
  },
  {
    id: 'replicate',
    name: 'Replicate',
    website: 'replicate.com',
    color: '#000000',
    models: [
      { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', description: 'Run Llama on Replicate.', costTier: 'standard', tags: ['open-source'], contextWindow: 128000 },
      { id: 'mistralai/mixtral-8x7b-instruct-v0.1', name: 'Mixtral 8x7B', description: 'MoE on Replicate.', costTier: 'standard', tags: ['fast'], contextWindow: 32768 },
      { id: 'deepseek-ai/deepseek-r1', name: 'DeepSeek R1', description: 'Reasoning model.', costTier: 'standard', tags: ['reasoning'], contextWindow: 16384 },
    ]
  },
];

// Quick reference for settings panel
export const POPULAR_MODELS = {
  coding: ['gpt-4o', 'claude-sonnet-4-20250514', 'codestral-latest', 'deepseek-coder', 'qwen-coder-plus'],
  reasoning: ['o1-preview', 'claude-opus-4-20250514', 'gemini-2.5-pro-preview-06-05', 'grok-3', 'deepseek-r1'],
  fast: ['gpt-4o-mini', 'gemini-2.0-flash', 'llama-3.3-70b-versatile', 'claude-3-5-haiku-20241022', 'qwen-turbo'],
  budget: ['gpt-3.5-turbo', 'llama-3.1-8b-instant', 'gemma2-9b-it', 'deepseek-chat', 'mistral-small-latest'],
};

export const MODEL_PRESETS = [
  { name: 'Best Quality', models: { openai: 'gpt-4o', gemini: 'gemini-2.5-pro-preview-06-05', anthropic: 'claude-opus-4-20250514', xai: 'grok-3' } },
  { name: 'Balanced', models: { openai: 'gpt-4o-mini', gemini: 'gemini-2.0-flash', anthropic: 'claude-sonnet-4-20250514', xai: 'grok-3-fast' } },
  { name: 'Fastest', models: { groq: 'llama-3.1-8b-instant', gemini: 'gemini-2.0-flash-lite', openai: 'gpt-4o-mini', xai: 'grok-3-mini' } },
  { name: 'Budget', models: { groq: 'gemma2-9b-it', deepseek: 'deepseek-chat', together: 'mistralai/Mistral-Small-24B-Instruct-2501', alibaba: 'qwen-turbo' } },
  { name: 'Coding', models: { openai: 'gpt-4o', anthropic: 'claude-sonnet-4-20250514', mistral: 'codestral-latest', deepseek: 'deepseek-coder' } },
  { name: 'Reasoning', models: { openai: 'o1-preview', deepseek: 'deepseek-r1', anthropic: 'claude-opus-4-20250514', xai: 'grok-3' } },
];
