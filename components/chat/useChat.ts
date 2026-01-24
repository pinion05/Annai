import { useState, useCallback, useEffect, useRef } from 'react';
import { browser } from 'wxt/browser';
import { notionToolDefinitions, notionTools } from '@/lib/notion-tools';
import type { Message, ToolCall } from '@/components/chat/types';

export interface UseChatOptions {
  apiUrl?: string;
  model?: string;
}

type OpenRouterMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
  name?: string;
};

const SYSTEM_PROMPT = `You are Annai, a Notion assistant embedded in the user's workspace.

Tool usage rules:
- If you need IDs, use search_notion first.
- Use get_database before query_database if properties are unknown.
- Use retrieve_page for metadata, get_page_content for block text.
- Use update_page_properties for metadata changes and append_block_to_page for content.
- Chain tools step-by-step and verify results when unsure.`;

const DEFAULT_MODEL = 'nvidia/nemotron-3-nano-30b-a3b:free';

const parseToolArgs = (raw: string) => {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { _raw: raw };
  }
};

const toApiMessages = (messages: Message[]): OpenRouterMessage[] => {
  return messages.map((message) => {
    if (message.role === 'assistant') {
      return {
        role: 'assistant',
        content: message.content,
        tool_calls: message.toolCalls?.length
          ? message.toolCalls.map((toolCall) => ({
              id: toolCall.id,
              type: 'function',
              function: {
                name: toolCall.name,
                arguments: JSON.stringify(toolCall.args ?? {}),
              },
            }))
          : undefined,
      };
    }

    if (message.role === 'tool') {
      return {
        role: 'tool',
        content: message.content,
        tool_call_id: message.toolCallId,
        name: message.name,
      };
    }

    return {
      role: message.role,
      content: message.content,
    };
  });
};

const streamChatCompletion = async ({
  apiUrl,
  apiKey,
  model,
  messages,
  signal,
  onContent,
}: {
  apiUrl: string;
  apiKey: string;
  model: string;
  messages: OpenRouterMessage[];
  signal?: AbortSignal;
  onContent?: (content: string) => void;
}) => {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://notion.so',
      'X-Title': 'Annai',
    },
    body: JSON.stringify({
      model,
      messages,
      tools: notionToolDefinitions,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter error (${response.status}): ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let assistantContent = '';
  let finishReason: string | undefined;
  const toolCallAccumulators: Array<{ id?: string; name?: string; args: string }> = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data || data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        const choice = parsed.choices?.[0];
        const delta = choice?.delta ?? {};

        if (choice?.finish_reason) {
          finishReason = choice.finish_reason;
        }

        if (delta.content) {
          assistantContent += delta.content;
          onContent?.(assistantContent);
        }

        if (delta.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            const index = toolCall.index ?? 0;
            if (!toolCallAccumulators[index]) {
              toolCallAccumulators[index] = { args: '' };
            }
            const entry = toolCallAccumulators[index];
            if (toolCall.id) entry.id = toolCall.id;
            if (toolCall.function?.name) entry.name = toolCall.function.name;
            if (toolCall.function?.arguments) entry.args += toolCall.function.arguments;
          }
        }
      } catch {
        // Skip invalid JSON
      }
    }
  }

  const toolCalls: ToolCall[] = toolCallAccumulators
    .filter(Boolean)
    .map((entry) => ({
      id: entry.id ?? crypto.randomUUID(),
      name: entry.name ?? 'unknown_tool',
      args: parseToolArgs(entry.args),
    }));

  return { content: assistantContent, toolCalls, finishReason };
};

