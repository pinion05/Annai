import { cn } from '@/lib/utils';

interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dots' | 'spinner';
  text?: string;
  class?: string;
}

export function LoadingIndicator(props: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const size = props.size || 'md';
  const variant = props.variant || 'dots';

  return (
    <div class={cn('flex items-center gap-2', props.class)}>
      {variant === 'dots' ? (
        <div class="flex items-center gap-1">
          <span
            class={cn(
              'bg-gray-400 rounded-full animate-bounce',
              sizeClasses[size]
            )}
            style="animation-delay: 0ms;"
          />
          <span
            class={cn(
              'bg-gray-400 rounded-full animate-bounce',
              sizeClasses[size]
            )}
            style="animation-delay: 150ms;"
          />
          <span
            class={cn(
              'bg-gray-400 rounded-full animate-bounce',
              sizeClasses[size]
            )}
            style="animation-delay: 300ms;"
          />
        </div>
      ) : (
        <svg
          class={cn('animate-spin text-gray-400', sizeClasses[size])}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {props.text && <span class="text-sm text-gray-400">{props.text}</span>}
    </div>
  );
}

export default LoadingIndicator;
