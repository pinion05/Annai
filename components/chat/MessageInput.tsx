import { createSignal } from 'solid-js';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput(props: MessageInputProps) {
  const [inputValue, setInputValue] = createSignal('');
  const [isComposing, setIsComposing] = createSignal(false);

  const handleKeyPress = (e: KeyboardEvent) => {
    // Ignore IME composition
    if ((e as any).isComposing || isComposing()) {
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace'].includes(e.key)) {
      e.stopPropagation();
    }
  };

  const handleSendMessage = () => {
    const content = inputValue().trim();
    if (!content || props.disabled) return;

    props.onSendMessage(content);
    setInputValue('');
  };

  return (
    <div class="p-4 border-t border-gray-800 bg-zinc-950">
      <div class="flex gap-2">
        <input
          type="text"
          value={inputValue()}
          onInput={(e) => setInputValue(e.currentTarget.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={handleKeyPress}
          placeholder={props.placeholder || 'Type a message...'}
          disabled={props.disabled}
          class={cn(
            'flex-1 px-4 py-2.5 rounded-xl',
            'bg-gray-800',
            'border border-gray-700',
            'focus:outline-none focus:ring-2 focus:ring-gray-600',
            'text-gray-100',
            'placeholder-gray-500',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        />
        <Button
          onClick={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          disabled={!inputValue().trim() || props.disabled}
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
  );
}

export default MessageInput;
