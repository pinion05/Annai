import { beforeEach, describe, expect, it, vi } from 'vitest';

type Listener = (message: unknown, sender: unknown, sendResponse: (response: unknown) => void) => boolean | void;

let listeners: Listener[] = [];

vi.mock('wxt/browser', () => ({
  browser: {
    runtime: {
      onMessage: {
        addListener: (listener: Listener) => {
          listeners.push(listener);
        },
      },
    },
    storage: {
      local: {
        get: vi.fn(async () => ({ notion_api_key: '' })),
        set: vi.fn(async () => undefined),
      },
    },
  },
}));

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('background message routing', () => {
  beforeEach(async () => {
    listeners = [];
    (globalThis as any).defineBackground = (factory: () => void) => factory();
    vi.resetModules();
    await import('~/background');
  });

  it('ignores RUN_HEALTH_CHECK in the notion handler', async () => {
    expect(listeners.length).toBeGreaterThanOrEqual(1);
    const sendResponse = vi.fn();

    const result = listeners[0]({ type: 'RUN_HEALTH_CHECK' }, {}, sendResponse);
    expect(result).not.toBe(true);

    await flushPromises();

    expect(sendResponse).not.toHaveBeenCalled();
  });
});
