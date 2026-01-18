import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// Together AI 모델 정의
export const togetherModels = {
  // Meta Llama 3.1
  'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo': 'Llama 3.1 8B',
  'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo': 'Llama 3.1 70B',
  'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo': 'Llama 3.1 405B',

  // Mistral
  'mistralai/Mistral-7B-Instruct-v0.3': 'Mistral 7B',
  'mistralai/Mixtral-8x7B-Instruct-v0.1': 'Mixtral 8x7B',
  'mistralai/Mixtral-8x22B-Instruct-v0.1': 'Mixtral 8x22B',

  // Qwen
  'Qwen/Qwen2.5-72B-Instruct-Turbo': 'Qwen2.5 72B',

  // DeepSeek
  'deepseek-ai/DeepSeek-V3': 'DeepSeek V3',
  'deepseek-ai/DeepSeek-R1': 'DeepSeek R1',
} as const;

export type TogetherModel = keyof typeof togetherModels;

export function getTogetherModelName(modelId: TogetherModel): string {
  return togetherModels[modelId];
}

export function getAllTogetherModels(): Array<{ id: TogetherModel; name: string }> {
  return Object.entries(togetherModels).map(([id, name]) => ({ id: id as TogetherModel, name }));
}

// Together AI Provider 생성 함수
export const together = createOpenAICompatible({
  name: 'together',
  apiKey: '', // API 키는 설정에서 가져옴
  baseURL: 'https://api.together.xyz/v1',
});
