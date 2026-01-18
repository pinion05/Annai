import { createSignal, Show, For } from 'solid-js';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { settings, updateAISettings, updateUISettings, updateNotionSettings } from '@/lib/store/settings';

interface SettingsPanelProps {
  onClose?: () => void;
}

const AI_PROVIDERS = [
  { id: 'openrouter', name: 'OpenRouter' },
  { id: 'together', name: 'Together AI' },
];

const MODELS = {
  openrouter: [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
    { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { id: 'custom', name: 'Custom Model ID' },
  ],
  together: [
    { id: 'meta-llama/Llama-3-70b-chat-hf', name: 'Llama 3 70B' },
    { id: 'meta-llama/Llama-3-8b-chat-hf', name: 'Llama 3 8B' },
    { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B' },
    { id: 'custom', name: 'Custom Model ID' },
  ],
};

const THEMES = [
  { id: 'light', name: 'Light' },
  { id: 'dark', name: 'Dark' },
  { id: 'auto', name: 'Auto' },
];

export function SettingsPanel(props: SettingsPanelProps) {
  const [apiKey, setApiKey] = createSignal(settings().ai.apiKey);
  const [notionApiKey, setNotionApiKey] = createSignal(settings().notion.apiKey);
  const [notionDatabaseId, setNotionDatabaseId] = createSignal(settings().notion.databaseId);
  const [showApiKey, setShowApiKey] = createSignal(false);
  const [showNotionApiKey, setShowNotionApiKey] = createSignal(false);
  
  // Initialize customModelId if current model is not in the predefined list
  const initialModel = settings().ai.model;
  const initialProvider = settings().ai.provider;
  const initialModels = MODELS[initialProvider as keyof typeof MODELS] || [];
  const initialIsCustom = !initialModels.some(m => m.id === initialModel);
  
  const [customModelId, setCustomModelId] = createSignal(initialIsCustom ? initialModel : '');
  const [modelError, setModelError] = createSignal('');

  const currentProvider = () => settings().ai.provider;
  const currentModel = () => settings().ai.model;
  const currentTheme = () => settings().ui.theme;
  const isStreaming = () => settings().ui.streaming;

  const availableModels = () => MODELS[currentProvider() as keyof typeof MODELS] || [];
  const isCustomModel = () => currentModel() === 'custom' || !availableModels().some(m => m.id === currentModel());

  const handleProviderChange = (provider: string) => {
    const models = MODELS[provider as keyof typeof MODELS] || [];
    updateAISettings({ provider, model: models[0]?.id || '' });
    if (isCustomModel()) {
      setCustomModelId(currentModel());
    }
  };

  const handleModelChange = (model: string) => {
    updateAISettings({ model });
    if (model !== 'custom') {
      setCustomModelId('');
      setModelError('');
    }
  };

  const handleCustomModelIdChange = (value: string) => {
    setCustomModelId(value);
    // Validate model ID
    if (value.trim().length === 0) {
      setModelError('Model ID cannot be empty');
    } else if (value.trim().length < 3) {
      setModelError('Model ID must be at least 3 characters');
    } else {
      setModelError('');
    }
  };

  const handleThemeChange = (theme: string) => {
    updateUISettings({ theme: theme as 'light' | 'dark' | 'auto' });
  };

  const handleStreamingToggle = () => {
    updateUISettings({ streaming: !isStreaming() });
  };

  const handleSaveAI = () => {
    const modelToSave = isCustomModel() ? customModelId().trim() : currentModel();
    if (isCustomModel() && modelToSave.length === 0) {
      setModelError('Model ID cannot be empty');
      return;
    }
    if (isCustomModel() && modelToSave.length < 3) {
      setModelError('Model ID must be at least 3 characters');
      return;
    }
    updateAISettings({
      apiKey: apiKey(),
      model: modelToSave
    });
  };

  const handleSaveNotion = () => {
    updateNotionSettings({
      apiKey: notionApiKey(),
      databaseId: notionDatabaseId(),
    });
  };

  return (
    <div class="w-full h-full rounded-2xl bg-zinc-950 border border-gray-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div class="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div class="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span class="font-semibold text-gray-100">Settings</span>
        </div>
        <Show when={props.onClose}>
          <Button
            onClick={props.onClose}
            variant="ghost"
            size="icon"
            class="h-8 w-8"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </Show>
      </div>

      {/* Content */}
      <div class="flex-1 overflow-y-auto p-4 space-y-6">
        {/* AI Provider Section */}
        <Section title="AI Provider">
          <div class="space-y-3">
            <Select
              label="Provider"
              value={currentProvider()}
              onChange={handleProviderChange}
              options={AI_PROVIDERS}
            />
            <Select
              label="Model"
              value={isCustomModel() ? 'custom' : currentModel()}
              onChange={handleModelChange}
              options={availableModels()}
            />
            <Show when={isCustomModel()}>
              <div class="space-y-1">
                <label class="text-xs text-gray-400">Custom Model ID</label>
                <input
                  type="text"
                  value={customModelId()}
                  onInput={(e) => handleCustomModelIdChange(e.currentTarget.value)}
                  placeholder="Enter custom model ID (e.g., provider/model-name)"
                  class={cn(
                    'w-full px-3 py-2 rounded-lg',
                    'bg-gray-800',
                    'border',
                    modelError() ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-gray-600',
                    'focus:outline-none focus:ring-2',
                    'text-gray-100',
                    'text-sm',
                    'transition-all duration-200'
                  )}
                />
                <Show when={modelError()}>
                  <p class="text-xs text-red-400">{modelError()}</p>
                </Show>
              </div>
            </Show>
            <Input
              label="API Key"
              type={showApiKey() ? 'text' : 'password'}
              value={apiKey()}
              onInput={setApiKey}
              placeholder="Enter your API key"
              showToggle
              showValue={showApiKey()}
              onToggle={() => setShowApiKey(!showApiKey())}
            />
            <Button
              onClick={handleSaveAI}
              variant="default"
              class="w-full"
            >
              Save AI Settings
            </Button>
          </div>
        </Section>

        {/* Notion Section */}
        <Section title="Notion">
          <div class="space-y-3">
            <Input
              label="API Key"
              type={showNotionApiKey() ? 'text' : 'password'}
              value={notionApiKey()}
              onInput={setNotionApiKey}
              placeholder="Enter your Notion API key"
              showToggle
              showValue={showNotionApiKey()}
              onToggle={() => setShowNotionApiKey(!showNotionApiKey())}
            />
            <Input
              label="Database ID"
              type="text"
              value={notionDatabaseId()}
              onInput={setNotionDatabaseId}
              placeholder="Enter your Notion database ID"
            />
            <Button
              onClick={handleSaveNotion}
              variant="default"
              class="w-full"
            >
              Save Notion Settings
            </Button>
          </div>
        </Section>

        {/* UI Section */}
        <Section title="UI">
          <div class="space-y-3">
            <Select
              label="Theme"
              value={currentTheme()}
              onChange={handleThemeChange}
              options={THEMES}
            />
            <Toggle
              label="Streaming"
              checked={isStreaming()}
              onChange={handleStreamingToggle}
            />
          </div>
        </Section>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: any;
}

function Section(props: SectionProps) {
  return (
    <div class="space-y-3">
      <h3 class="text-sm font-semibold text-gray-300">{props.title}</h3>
      {props.children}
    </div>
  );
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: string; name: string }[];
}

function Select(props: SelectProps) {
  return (
    <div class="space-y-1">
      <label class="text-xs text-gray-400">{props.label}</label>
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.currentTarget.value)}
        class={cn(
          'w-full px-3 py-2 rounded-lg',
          'bg-gray-800',
          'border border-gray-700',
          'focus:outline-none focus:ring-2 focus:ring-gray-600',
          'text-gray-100',
          'text-sm',
          'transition-all duration-200'
        )}
      >
        <For each={props.options}>
          {(option) => (
            <option value={option.id}>{option.name}</option>
          )}
        </For>
      </select>
    </div>
  );
}

