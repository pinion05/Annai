import { For, Show } from 'solid-js';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/store/chat-history';
import { ToolCallDisplay } from './ToolCallDisplay';

interface MessageListProps {
  messages: Message[];
  streamingText?: string;
  isStreaming?: boolean;
}

export function MessageList(props: MessageListProps) {
  return (
    <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/50">
      <Show
        when={props.messages.length > 0 || props.streamingText}
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
        <For each={props.messages}>
          {(message) => (
            <MessageItem message={message} />
          )}
        </For>

        {/* Streaming message */}
        <Show when={props.isStreaming && props.streamingText}>
          <MessageItem
            message={{
              role: 'assistant',
              content: props.streamingText || '',
              timestamp: new Date(),
            }}
            isStreaming={true}
          />
        </Show>
      </Show>
    </div>
  );
}

interface MessageItemProps {
  message: Message & { id?: number };
  isStreaming?: boolean;
}

function MessageItem(props: MessageItemProps) {
  return (
    <div
      class={cn(
        'flex gap-3',
        props.message.role === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      <Show when={props.message.role !== 'user'}>
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
          'max-w-[75%] px-4 py-0 rounded-2xl',
          props.message.role === 'user'
            ? 'bg-gray-700 text-gray-100'
            : 'bg-gray-800 text-gray-100 border border-gray-700'
        )}
      >
        <p class="text-sm whitespace-pre-wrap break-words">
          {props.message.content}
          {props.isStreaming && <span class="animate-pulse">▋</span>}
        </p>

        {/* Tool calls display */}
        <Show when={props.message.toolCalls && props.message.toolCalls.length > 0}>
          <div class="mt-3 space-y-2">
            <For each={props.message.toolCalls}>
              {(toolCall) => (
                <ToolCallDisplay toolCall={toolCall} />
              )}
            </For>
          </div>
        </Show>

        {/* Tool results display */}
        <Show when={props.message.toolResults && props.message.toolResults.length > 0}>
          <div class="mt-3 space-y-2">
            <For each={props.message.toolResults}>
              {(toolResult) => (
                <ToolResultDisplay toolResult={toolResult} />
              )}
            </For>
          </div>
        </Show>
      </div>

      <Show when={props.message.role === 'user'}>
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
  );
}

interface ToolResultDisplayProps {
  toolResult: any;
}

function ToolResultDisplay(props: ToolResultDisplayProps) {
  const toolName = props.toolResult.toolName || 'Unknown Tool';
  const result = props.toolResult.result;

  return (
    <div class="bg-gray-900 rounded-lg p-3 border border-gray-700">
      <div class="flex items-center gap-2 mb-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span class="text-xs font-semibold text-gray-300">{toolName} Result</span>
      </div>
      <pre class="text-xs text-gray-400 overflow-x-auto whitespace-pre-wrap break-words">
        {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
