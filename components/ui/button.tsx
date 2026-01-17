import { Button as ButtonPrimitive } from '@kobalte/core/button';
import { PolymorphicProps } from '@kobalte/core/polymorphic';
import { cn } from '@/lib/utils';
import { splitProps, type ComponentProps, type ValidComponent } from 'solid-js';

export type ButtonProps<T extends ValidComponent = 'button'> = ComponentProps<T> & {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link' | 'gradient';
  size?: 'default' | 'sm' | 'lg' | 'icon';
};

const getVariantClasses = (variant: ButtonProps['variant']): string => {
  switch (variant) {
    case 'destructive':
      return 'bg-red-600 text-white hover:bg-red-700';
    case 'outline':
      return 'border border-gray-600 bg-transparent hover:bg-gray-800 text-gray-200';
    case 'ghost':
      return 'hover:bg-gray-800 text-gray-200';
    case 'link':
      return 'underline-offset-4 hover:underline text-violet-400';
    case 'gradient':
      return 'bg-gradient-to-br from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700';
    default:
      return 'bg-violet-600 text-white hover:bg-violet-700';
  }
};

const getSizeClasses = (size: ButtonProps['size']): string => {
  switch (size) {
    case 'sm':
      return 'h-9 px-3 rounded-md';
    case 'lg':
      return 'h-11 px-8 rounded-md';
    case 'icon':
      return 'h-10 w-10';
    default:
      return 'h-10 py-2 px-4';
  }
};

export const Button = <T extends ValidComponent = 'button'>(props: PolymorphicProps<T, ButtonProps<T>>) => {
  const [local, rest] = splitProps(props as ButtonProps, ['variant', 'size', 'class']);

  const variant = local.variant ?? 'default';
  const size = local.size ?? 'default';

  return (
    <ButtonPrimitive
      class={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50 disabled:pointer-events-none',
        getVariantClasses(variant),
        getSizeClasses(size),
        local.class
      )}
      {...rest}
    />
  );
};
