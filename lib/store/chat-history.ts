import Dexie, { Table } from 'dexie';

export interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: any[];
  toolResults?: any[];
  timestamp: Date;
}

class ChatHistoryDatabase extends Dexie {
  messages!: Table<Message>;

  constructor() {
    super('AnnaiChatHistory');
    this.version(1).stores({
      messages: '++id, role, timestamp',
    });
  }
}

const db = new ChatHistoryDatabase();

export const chatHistory = {
  async addMessage(message: Omit<Message, 'id'>): Promise<number> {
    return await db.messages.add(message);
  },

  async getHistory(): Promise<Message[]> {
    return await db.messages.toArray();
  },

  async clear(): Promise<void> {
    return await db.messages.clear();
  },

  async getLastMessage(): Promise<Message | undefined> {
    return await db.messages.orderBy('timestamp').last();
  },
};
