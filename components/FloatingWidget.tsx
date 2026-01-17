import { createSignal, Show, For, createEffect } from 'solid-js';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
  const [isExpanded, setIsExpanded] = createSignal(props.initialState === 'expanded');
  const [isMinimized, setIsMinimized] = createSignal(false);
  const [messages, setMessages] = createSignal<Message[]>([]);
  const [inputValue, setInputValue] = createSignal('');
  const [isDragging, setIsDragging] = createSignal(false);
  const [position, setPosition] = createSignal({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 });

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

  const handleSendMessage = () => {
    const content = inputValue().trim();
    if (!content) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Processing: "${content}"`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 500);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
    } else {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    }
  });

  return (
    <div
      class={cn(
        'fixed z-[9999] shadow-2xl',
        isExpanded() ? 'w-96 h-[600px]' : 'w-14 h-14',
        isDragging() && 'cursor-grabbing',
        getPositionClasses()
      )}
      style={position().x !== 0 || position().y !== 0 ? {
        left: `${position().x}px`,
        top: `${position().y}px`,
      } : {}}
      onMouseDown={handleDragStart}
    >
      {/* Collapsed FAB */}
      <Show when={!isExpanded()}>
        <Button
          onClick={() => setIsExpanded(true)}
          variant="gradient"
          size="icon"
          class={cn(
            'w-full h-full rounded-full',
            'hover:scale-110 active:scale-95',
            'shadow-lg',
            'transition-all duration-300 ease-out'
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </Button>
      </Show>

      {/* Expanded Widget */}
      <Show when={isExpanded()}>
        <div
          class={cn(
            'w-full h-full rounded-2xl',
            'bg-white dark:bg-gray-900',
            'border border-gray-200 dark:border-gray-700',
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
              'bg-gradient-to-r from-violet-500 to-purple-600',
              'text-white cursor-grab',
              'select-none'
            )}
          >
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
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
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <span class="font-semibold">Annai</span>
            </div>

            <div class="flex items-center gap-1">
              {/* Minimize Button */}
              <Button
                onClick={() => setIsMinimized(!isMinimized())}
                variant="ghost"
                size="icon"
                class="text-white hover:bg-white/10 data-[hover]:bg-white/10"
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
                class="text-white hover:bg-white/10 data-[hover]:bg-white/10"
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
            <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800/50">
              <Show
                when={messages().length > 0}
                fallback={
                  <div class="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
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
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4 text-white"
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
                            ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600'
                        )}
                      >
                        <p class="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>

                      <Show when={message.role === 'user'}>
                        <div class="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4 text-gray-600 dark:text-gray-300"
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
            <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div class="flex gap-2">
                <input
                  type="text"
                  value={inputValue()}
                  onInput={(e) => setInputValue(e.currentTarget.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  class={cn(
                    'flex-1 px-4 py-2.5 rounded-xl',
                    'bg-gray-100 dark:bg-gray-800',
                    'border border-gray-200 dark:border-gray-700',
                    'focus:outline-none focus:ring-2 focus:ring-violet-500',
                    'text-gray-900 dark:text-gray-100',
                    'placeholder-gray-400 dark:placeholder-gray-500',
                    'transition-all duration-200'
                  )}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue().trim()}
                  variant="gradient"
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
