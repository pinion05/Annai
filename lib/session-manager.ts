import { browser } from 'wxt/browser';
import type { ChatSession } from '../components/chat/types';

const SESSIONS_STORAGE_KEY = 'annai_sessions';
const CURRENT_SESSION_KEY = 'annai_current_session_id';

export interface SessionStorage {
  sessions: ChatSession[];
  currentSessionId: string | null;
}

export const generateSessionTitle = (messages: ChatSession['messages']): string => {
  const userMessages = messages.filter((m) => m.role === 'user');
  if (userMessages.length === 0) return 'New Chat';

  const firstMessage = userMessages[0];
  const content = firstMessage.content.trim();
  const maxLength = 40;

  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength - 3) + '...';
};

export const sessionManager = {
  async getSessions(): Promise<ChatSession[]> {
    const result = await browser.storage.local.get(SESSIONS_STORAGE_KEY);
    return (result[SESSIONS_STORAGE_KEY] as ChatSession[]) ?? [];
  },

  async getSession(sessionId: string): Promise<ChatSession | null> {
    const sessions = await this.getSessions();
    return sessions.find((s) => s.id === sessionId) ?? null;
  },

  async saveSession(session: ChatSession): Promise<void> {
    const sessions = await this.getSessions();
    const existingIndex = sessions.findIndex((s) => s.id === session.id);

    const updatedSession: ChatSession = {
      ...session,
      title: session.title || generateSessionTitle(session.messages),
      updatedAt: Date.now(),
    };

    if (existingIndex >= 0) {
      sessions[existingIndex] = updatedSession;
    } else {
      sessions.unshift(updatedSession);
    }

    await browser.storage.local.set({ [SESSIONS_STORAGE_KEY]: sessions });
  },

  async createSession(messages: ChatSession['messages'] = []): Promise<ChatSession> {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.saveSession(newSession);
    await this.setCurrentSessionId(newSession.id);
    return newSession;
  },

  async deleteSession(sessionId: string): Promise<void> {
    const sessions = await this.getSessions();
    const filtered = sessions.filter((s) => s.id !== sessionId);
    await browser.storage.local.set({ [SESSIONS_STORAGE_KEY]: filtered });

    const currentSessionId = await this.getCurrentSessionId();
    if (currentSessionId === sessionId) {
      await this.setCurrentSessionId(null);
    }
  },

  async getCurrentSessionId(): Promise<string | null> {
    const result = await browser.storage.local.get(CURRENT_SESSION_KEY);
    return (result[CURRENT_SESSION_KEY] as string | null) ?? null;
  },

  async setCurrentSessionId(sessionId: string | null): Promise<void> {
    await browser.storage.local.set({ [CURRENT_SESSION_KEY]: sessionId });
  },

  async getCurrentSession(): Promise<ChatSession | null> {
    const sessionId = await this.getCurrentSessionId();
    if (!sessionId) return null;
    return this.getSession(sessionId);
  },

  async loadOrCreateSession(): Promise<ChatSession> {
    const currentSession = await this.getCurrentSession();
    if (currentSession) return currentSession;

    return this.createSession();
  },
};