export function useChat(options: UseChatOptions = {}) {
  const { apiUrl = 'https://openrouter.ai/api/v1/chat/completions', model = DEFAULT_MODEL } = options;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const updateMessages = useCallback((updater: (prev: Message[]) => Message[]) => {
    setMessages((prev) => {
      const next = updater(prev);
      messagesRef.current = next;
      return next;
    });
  }, []);

  const updateMessageById = useCallback((id: string, updater: (message: Message) => Message) => {
    updateMessages((prev) => prev.map((message) => (message.id === id ? updater(message) : message)));
  }, [updateMessages]);

  const appendMessages = useCallback((newMessages: Message[]) => {
    updateMessages((prev) => [...prev, ...newMessages]);
  }, [updateMessages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
    };

    const createAssistantMessage = (): Message => ({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      toolCalls: [],
      isThinking: true,
    });

    const assistantMessage = createAssistantMessage();
    let activeAssistantId = assistantMessage.id;

    const history = messagesRef.current;
    updateMessages((prev) => [...prev, userMessage, assistantMessage]);

    try {
      const stored = await browser.runtime.sendMessage({ type: 'GET_OPENROUTER_API_KEY' });
      const apiKey = stored?.apiKey as string | undefined;

      if (!apiKey) {
        updateMessageById(activeAssistantId, (message) => ({
          ...message,
          content: 'OpenRouter API key not configured. Open settings to add it.',
          isThinking: false,
        }));
        return;
      }

      const systemMessage: OpenRouterMessage = { role: 'system', content: SYSTEM_PROMPT };
      let conversation: OpenRouterMessage[] = [
        systemMessage,
        ...toApiMessages([...history, userMessage]),
      ];

      const MAX_TOOL_LOOPS = 8;
      let loopCount = 0;

      while (loopCount < MAX_TOOL_LOOPS) {
        loopCount += 1;

        abortControllerRef.current = new AbortController();
        const { content: assistantContent, toolCalls } = await streamChatCompletion({
          apiUrl,
          apiKey,
          model,
          messages: conversation,
          signal: abortControllerRef.current.signal,
          onContent: (partial) => {
            updateMessageById(activeAssistantId, (message) => ({
              ...message,
              content: partial,
              isThinking: false,
            }));
          },
        });

        updateMessageById(activeAssistantId, (message) => ({
          ...message,
          content: assistantContent,
          toolCalls: toolCalls.length ? toolCalls : message.toolCalls,
          isThinking: false,
        }));

        if (!toolCalls.length) {
          break;
        }

        const executedToolCalls = await Promise.all(
          toolCalls.map(async (toolCall) => {
            const tool = notionTools[toolCall.name];

            if (!tool) {
              return { ...toolCall, result: { error: 'Unknown tool' } };
            }

            const parsed = tool.schema.safeParse(toolCall.args);
            if (!parsed.success) {
              return {
                ...toolCall,
                result: {
                  error: 'Invalid tool arguments',
                  details: parsed.error.flatten(),
                },
              };
            }

            try {
              const result = await tool.execute(parsed.data);
              return { ...toolCall, result };
            } catch (error) {
              return {
                ...toolCall,
                result: {
                  error: error instanceof Error ? error.message : 'Unknown error',
                },
              };
            }
          })
        );

        updateMessageById(activeAssistantId, (message) => ({
          ...message,
          toolCalls: executedToolCalls,
          isThinking: false,
        }));

        const toolMessages: Message[] = executedToolCalls.map((toolCall) => ({
          id: crypto.randomUUID(),
          role: 'tool',
          content: JSON.stringify(toolCall.result ?? {}),
          toolCallId: toolCall.id,
          name: toolCall.name,
        }));

        appendMessages(toolMessages);

        conversation = [
          ...conversation,
          {
            role: 'assistant',
            content: assistantContent,
            tool_calls: executedToolCalls.map((toolCall) => ({
              id: toolCall.id,
              type: 'function',
              function: {
                name: toolCall.name,
                arguments: JSON.stringify(toolCall.args ?? {}),
              },
            })),
          },
          ...toApiMessages(toolMessages),
        ];

        if (loopCount >= MAX_TOOL_LOOPS) {
          updateMessageById(activeAssistantId, (message) => ({
            ...message,
            content: message.content || 'Tool call limit reached. Try a smaller request.',
            isThinking: false,
          }));
          break;
        }

        const nextAssistantMessage = createAssistantMessage();
        appendMessages([nextAssistantMessage]);
        activeAssistantId = nextAssistantMessage.id;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Chat error:', error);
      updateMessageById(activeAssistantId, (message) => ({
        ...message,
        content: 'Error: Failed to get response',
        isThinking: false,
      }));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [apiUrl, model, isLoading, updateMessages, updateMessageById, appendMessages]);

  const clearMessages = useCallback(() => {
    updateMessages(() => []);
  }, [updateMessages]);

  const stopGenerating = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    stopGenerating,
    clearMessages,
  };
}
