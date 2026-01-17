import { createSignal, Show, For, createEffect, onCleanup } from 'solid-js';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { browser } from 'wxt/browser';

interface WidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  initialState?: 'expanded' | 'collapsed';
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

function FloatingWidget(props: WidgetProps) {
  console.log('[DEBUG] FloatingWidget component initializing...');
  
  const [isExpanded, setIsExpanded] = createSignal(props.initialState === 'expanded');
  const [isMinimized, setIsMinimized] = createSignal(false);
  const [messages, setMessages] = createSignal<Message[]>([]);
  const [inputValue, setInputValue] = createSignal('');
  const [isDragging, setIsDragging] = createSignal(false);
  const [position, setPosition] = createSignal({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 });
  const [annaiIcon, setAnnaiIcon] = createSignal('');

  const getPositionClasses = () => {
    const pos = props.position || 'bottom-right';
    const classes = {
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
    };
    return classes[pos];
  };

  const handleSendMessage = (contentOverride?: string) => {
    const content = contentOverride?.trim() ?? inputValue().trim();
    if (!content) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');

    const timeoutId = setTimeout(() => {
      const aiResponse: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Processing: "${content}"`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 500);

    onCleanup(() => clearTimeout(timeoutId));
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage((e.currentTarget as HTMLInputElement).value);
    }
  };

  const handleDragStart = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleDragMove = (e: MouseEvent) => {
    if (isDragging()) {
      setPosition({
        x: e.clientX - dragOffset().x,
        y: e.clientY - dragOffset().y,
      });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  createEffect(() => {
    if (isDragging()) {
      console.log('[DEBUG] Adding drag event listeners...');
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
    } else {
      console.log('[DEBUG] Removing drag event listeners...');
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    }
  });

  createEffect(() => {
    setAnnaiIcon(browser.runtime.getURL('/icon/Annai.png'));
  });

  return (
    <div
      class={cn(
        'fixed z-[9999] shadow-2xl',
        isExpanded() ? 'w-96 h-[600px]' : 'w-14 h-14',
        isDragging() && 'cursor-grabbing',
        isExpanded() ? '' : getPositionClasses()
      )}
      style={isExpanded() && (position().x !== 0 || position().y !== 0) ? {
        left: `${position().x}px`,
        top: `${position().y}px`,
      } : {}}
      onMouseDown={handleDragStart}
    >
      {/* Collapsed FAB */}
      <Show when={!isExpanded()}>
        <Button
          onClick={() => {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const widgetWidth = 384; // w-96 = 24rem = 384px
            const widgetHeight = 600; // h-[600px]
            setPosition({
              x: windowWidth - widgetWidth - 16, // 16 = 4rem = 16px padding
              y: windowHeight - widgetHeight - 16
            });
            setIsExpanded(true);
          }}
          variant="ghost"
          size="icon"
          class={cn(
            'w-full h-full',
            'bg-transparent',
            'shadow-none',
            'p-0',
            'hover:bg-transparent active:bg-transparent',
            'hover:scale-110',
            'transition-all duration-300 ease-out'
          )}
          style="background: transparent; box-shadow: none; padding: 0; border: none;"
        >
          <img
            src={annaiIcon()}
            alt="Annai"
            class="h-full w-full object-contain"
          />
        </Button>
      </Show>

      {/* Expanded Widget */}
      <Show when={isExpanded()}>
        <div
          class={cn(
            'w-full h-full rounded-2xl',
            'bg-zinc-950',
            'border border-gray-800',
            'flex flex-col overflow-hidden',
            'transition-all duration-300 ease-out',
            'shadow-2xl'
          )}
        >
          {/* Header */}
          <div
            class={cn(
              'drag-handle flex items-center justify-between',
              'px-4 py-3',
              'bg-gray-900 border-b border-gray-800',
              'text-gray-100 cursor-grab',
              'select-none'
            )}
          >
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
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
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <span class="font-semibold text-gray-100">Annai</span>
            </div>

            <div class="flex items-center gap-1">
              {/* Minimize Button */}
              <Button
                onClick={() => setIsMinimized(!isMinimized())}
                variant="ghost"
                size="icon"
                class="h-8 w-8 text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors"
              >
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
                    d={isMinimized()
                      ? 'M19 9l-7 7-7-7'
                      : 'M5 15l7-7 7 7'}
                  />
                </svg>
              </Button>

              {/* Close Button */}
              <Button
                onClick={() => setIsExpanded(false)}
                variant="ghost"
                size="icon"
                class="h-8 w-8 text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <Show when={!isMinimized()}>
            <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/50">
              <Show
                when={messages().length > 0}
                fallback={
                  <div class="flex flex-col items-center justify-center h-full text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-12 w-12 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="1"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                    <p class="text-sm">Start a conversation...</p>
                  </div>
                }
              >
                <For each={messages()}>
                  {(message) => (
                    <div
                      class={cn(
                        'flex gap-3',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <Show when={message.role !== 'user'}>
                        <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4 text-gray-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                        </div>
                      </Show>

                      <div
                        class={cn(
                          'max-w-[75%] px-4 py-2 rounded-2xl',
                          message.role === 'user'
                            ? 'bg-gray-700 text-gray-100'
                            : 'bg-gray-800 text-gray-100 border border-gray-700'
                        )}
                      >
                        <p class="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>

                      <Show when={message.role === 'user'}>
                        <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4 text-gray-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                      </Show>
                    </div>
                  )}
                </For>
              </Show>
            </div>

            {/* Input Area */}
            <div class="p-4 border-t border-gray-800 bg-zinc-950">
              <div class="flex gap-2">
                <input
                  type="text"
                  value={inputValue()}
                  onInput={(e) => setInputValue(e.currentTarget.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  class={cn(
                    'flex-1 px-4 py-2.5 rounded-xl',
                    'bg-gray-800',
                    'border border-gray-700',
                    'focus:outline-none focus:ring-2 focus:ring-gray-600',
                    'text-gray-100',
                    'placeholder-gray-500',
                    'transition-all duration-200'
                  )}
                />
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  disabled={!inputValue().trim()}
                  variant="default"
                  class="px-4 py-2.5 rounded-xl"
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
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </Button>
              </div>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}

export default FloatingWidget;
