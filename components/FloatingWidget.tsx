import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useChat, type Message } from '@/components/chat/useChat';

interface WidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  initialState?: 'expanded' | 'collapsed';
}

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
  const [view, setView] = useState<'chat' | 'settings'>('chat');
  const [settingsDraft, setSettingsDraft] = useState({
    openrouterApiKey: '',
    notionApiKey: '',
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    openrouter?: { ok: boolean; status: number; error?: string };
    notion?: { ok: boolean; status: number; error?: string };
  }>({});

  const { messages, sendMessage, isLoading } = useChat();
  const widgetRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load Annai icon
  useEffect(() => {
    if (typeof browser !== 'undefined') {
      setAnnaiIcon(browser.runtime.getURL('/icon/Annai.png'));
    }
  }, []);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load stored keys when opening settings
  useEffect(() => {
    if (view !== 'settings' || typeof browser === 'undefined') return;
    browser.storage.local.get(['openrouter_api_key', 'notion_api_key']).then((result) => {
      const openrouterApiKey =
        typeof result.openrouter_api_key === 'string' ? result.openrouter_api_key : '';
      const notionApiKey = typeof result.notion_api_key === 'string' ? result.notion_api_key : '';
      setSettingsDraft({
        openrouterApiKey,
        notionApiKey,
      });
      setIsDirty(false);
    });
  }, [view]);

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

  const handleSaveSettings = async () => {
    if (typeof browser === 'undefined' || isSaving) return;
    setIsSaving(true);
    try {
      await browser.storage.local.set({
        openrouter_api_key: settingsDraft.openrouterApiKey,
        notion_api_key: settingsDraft.notionApiKey,
      });
      setIsDirty(false);
      const result = await browser.runtime.sendMessage({ type: 'RUN_HEALTH_CHECK' });
      setHealthStatus(result ?? {});
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
              <button
                aria-label={view === 'chat' ? 'Open settings' : 'Back to chat'}
                onClick={() => setView(view === 'chat' ? 'settings' : 'chat')}
                className="group relative w-6 h-6 rounded-full bg-gray-800 hover:bg-gray-700 transition-all duration-200 flex items-center justify-center cursor-pointer outline-none focus:outline-none"
              >
                <span className="text-[12px] text-gray-200 leading-none">
                  {view === 'chat' ? '⚙' : '←'}
                </span>
              </button>

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
              {messages.length === 0 ? (
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
                messages.map((message) => (
                  <div
                    key={message.id}
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
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
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
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Settings Area */}
          {!isMinimized && view === 'settings' && (
            <div className="flex-1 p-4 space-y-4 bg-gray-900/50">
              <div>
                <p className="text-sm text-gray-300">Settings</p>
                <p className="text-xs text-gray-500">Configure API keys for OpenRouter and Notion.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="openrouter-api-key" className="text-xs text-gray-400">
                    OpenRouter API Key
                  </label>
                  <Input
                    id="openrouter-api-key"
                    aria-label="OpenRouter API Key"
                    type="text"
                    value={settingsDraft.openrouterApiKey}
                    onChange={(e) => {
                      setSettingsDraft((prev) => ({ ...prev, openrouterApiKey: e.target.value }));
                      setIsDirty(true);
                    }}
                    placeholder="OpenRouter API Key"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="notion-api-key" className="text-xs text-gray-400">
                    Notion API Key
                  </label>
                  <Input
                    id="notion-api-key"
                    aria-label="Notion API Key"
                    type="text"
                    value={settingsDraft.notionApiKey}
                    onChange={(e) => {
                      setSettingsDraft((prev) => ({ ...prev, notionApiKey: e.target.value }));
                      setIsDirty(true);
                    }}
                    placeholder="Notion API Key"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleSaveSettings} disabled={!isDirty || isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>

              <div className="text-xs text-gray-400 space-y-1">
                <div>
                  OpenRouter: {healthStatus.openrouter ? (healthStatus.openrouter.ok ? 'Connected' : 'Failed') : '—'}
                </div>
                <div>
                  Notion: {healthStatus.notion ? (healthStatus.notion.ok ? 'Connected' : 'Failed') : '—'}
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
