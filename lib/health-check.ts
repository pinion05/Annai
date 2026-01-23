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
  const openrouter = await (async (): Promise<HealthCheckResult> => {
    if (!openrouterKey) {
      return { ok: false, status: 0, error: 'Missing OpenRouter API key' };
    }
    try {
      const response = await fetcher('https://openrouter.ai/api/v1/key', {
        method: 'GET',
        headers: { Authorization: `Bearer ${openrouterKey}` },
      });
      if (!response.ok) {
        return { ok: false, status: response.status, error: 'OpenRouter request failed' };
      }
      if (typeof response.json !== 'function') {
        return { ok: false, status: response.status, error: 'OpenRouter response missing key info' };
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
      const keyInfo = (data as { data?: unknown })?.data;
      if (!keyInfo || typeof keyInfo !== 'object') {
        return { ok: false, status: response.status, error: 'OpenRouter response missing key info' };
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
