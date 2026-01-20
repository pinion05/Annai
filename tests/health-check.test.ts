import { describe, expect, it, vi } from 'vitest';
import { runHealthChecks } from '@/lib/health-check';

const makeFetcher = (responses: Array<{ ok: boolean; status: number }>) => {
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
        { ok: true, status: 200 },
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
});
