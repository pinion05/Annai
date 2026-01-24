export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
}

export interface ToolResult {
  id: string;
  name: string;
  result: unknown;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  toolCallId?: string;
  name?: string;
  isThinking?: boolean;
  timestamp?: Date;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}
