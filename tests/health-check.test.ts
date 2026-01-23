import { describe, expect, it, vi } from 'vitest';
import { runHealthChecks } from '@/lib/health-check';

const makeFetcher = (responses: Array<{ ok: boolean; status: number; json?: () => Promise<unknown> }>) => {
  const fetcher = vi.fn(async () => responses.shift()!);
  return fetcher;
};

describe('runHealthChecks', () => {
  it('returns missing-key errors when keys are absent', async () => {
    const result = await runHealthChecks({
      notionVersion: '2022-06-28',
      fetcher: makeFetcher([]),
    });
    expect(result.openrouter.ok).toBe(false);
    expect(result.openrouter.error).toMatch(/Missing OpenRouter/i);
    expect(result.notion.ok).toBe(false);
    expect(result.notion.error).toMatch(/Missing Notion/i);
  });

  it('returns ok when both checks succeed', async () => {
    const result = await runHealthChecks({
      openrouterKey: 'or-key',
      notionKey: 'notion-key',
      notionVersion: '2022-06-28',
      fetcher: makeFetcher([
        {
          ok: true,
          status: 200,
          json: async () => ({
            data: [],
          }),
        },
        { ok: true, status: 200 },
      ]),
    });
    expect(result.openrouter.ok).toBe(true);
    expect(result.notion.ok).toBe(true);
  });

  it('propagates failing status for OpenRouter', async () => {
    const result = await runHealthChecks({
      openrouterKey: 'or-key',
      notionKey: 'notion-key',
      notionVersion: '2022-06-28',
      fetcher: makeFetcher([
        { ok: false, status: 401 },
        { ok: true, status: 200 },
      ]),
    });
    expect(result.openrouter.ok).toBe(false);
    expect(result.openrouter.status).toBe(401);
  });

  it('fails OpenRouter check when response includes error body', async () => {
    const result = await runHealthChecks({
      openrouterKey: 'or-key',
      notionKey: 'notion-key',
      notionVersion: '2022-06-28',
      fetcher: makeFetcher([
        {
          ok: true,
          status: 200,
          json: async () => ({
            error: { code: 402, message: 'Insufficient credits' },
          }),
        },
        { ok: true, status: 200 },
      ]),
    });
    expect(result.openrouter.ok).toBe(false);
    expect(result.openrouter.error).toMatch(/credits/i);
  });

  it('fails OpenRouter check when response data is missing', async () => {
    const result = await runHealthChecks({
      openrouterKey: 'or-key',
      notionKey: 'notion-key',
      notionVersion: '2022-06-28',
      fetcher: makeFetcher([
        {
          ok: true,
          status: 200,
          json: async () => ({
            data: null,
          }),
        },
        { ok: true, status: 200 },
      ]),
    });
    expect(result.openrouter.ok).toBe(false);
    expect(result.openrouter.error).toMatch(/data/i);
  });

  it('fails OpenRouter check on timeout', async () => {
    vi.useFakeTimers();
    const fetcher = vi
      .fn()
      .mockImplementationOnce(() => new Promise(() => {}))
      .mockResolvedValueOnce({ ok: true, status: 200 });

    try {
      const promise = runHealthChecks({
        openrouterKey: 'or-key',
        notionKey: 'notion-key',
        notionVersion: '2022-06-28',
        fetcher,
      });

      await vi.advanceTimersByTimeAsync(5000);
      const result = await promise;

      expect(result.openrouter.ok).toBe(false);
      expect(result.openrouter.error).toMatch(/timed out/i);
    } finally {
      vi.useRealTimers();
    }
  });
});
