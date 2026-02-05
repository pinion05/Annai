import { DEFAULT_MODEL } from './constants';

export interface RecommendedModel {
  id: string;
  name: string;
  description: string;
}

export const RECOMMENDED_MODELS: RecommendedModel[] = [
  {
    id: 'nvidia/nemotron-3-nano-30b-a3b:free',
    name: 'NVIDIA Nemotron 3 Nano (30B)',
    description: 'Fast and efficient free model',
  },
  {
    id: 'google/gemma-7b-it:free',
    name: 'Google Gemma 7B Instruct',
    description: 'Google lightweight instruction model',
  },
  {
    id: 'meta-llama/llama-3-8b-instruct:free',
    name: 'Meta Llama 3 8B Instruct',
    description: 'Meta instruction following model',
  },
  {
    id: 'microsoft/phi-3-medium-128k-instruct:free',
    name: 'Microsoft Phi-3 Medium',
    description: '128k context window, high quality',
  },
  {
    id: 'qwen/qwen-2-7b-instruct:free',
    name: 'Qwen 2 7B Instruct',
    description: 'Alibaba multilingual model',
  },
];

export { DEFAULT_MODEL };
