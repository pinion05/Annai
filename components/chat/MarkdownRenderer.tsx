import React, { useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '../../lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  language?: string;
  value: string;
}

function CodeBlock({ language, value, className, ...props }: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async () => {
    if (!navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div
      className={cn(
        "rounded-md overflow-hidden my-4 border border-gray-700 bg-[#1e1e1e]",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] text-gray-200 border-b border-gray-700">
        <span className="text-xs font-mono font-medium text-gray-300">
          {language || 'text'}
        </span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          aria-label="Copy code"
        >
          {isCopied ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '1rem',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          background: 'transparent',
        }}
        wrapLines={true}
        wrapLongLines={true}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

const MARKDOWN_COMPONENTS: Components = {
  h1: ({ className, ...props }: React.ComponentPropsWithoutRef<'h1'>) => (
    <h1
      className={cn(
        "scroll-m-20 text-2xl font-extrabold tracking-tight lg:text-3xl mb-4",
        className
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }: React.ComponentPropsWithoutRef<'h2'>) => (
    <h2
      className={cn(
        "scroll-m-20 border-b pb-2 text-xl font-semibold tracking-tight transition-colors first:mt-0 mb-3",
        className
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }: React.ComponentPropsWithoutRef<'h3'>) => (
    <h3
      className={cn(
        "scroll-m-20 text-lg font-semibold tracking-tight mb-2",
        className
      )}
      {...props}
    />
  ),
  p: ({ className, ...props }: React.ComponentPropsWithoutRef<'p'>) => (
    <p
      className={cn("leading-7 [&:not(:first-child)]:mt-4", className)}
      {...props}
    />
  ),
  ul: ({ className, ...props }: React.ComponentPropsWithoutRef<'ul'>) => (
    <ul
      className={cn("my-4 ml-6 list-disc [&>li]:mt-2", className)}
      {...props}
    />
  ),
  ol: ({ className, ...props }: React.ComponentPropsWithoutRef<'ol'>) => (
    <ol
      className={cn("my-4 ml-6 list-decimal [&>li]:mt-2", className)}
      {...props}
    />
  ),
  a: ({ className, ...props }: React.ComponentPropsWithoutRef<'a'>) => (
    <a
      className={cn(
        "font-medium text-primary underline underline-offset-4",
        className
      )}
      {...props}
    />
  ),
  blockquote: ({ className, ...props }: React.ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote
      className={cn("mt-6 border-l-2 pl-6 italic", className)}
      {...props}
    />
  ),
  code: ({ node, inline, className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean; node?: unknown }) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';

    if (inline) {
      return (
        <code
          className={cn(
            "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
            className
          )}
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <CodeBlock
        language={language}
        value={String(children).replace(/\n$/, '')}
        {...props}
      />
    );
  },
};

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('break-words', className)}>
      <ReactMarkdown components={MARKDOWN_COMPONENTS} remarkPlugins={[remarkBreaks]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
