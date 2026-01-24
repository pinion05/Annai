import { useState, useEffect, useRef, useCallback } from 'react';
import { browser } from 'wxt/browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useChat } from '@/components/chat/useChat';

interface WidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  initialState?: 'expanded' | 'collapsed';
}

type WidgetView = 'chat' | 'settings';

type HealthStatus = {
  openrouter: { ok: boolean; status: number; error?: string };
  notion: { ok: boolean; status: number; error?: string };
};

type SettingsDraft = {
  openrouterApiKey: string;
  notionApiKey: string;
};

export default function FloatingWidget({ position = 'bottom-right', initialState = 'collapsed' }: WidgetProps) {
  const [isExpanded, setIsExpanded] = useState(initialState === 'expanded');
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [positionState, setPositionState] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [annaiIcon, setAnnaiIcon] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [view, setView] = useState<WidgetView>('chat');
  const [settingsDraft, setSettingsDraft] = useState<SettingsDraft>({
    openrouterApiKey: '',
    notionApiKey: '',
  });
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const { messages, sendMessage, isLoading } = useChat();
  const widgetRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load Annai icon
  useEffect(() => {
    setAnnaiIcon(browser.runtime.getURL('/icon/Annai.png'));
  }, []);

  useEffect(() => {
    if (view !== 'settings') return;

    const loadSettings = async () => {
      const [openrouterResult, notionResult] = await Promise.all([
        browser.runtime.sendMessage({ type: 'GET_OPENROUTER_API_KEY' }),
        browser.runtime.sendMessage({ type: 'GET_NOTION_API_KEY' }),
      ]);

      setSettingsDraft({
        openrouterApiKey: (openrouterResult?.apiKey as string | undefined) ?? '',
        notionApiKey: (notionResult?.apiKey as string | undefined) ?? '',
      });
    };

    loadSettings();
  }, [view]);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Drag event handlers
  useEffect(() => {
    const handleDragMove = (e: MouseEvent) => {
      if (isDragging) {
        setPositionState({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, dragOffset]);

  const getPositionClasses = () => {
    const classes: Record<string, string> = {
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
    };
    return classes[position];
  };

  const handleExpand = () => {
    setPositionState({
      x: window.innerWidth - 384 - 16,
      y: window.innerHeight - 600 - 16,
    });
    setIsExpanded(true);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || isLoading) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isComposing) return;
      handleSendMessage();
    }
  };

  const maskKey = (value: string) => {
    if (!value) return 'missing';
    const trimmed = value.trim();
    if (!trimmed) return 'empty';
    const last4 = trimmed.slice(-4);
    return `len:${trimmed.length} last4:${last4}`;
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setIsCheckingHealth(true);

    try {
      console.log('[health-check][widget] save settings', {
        openrouter: maskKey(settingsDraft.openrouterApiKey),
        notion: maskKey(settingsDraft.notionApiKey),
      });

      await Promise.all([
        browser.runtime.sendMessage({
          type: 'SET_OPENROUTER_API_KEY',
          apiKey: settingsDraft.openrouterApiKey,
        }),
        browser.runtime.sendMessage({
          type: 'SET_NOTION_API_KEY',
          apiKey: settingsDraft.notionApiKey,
        }),
      ]);

      const result = await browser.runtime.sendMessage({ type: 'RUN_HEALTH_CHECK' });
      console.log('[health-check][widget] result', result);
      setHealthStatus(result as HealthStatus);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      console.log('[health-check][widget] error', errorMessage);
      setHealthStatus({
        openrouter: { ok: false, status: 0, error: errorMessage },
        notion: { ok: false, status: 0, error: errorMessage },
      });
    } finally {
      setIsSavingSettings(false);
      setIsCheckingHealth(false);
    }
  };

  const stopEventPropagation = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.drag-handle') || target.closest('button')) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  const renderHealthStatus = (label: string, status: HealthStatus['openrouter'] | null) => {
    const isOk = status?.ok;
    const statusText = isCheckingHealth
      ? 'Checking...'
      : status
        ? status.ok
          ? `OK (${status.status})`
          : `Failed (${status.status || 'n/a'})`
        : 'Not checked';

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">{label}</span>
          <span
            className={cn(
              'text-[11px]',
              status
                ? isOk
                  ? 'text-emerald-400'
                  : 'text-rose-400'
                : 'text-gray-500'
            )}
          >
            {statusText}
          </span>
        </div>
        {status?.error && !status.ok && (
          <p className="text-[11px] text-gray-500 break-words">{status.error}</p>
        )}
      </div>
    );
  };

  const visibleMessages = messages.filter(
    (message) => message.role !== 'tool' && message.role !== 'system'
  );

  return (
    <div
      ref={widgetRef}
      className={cn(
        'fixed z-[9999] shadow-2xl',
        isExpanded ? 'w-96 h-[600px]' : 'w-14 h-14',
        isDragging && 'cursor-grabbing',
        !isExpanded && getPositionClasses()
      )}
      style={{
        left: isExpanded && (positionState.x !== 0 || positionState.y !== 0) ? `${positionState.x}px` : undefined,
        top: isExpanded && (positionState.x !== 0 || positionState.y !== 0) ? `${positionState.y}px` : undefined,
      }}
      onMouseDown={handleMouseDown}
      onKeyDown={stopEventPropagation}
      onKeyUp={stopEventPropagation}
      onPaste={stopEventPropagation}
      onCopy={stopEventPropagation}
      onCut={stopEventPropagation}
    >
      {/* Collapsed FAB */}
      {!isExpanded && (
        <Button
          variant="ghost"
          size="icon"
          className="w-full h-full bg-transparent shadow-none p-0 hover:bg-transparent"
          onClick={handleExpand}
        >
          {annaiIcon ? (
            <img src={annaiIcon} alt="Annai" className="h-full w-full object-contain" />
          ) : (
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          )}
        </Button>
      )}

      {/* Expanded Widget */}
      {(isExpanded || isExiting) && (
        <div
          className={cn(
            'w-full h-full rounded-2xl bg-zinc-950 border border-gray-800 flex flex-col overflow-hidden shadow-2xl'
          )}
          style={{
            animation: `${isExiting ? 'macosSpringExit' : 'macosSpringEnter'} 400ms cubic-bezier(0.34, 1.25, 0.64, 1) forwards`,
            transformOrigin: 'bottom right',
          }}
        >
          {/* Header */}
          <div
            className={cn(
              'drag-handle flex items-center justify-between',
              'px-4 py-3',
              'bg-gray-900 border-b border-gray-800',
              'text-gray-100 cursor-grab',
              'select-none'
            )}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <span className="font-semibold text-gray-100">Annai</span>
            </div>

            <div className="flex items-center gap-2">
              {view === 'chat' ? (
                <button
                  onClick={() => setView('settings')}
                  className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-800 transition-colors"
                  title="Settings"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.983 2.25c.53 0 1.048.05 1.553.145l.288 1.246a2.25 2.25 0 002.284 1.747l1.28-.08a9.02 9.02 0 011.146 1.984l-.86.965a2.25 2.25 0 000 2.748l.86.965a9.02 9.02 0 01-1.146 1.984l-1.28-.08a2.25 2.25 0 00-2.284 1.747l-.288 1.246a9.14 9.14 0 01-3.106 0l-.288-1.246a2.25 2.25 0 00-2.284-1.747l-1.28.08a9.02 9.02 0 01-1.146-1.984l.86-.965a2.25 2.25 0 000-2.748l-.86-.965a9.02 9.02 0 011.146-1.984l1.28.08a2.25 2.25 0 002.284-1.747l.288-1.246a9.14 9.14 0 011.553-.145z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => setView('chat')}
                  className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-800 transition-colors"
                  title="Back to chat"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Minimize Button */}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="group relative w-4 h-4 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-all duration-200 flex items-center justify-center cursor-pointer outline-none focus:outline-none"
              >
                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-800 font-bold leading-none transition-opacity duration-200">
                  -
                </span>
              </button>

              {/* Close Button */}
              <button
                onClick={() => {
                  setIsExiting(true);
                  setTimeout(() => {
                    setIsExpanded(false);
                    setIsExiting(false);
                  }, 400);
                }}
                className="group relative w-4 h-4 rounded-full bg-red-500 hover:bg-red-400 transition-all duration-200 flex items-center justify-center cursor-pointer outline-none focus:outline-none"
              >
                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-800 font-bold leading-none transition-opacity duration-200">
                  ×
                </span>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          {!isMinimized && view === 'chat' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/50">
              {visibleMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  <p className="text-sm">Start a conversation...</p>
                </div>
              ) : (
                visibleMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn('flex flex-col gap-2', message.role === 'user' ? 'items-end' : 'items-start')}
                  >
                    <div
                      className={cn('flex gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}
                    >
                      {message.role !== 'user' && (
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-gray-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                        </div>
                      )}

                      <div
                        className={cn(
                          'max-w-[75%] px-4 py-2 rounded-2xl',
                          message.role === 'user'
                            ? 'bg-gray-700 text-gray-100'
                            : 'bg-gray-800 text-gray-100 border border-gray-700'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content?.trim()
                            ? message.content
                            : message.isThinking
                              ? 'Thinking...'
                              : message.toolCalls?.length
                                ? 'Running tools...'
                                : ''}
                        </p>
                      </div>

                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-gray-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {message.role !== 'user' && message.toolCalls?.length ? (
                      <div className="w-full max-w-[320px] space-y-2">
                        {message.toolCalls.map((tool, index) => (
                          <div
                            key={`${tool.id}-${index}`}
                            className="rounded-lg border border-gray-800 bg-gray-950/70 p-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-indigo-300">{tool.name}</span>
                              <span className="text-gray-400">
                                {tool.result ? 'Completed' : 'Running'}
                              </span>
                            </div>
                            <div className="mt-1 font-mono text-gray-400 truncate">
                              args: {JSON.stringify(tool.args)}
                            </div>
                            {tool.result !== undefined && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-gray-500 hover:text-gray-300">
                                  Show result
                                </summary>
                                <pre className="mt-2 max-h-32 overflow-x-auto rounded bg-gray-900 p-2 text-[11px] text-emerald-200">
                                  {JSON.stringify(tool.result, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {!isMinimized && view === 'settings' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-900/50">
              <div>
                <h3 className="text-sm font-semibold text-gray-200">Settings</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Store API keys locally to enable OpenRouter + Notion tool calls.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">OpenRouter API Key</label>
                  <Input
                    value={settingsDraft.openrouterApiKey}
                    onChange={(e) =>
                      setSettingsDraft((prev) => ({
                        ...prev,
                        openrouterApiKey: e.target.value,
                      }))
                    }
                    placeholder="sk-or-..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Notion API Key</label>
                  <Input
                    value={settingsDraft.notionApiKey}
                    onChange={(e) =>
                      setSettingsDraft((prev) => ({
                        ...prev,
                        notionApiKey: e.target.value,
                      }))
                    }
                    placeholder="secret_..."
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings || isCheckingHealth}
                  className="w-full"
                >
                  {isSavingSettings || isCheckingHealth ? 'Saving...' : 'Save & Run Health Check'}
                </Button>

                <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3 space-y-2">
                  {renderHealthStatus('OpenRouter', healthStatus?.openrouter ?? null)}
                  {renderHealthStatus('Notion', healthStatus?.notion ?? null)}
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          {!isMinimized && view === 'chat' && (
            <div className="p-4 border-t border-gray-800 bg-zinc-950">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  placeholder="Type a message..."
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
