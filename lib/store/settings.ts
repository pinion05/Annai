import { createSignal } from 'solid-js';

export interface AISettings {
  provider: string;
  model: string;
  apiKey: string;
}

export interface UISettings {
  theme: 'light' | 'dark' | 'auto';
  streaming: boolean;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export interface NotionSettings {
  apiKey: string;
  databaseId: string;
}

export interface Settings {
  ai: AISettings;
  ui: UISettings;
  notion: NotionSettings;
}

const defaultSettings: Settings = {
  ai: {
    provider: 'openrouter',
    model: 'anthropic/claude-3.5-sonnet',
    apiKey: '',
  },
  ui: {
    theme: 'auto',
    streaming: true,
    position: 'bottom-right',
  },
  notion: {
    apiKey: '',
    databaseId: '',
  },
};

// 로컬 스토리지에서 설정 로드
function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem('annai-settings');
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return defaultSettings;
}

// 설정 저장
function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem('annai-settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

// SolidJS signal 생성
const [settings, setSettings] = createSignal<Settings>(loadSettings());

// 설정 업데이트 함수
export function updateSettings(updater: Settings | ((prev: Settings) => Settings)): void {
  const newSettings = typeof updater === 'function' ? updater(settings()) : updater;
  setSettings(newSettings);
  saveSettings(newSettings);
}

// 설정 getter
export { settings };

// 개별 설정 업데이트 헬퍼
export function updateAISettings(updater: Partial<AISettings> | ((prev: AISettings) => AISettings)): void {
  updateSettings((prev) => ({
    ...prev,
    ai: typeof updater === 'function' ? updater(prev.ai) : { ...prev.ai, ...updater },
  }));
}

export function updateUISettings(updater: Partial<UISettings> | ((prev: UISettings) => UISettings)): void {
  updateSettings((prev) => ({
    ...prev,
    ui: typeof updater === 'function' ? updater(prev.ui) : { ...prev.ui, ...updater },
  }));
}

export function updateNotionSettings(updater: Partial<NotionSettings> | ((prev: NotionSettings) => NotionSettings)): void {
  updateSettings((prev) => ({
    ...prev,
    notion: typeof updater === 'function' ? updater(prev.notion) : { ...prev.notion, ...updater },
  }));
}
