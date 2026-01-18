import { AIClient, type ChatOptions, type ChatResult } from '../ai/client';
import { settings } from '../store/settings';
import { chatHistory } from '../store/chat-history';
import { createNotionTools } from '../tools/notion-tools';

export class ChatManager extends AIClient {
  private currentChatId: number | null = null;

  async startChat(userMessage: string): Promise<ChatResult> {
    // 새 채팅 세션 시작
    const id = await chatHistory.addMessage({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });
    this.currentChatId = id;

    const settingsValue = settings();
    
    // Notion 툴 생성 (API 키 전달)
    const notionTools = createNotionTools({
      notion: {
        apiKey: settingsValue.notion.apiKey,
        databaseId: settingsValue.notion.databaseId,
      },
    });

    const options: ChatOptions = {
      provider: settingsValue.ai.provider,
      model: settingsValue.ai.model,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
      stream: settingsValue.ui.streaming,
      apiKey: settingsValue.ai.apiKey,
      tools: notionTools,
    };

    const result = await this.chat(options);

    // 어시스턴트 메시지 저장
    await chatHistory.addMessage({
      role: 'assistant',
      content: result.text,
      toolCalls: result.toolCalls,
      toolResults: result.toolResults,
      timestamp: new Date(),
    });

    return result;
  }

  async continueChat(userMessage: string): Promise<ChatResult> {
    if (!this.currentChatId) {
      return this.startChat(userMessage);
    }

    // 사용자 메시지 저장
    await chatHistory.addMessage({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    // 채팅 기록 가져오기
    const history = await chatHistory.getHistory();

    const settingsValue = settings();
    
    // Notion 툴 생성 (API 키 전달)
    const notionTools = createNotionTools({
      notion: {
        apiKey: settingsValue.notion.apiKey,
        databaseId: settingsValue.notion.databaseId,
      },
    });

    const options: ChatOptions = {
      provider: settingsValue.ai.provider,
      model: settingsValue.ai.model,
      messages: history.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      stream: settingsValue.ui.streaming,
      apiKey: settingsValue.ai.apiKey,
      tools: notionTools,
    };

    const result = await this.chat(options);

    // 어시스턴트 메시지 저장
    await chatHistory.addMessage({
      role: 'assistant',
      content: result.text,
      toolCalls: result.toolCalls,
      toolResults: result.toolResults,
      timestamp: new Date(),
    });

    return result;
  }

  async clearChat(): Promise<void> {
    this.currentChatId = null;
    await chatHistory.clear();
  }

  // 이벤트 핸들러 오버라이드 (함수로 변경)
  onTextDelta(delta: string): void {
    // UI 업데이트 로직
    console.log('Text delta:', delta);
  }

  onToolCalls(calls: any[]): void {
    // UI 업데이트 로직
    console.log('Tool calls:', calls);
  }

  onToolResults(results: any[]): void {
    // UI 업데이트 로직
    console.log('Tool results:', results);
  }

  // 툴 콜 헬퍼
  getAvailableTools() {
    const settingsValue = settings();
    return createNotionTools({
      notion: {
        apiKey: settingsValue.notion.apiKey,
        databaseId: settingsValue.notion.databaseId,
      },
    });
  }
}
