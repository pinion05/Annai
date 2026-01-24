export enum Sender {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  timestamp: number;
  isThinking?: boolean;
  toolCalls?: ToolCallInfo[];
}

export interface ToolCallInfo {
  name: string;
  args: any;
  result?: any;
}

export interface NotionConfig {
  apiKey: string;
  proxyUrl: string; // To handle CORS in browser
}

export interface NotionPage {
  id: string;
  url: string;
  title: string;
}

// Notion API Response Types (Simplified)
export interface NotionSearchResult {
  object: 'list';
  results: any[];
}
