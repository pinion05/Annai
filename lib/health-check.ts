export type HealthCheckResult = {
  ok: boolean;
  status: number;
  error?: string;
};

export type HealthCheckSummary = {
  openrouter: HealthCheckResult;
  notion: HealthCheckResult;
};

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<{ ok: boolean; status: number }>;

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
      const response = await fetcher('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${openrouterKey}` },
      });
      if (!response.ok) {
        return { ok: false, status: response.status, error: 'OpenRouter request failed' };
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
