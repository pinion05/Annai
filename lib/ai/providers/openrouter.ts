import { createOpenRouter } from '@openrouter/ai-sdk-provider';

export const openrouter = createOpenRouter({
  apiKey: '', // API 키는 설정에서 가져옴
});

export const openrouterModels = {
  'anthropic/claude-3.5-sonnet': 'Claude 3.5 Sonnet',
  'anthropic/claude-3.5-haiku': 'Claude 3.5 Haiku',
  'openai/gpt-4o': 'GPT-4o',
  'openai/gpt-4o-mini': 'GPT-4o Mini',
  'openai/gpt-4-turbo': 'GPT-4 Turbo',
  'meta-llama/llama-3.1-70b-instruct': 'Llama 3.1 70B',
  'meta-llama/llama-3.1-8b-instruct': 'Llama 3.1 8B',
  'google/gemini-pro-1.5': 'Gemini Pro 1.5',
  'google/gemini-1.5-flash': 'Gemini 1.5 Flash',
};

export type OpenRouterModel = keyof typeof openrouterModels;

export function getOpenRouterModelName(modelId: OpenRouterModel): string {
  return openrouterModels[modelId];
}

export function getAllOpenRouterModels(): Array<{ id: OpenRouterModel; name: string }> {
  return Object.entries(openrouterModels).map(([id, name]) => ({ id: id as OpenRouterModel, name }));
}
