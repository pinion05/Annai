import { generateText, streamText, stepCountIs } from 'ai';
import { getProvider, updateProviderApiKey } from './providers/manager';
import { SYSTEM_PROMPT } from '../prompts/system-prompt';

export interface ChatOptions {
  provider: string;
  model: string;
  messages: any[];
  stream?: boolean;
  apiKey: string;
  tools?: any;
}

export interface ChatResult {
  text: string;
  toolCalls?: any[];
  toolResults?: any[];
  steps?: any[];
}

export class AIClient {
  async chat(options: ChatOptions): Promise<ChatResult> {
    const provider = getProvider(options.provider);
    if (!provider) {
      throw new Error(`Provider ${options.provider} not found`);
    }

    // API 키 업데이트
    updateProviderApiKey(options.provider, options.apiKey);

    const model = provider(options.model);

    if (options.stream) {
      return this.streamChat(model, options.messages, options.tools);
    } else {
      return this.generateChat(model, options.messages, options.tools);
    }
  }

  private async generateChat(model: any, messages: any[], tools?: any): Promise<ChatResult> {
    const result = await generateText({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      stopWhen: stepCountIs(5), // v6: maxSteps → stopWhen: stepCountIs(5)
      tools,
    });

    return {
      text: result.text,
      toolCalls: result.toolCalls,
      toolResults: result.toolResults,
      steps: result.steps,
    };
  }

  private async streamChat(model: any, messages: any[], tools?: any): Promise<ChatResult> {
    const result = streamText({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      stopWhen: stepCountIs(5),
      tools,
    });

    // v6 스트리밍 처리 - fullStream 사용
    let fullText = '';
    const toolCalls: any[] = [];
    const toolResults: any[] = [];

    for await (const part of result.fullStream) {
      switch (part.type) {
        case 'text-delta':
          fullText += part.text;
          this.onTextDelta?.(part.text);
          break;
        case 'tool-call':
          toolCalls.push(part);
          this.onToolCalls?.([part]);
          break;
        case 'tool-result':
          toolResults.push(part);
          this.onToolResults?.([part]);
          break;
        // tool-call-delta는 v6에서 제거됨
      }
    }

    return {
      text: fullText,
      toolCalls,
      toolResults,
    };
  }

  // 이벤트 핸들러 (함수로 변경)
  onTextDelta?(delta: string): void;
  onToolCalls?(calls: any[]): void;
  onToolResults?(results: any[]): void;
}