interface InputProps {
  label: string;
  type: string;
  value: string;
  onInput: (value: string) => void;
  placeholder?: string;
  showToggle?: boolean;
  showValue?: boolean;
  onToggle?: () => void;
}

function Input(props: InputProps) {
  return (
    <div class="space-y-1">
      <label class="text-xs text-gray-400">{props.label}</label>
      <div class="relative">
        <input
          type={props.type}
          value={props.value}
          onInput={(e) => props.onInput(e.currentTarget.value)}
          placeholder={props.placeholder}
          class={cn(
            'w-full px-3 py-2 rounded-lg pr-10',
            'bg-gray-800',
            'border border-gray-700',
            'focus:outline-none focus:ring-2 focus:ring-gray-600',
            'text-gray-100',
            'text-sm',
            'transition-all duration-200'
          )}
        />
        <Show when={props.showToggle}>
          <button
            type="button"
            onClick={props.onToggle}
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
          >
            {props.showValue ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            )}
          </button>
        </Show>
      </div>
    </div>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

function Toggle(props: ToggleProps) {
  return (
    <div class="flex items-center justify-between">
      <label class="text-xs text-gray-400">{props.label}</label>
      <button
        type="button"
        onClick={props.onChange}
        class={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-600',
          props.checked ? 'bg-gray-600' : 'bg-gray-700'
        )}
      >
        <span
          class={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
            props.checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}

export default SettingsPanel;
