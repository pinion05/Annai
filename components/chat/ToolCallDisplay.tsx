import { Show } from 'solid-js';
import { cn } from '@/lib/utils';

interface ToolCallDisplayProps {
  toolCall: any;
}

export function ToolCallDisplay(props: ToolCallDisplayProps) {
  const toolName = props.toolCall.toolName || props.toolCall.name || 'Unknown Tool';
  const args = props.toolCall.args || props.toolCall.arguments || {};

  return (
    <div class="bg-gray-900 rounded-lg p-3 border border-gray-700">
      <div class="flex items-center gap-2 mb-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 text-blue-400"
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
        <span class="text-xs font-semibold text-gray-300">{toolName}</span>
      </div>

      <Show when={Object.keys(args).length > 0}>
        <pre class="text-xs text-gray-400 overflow-x-auto whitespace-pre-wrap break-words">
          {JSON.stringify(args, null, 2)}
        </pre>
      </Show>
    </div>
  );
}

export default ToolCallDisplay;
