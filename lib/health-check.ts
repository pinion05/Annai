export type HealthCheckResult = {
  ok: boolean;
  status: number;
  error?: string;
};

export type HealthCheckSummary = {
  openrouter: HealthCheckResult;
  notion: HealthCheckResult;
};

type FetcherResponse = {
  ok: boolean;
  status: number;
  json?: () => Promise<unknown>;
};

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<FetcherResponse>;

export async function runHealthChecks({
  openrouterKey,
  notionKey,
  notionVersion,
  fetcher = fetch,
}: {
  openrouterKey?: string;
  notionKey?: string;
  notionVersion: string;
  fetcher?: Fetcher;
}): Promise<HealthCheckSummary> {
  const OPENROUTER_TIMEOUT_MS = 5000;
  const openrouter = await (async (): Promise<HealthCheckResult> => {
    if (!openrouterKey) {
      return { ok: false, status: 0, error: 'Missing OpenRouter API key' };
    }
    try {
      const controller = new AbortController();
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const response = await Promise.race<FetcherResponse>([
        fetcher('https://openrouter.ai/api/v1/models/user', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${openrouterKey}`,
          },
          signal: controller.signal,
        }),
        new Promise<FetcherResponse>((_, reject) => {
          timeoutId = setTimeout(() => {
            controller.abort();
            reject(new Error('OpenRouter request timed out'));
          }, OPENROUTER_TIMEOUT_MS);
        }),
      ]).finally(() => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      });
      if (!response.ok) {
        return { ok: false, status: response.status, error: 'OpenRouter request failed' };
      }
      if (typeof response.json !== 'function') {
        return { ok: false, status: response.status, error: 'OpenRouter response missing JSON' };
      }
      let data: unknown;
      try {
        data = await response.json();
      } catch (error) {
        return {
          ok: false,
          status: response.status,
          error: error instanceof Error ? error.message : 'OpenRouter response invalid JSON',
        };
      }
      const errorMessage =
        typeof (data as { error?: { message?: string } })?.error?.message === 'string'
          ? (data as { error?: { message?: string } }).error?.message
          : undefined;
      if (errorMessage) {
        return { ok: false, status: response.status, error: errorMessage };
      }
      const models = (data as { data?: unknown })?.data;
      if (!Array.isArray(models)) {
        return { ok: false, status: response.status, error: 'OpenRouter response missing data' };
      }
      return { ok: true, status: response.status };
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('timed out'))) {
        return { ok: false, status: 0, error: 'OpenRouter request timed out' };
      }
      return {
        ok: false,
        status: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  })();

  const notion = await (async (): Promise<HealthCheckResult> => {
    if (!notionKey) {
      return { ok: false, status: 0, error: 'Missing Notion API key' };
    }
    try {
      const response = await fetcher('https://api.notion.com/v1/users/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${notionKey}`,
          'Notion-Version': notionVersion,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        return { ok: false, status: response.status, error: 'Notion request failed' };
      }
      return { ok: true, status: response.status };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  })();

  return { openrouter, notion };
}
