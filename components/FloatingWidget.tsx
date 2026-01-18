import { createSignal, Show, createEffect, onCleanup } from 'solid-js';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { browser } from 'wxt/browser';
import { ChatManager } from '@/lib/chat/manager';
import { chatHistory } from '@/lib/store/chat-history';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { SettingsPanel } from '@/components/settings/SettingsPanel';

interface WidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  initialState?: 'expanded' | 'collapsed';
}

function FloatingWidget(props: WidgetProps) {
  const [isExpanded, setIsExpanded] = createSignal(props.initialState === 'expanded');
  const [isMinimized, setIsMinimized] = createSignal(false);
  const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);
  const [messages, setMessages] = createSignal<any[]>([]);
  const [isStreaming, setIsStreaming] = createSignal(false);
  const [streamingText, setStreamingText] = createSignal('');
  const [isDragging, setIsDragging] = createSignal(false);
  const [position, setPosition] = createSignal({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 });
  const [annaiIcon, setAnnaiIcon] = createSignal('');
  const [isExiting, setIsExiting] = createSignal(false);
  const [chatManager, setChatManager] = createSignal<ChatManager | null>(null);

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

  // Initialize ChatManager
  createEffect(() => {
    const manager = new ChatManager();
    setChatManager(manager);

    // Load chat history on mount
    loadChatHistory();

    onCleanup(() => {
      // Cleanup if needed
    });
  });

  const loadChatHistory = async () => {
    try {
      const history = await chatHistory.getHistory();
      setMessages(history);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const manager = chatManager();
    if (!manager) {
      console.error('ChatManager not initialized');
      return;
    }

    // Check if this is a new chat or continuation
    const lastMessage = messages().length > 0 ? messages()[messages().length - 1] : null;
    const isNewChat = !lastMessage || lastMessage.role === 'assistant';

    try {
      setIsStreaming(true);
      setStreamingText('');

      // Set up streaming handlers
      manager.onTextDelta = (delta: string) => {
        setStreamingText((prev) => prev + delta);
      };

      manager.onToolCalls = (calls: any[]) => {
        console.log('Tool calls:', calls);
      };

      manager.onToolResults = (results: any[]) => {
        console.log('Tool results:', results);
      };

      // Send message
      const result = isNewChat
        ? await manager.startChat(content)
        : await manager.continueChat(content);

      // Update messages
      await loadChatHistory();
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsStreaming(false);
      setStreamingText('');
    }
  };

  const handleClearChat = async () => {
    const manager = chatManager();
    if (manager) {
      await manager.clearChat();
      await loadChatHistory();
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
      <Show when={isExpanded() || isExiting()}>
        <Show when={!isSettingsOpen()}>
          <div
            class={cn(
              'w-full h-full rounded-2xl',
              'bg-zinc-950',
              'border border-gray-800',
              'flex flex-col overflow-hidden',
              'shadow-2xl'
            )}
            style={`
              animation: ${isExiting() ? 'macosSpringExit' : 'macosSpringEnter'} 400ms cubic-bezier(0.34, 1.25, 0.64, 1) forwards;
              transform-origin: bottom right;
            `}
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

              <div class="flex items-center gap-2">
                {/* Settings Button */}
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  class="group relative w-4 h-4 rounded-full bg-gray-600 hover:bg-gray-500 transition-all duration-200 flex items-center justify-center cursor-pointer outline-none focus:outline-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3 w-3 text-gray-300"
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
                </button>

                {/* Clear Chat Button */}
                <button
                  onClick={handleClearChat}
                  class="group relative w-4 h-4 rounded-full bg-blue-500 hover:bg-blue-400 transition-all duration-200 flex items-center justify-center cursor-pointer outline-none focus:outline-none"
                  title="Clear chat"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>

                {/* Minimize Button */}
                <button
                  onClick={() => setIsMinimized(!isMinimized())}
                  class="group relative w-4 h-4 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-all duration-200 flex items-center justify-center cursor-pointer outline-none focus:outline-none"
                >
                  <span class="opacity-0 group-hover:opacity-100 text-[10px] text-gray-800 font-bold leading-none transition-opacity duration-200">
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
                  class="group relative w-4 h-4 rounded-full bg-red-500 hover:bg-red-400 transition-all duration-200 flex items-center justify-center cursor-pointer outline-none focus:outline-none"
                >
                  <span class="opacity-0 group-hover:opacity-100 text-[10px] text-gray-800 font-bold leading-none transition-opacity duration-200">
                    ×
                  </span>
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <Show when={!isMinimized()}>
              <MessageList
                messages={messages()}
                streamingText={streamingText()}
                isStreaming={isStreaming()}
              />

              {/* Input Area */}
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={isStreaming()}
                placeholder="Type a message..."
              />
            </Show>
          </div>
        </Show>

        {/* Settings Panel */}
        <Show when={isSettingsOpen()}>
          <div
            class={cn(
              'w-full h-full rounded-2xl',
              'shadow-2xl'
            )}
            style={`
              animation: macosSpringEnter 400ms cubic-bezier(0.34, 1.25, 0.64, 1) forwards;
              transform-origin: bottom right;
            `}
          >
            <SettingsPanel
              onClose={() => setIsSettingsOpen(false)}
            />
          </div>
        </Show>
      </Show>
    </div>
  );
}

export default FloatingWidget;
