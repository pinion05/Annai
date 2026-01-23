import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FloatingWidget from '@/components/FloatingWidget';

vi.mock('@/components/chat/useChat', () => ({
  useChat: () => ({
    messages: [],
    sendMessage: vi.fn(),
    isLoading: false,
    stopGenerating: vi.fn(),
    clearMessages: vi.fn(),
  }),
}));

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
  delete (globalThis as any).browser;
});

describe('FloatingWidget settings', () => {
  it('loads stored keys when opening settings', async () => {
    (globalThis as any).browser = {
      runtime: { getURL: vi.fn(() => '/icon/Annai.png'), sendMessage: vi.fn() },
      storage: {
        local: {
          get: vi.fn(async () => ({ openrouter_api_key: 'or', notion_api_key: 'no' })),
        },
      },
    };

    render(<FloatingWidget initialState="expanded" />);
    await userEvent.click(screen.getByLabelText(/open settings/i));

    expect(await screen.findByLabelText(/openrouter api key/i)).toHaveValue('or');
    expect(await screen.findByLabelText(/notion api key/i)).toHaveValue('no');
  });

  it('does not crash when storage is unavailable', async () => {
    (globalThis as any).browser = {
      runtime: { getURL: vi.fn(() => '/icon/Annai.png'), sendMessage: vi.fn() },
    };

    render(<FloatingWidget initialState="expanded" />);
    await userEvent.click(screen.getByLabelText(/open settings/i));

    expect(await screen.findByLabelText(/openrouter api key/i)).toHaveValue('');
    expect(await screen.findByLabelText(/notion api key/i)).toHaveValue('');
  });

  it('saves keys and runs health check', async () => {
    const set = vi.fn(async () => undefined);
    const sendMessage = vi.fn(async () => ({
      openrouter: { ok: true },
      notion: { ok: false },
    }));

    (globalThis as any).browser = {
      runtime: { getURL: vi.fn(() => '/icon/Annai.png'), sendMessage },
      storage: {
        local: {
          get: vi.fn(async () => ({ openrouter_api_key: '', notion_api_key: '' })),
          set,
        },
      },
    };

    render(<FloatingWidget initialState="expanded" />);
    await userEvent.click(screen.getByLabelText(/open settings/i));

    const openrouterInput = await screen.findByLabelText(/openrouter api key/i);
    await userEvent.type(openrouterInput, 'abc');

    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(set).toHaveBeenCalledWith({
      openrouter_api_key: 'abc',
      notion_api_key: '',
    });
    expect(sendMessage).toHaveBeenCalledWith({ type: 'RUN_HEALTH_CHECK' });

    expect(await screen.findByText(/openrouter: connected/i)).toBeInTheDocument();
    expect(await screen.findByText(/notion: failed/i)).toBeInTheDocument();
  });
});
