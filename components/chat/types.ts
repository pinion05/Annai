export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    args: Record<string, unknown>;
  }>;
  toolResults?: Array<{
    id: string;
    name: string;
    result: unknown;
  }>;
  timestamp?: Date;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}
