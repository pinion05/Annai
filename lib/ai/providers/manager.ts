import { openrouter, getAllOpenRouterModels } from './openrouter';
import { together, getAllTogetherModels } from './together';

export interface AIProvider {
  name: string;
  provider: any;
  models: Record<string, string>;
}

export const aiProviders: Record<string, AIProvider> = {
  openrouter: {
    name: 'OpenRouter',
    provider: openrouter,
    models: getAllOpenRouterModels().reduce((acc: Record<string, string>, { id, name }) => {
      acc[id] = name;
      return acc;
    }, {}),
  },
  together: {
    name: 'Together AI',
    provider: together,
    models: getAllTogetherModels().reduce((acc: Record<string, string>, { id, name }) => {
      acc[id] = name;
      return acc;
    }, {}),
  },
};

export function getProvider(providerName: string) {
  return aiProviders[providerName]?.provider;
}

export function getAvailableModels(providerName: string): Record<string, string> {
  return aiProviders[providerName]?.models || {};
}

export function getAllProviders(): Array<{ id: string; name: string }> {
  return Object.entries(aiProviders).map(([id, provider]) => ({ id, name: provider.name }));
}

export function updateProviderApiKey(providerName: string, apiKey: string) {
  const provider = aiProviders[providerName];
  if (provider) {
    // API 키 업데이트
    if (providerName === 'openrouter') {
      // OpenRouter는 createOpenRouter로 재생성 필요
      const { createOpenRouter } = require('@openrouter/ai-sdk-provider');
      aiProviders.openrouter.provider = createOpenRouter({ apiKey });
    } else if (providerName === 'together') {
      // Together AI는 createOpenAICompatible로 재생성 필요
      const { createOpenAICompatible } = require('@ai-sdk/openai-compatible');
      aiProviders.together.provider = createOpenAICompatible({
        name: 'together',
        apiKey,
        baseURL: 'https://api.together.xyz/v1',
      });
    }
  }
}
