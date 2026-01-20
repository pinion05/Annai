# Widget Settings + Health Check Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a settings view in the floating widget to save OpenRouter/Notion keys and run post-save health checks.

**Architecture:** The widget toggles between chat and settings views, loads/saves keys via `browser.storage.local`, and requests health checks from the background script. Background performs OpenRouter `/models` and Notion `/users/me` checks and returns per-service status.

**Tech Stack:** React, WXT, Tailwind, `browser.storage.local`, runtime messaging.

### Task 0: Set up Vitest + React Testing Library

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `tests/smoke.test.ts`

**Step 1: Add test dependencies**

Run:
```bash
bun add -d vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Step 2: Add test scripts**

```json
// package.json (scripts)
{
  "test": "vitest",
  "test:run": "vitest run"
}
```

**Step 3: Add Vitest config**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
});
```

**Step 4: Add test setup**

```ts
// tests/setup.ts
import '@testing-library/jest-dom/vitest';
```

**Step 5: Add smoke test**

```ts
// tests/smoke.test.ts
import { expect, test } from 'vitest';

test('vitest works', () => {
  expect(1 + 1).toBe(2);
});
```

**Step 6: Run tests**
Run: `bun run test:run`
Expected: 1 passing

**Step 7: Commit**
```bash
git add package.json bun.lock vitest.config.ts tests/setup.ts tests/smoke.test.ts
git commit -m "chore: add vitest test runner"
```

### Task 1: Allow OpenRouter network access in manifest

**Files:**
- Modify: `wxt.config.ts`

**Step 1: Update host permissions**

```ts
// wxt.config.ts
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    host_permissions: [
      '*://*.notion.so/*',
      '*://notion.so/*',
      '*://api.notion.com/*',
      'https://openrouter.ai/*'
    ],
    // ...
  },
});
```

**Step 2: Run typecheck**
Run: `bun run compile`
Expected: exit 0

**Step 3: Commit**
```bash
git add wxt.config.ts
git commit -m "chore: allow openrouter host permissions"
```

### Task 2: Add background health check handler

**Files:**
- Create: `lib/health-check.ts`
- Create: `tests/health-check.test.ts`
- Modify: `entrypoints/background.ts`

**Step 1: Write failing tests for health checks**

```ts
// tests/health-check.test.ts
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
      fetcher: makeFetcher([{ ok: true, status: 200 }, { ok: true, status: 200 }]),
    });
    expect(result.openrouter.ok).toBe(true);
    expect(result.notion.ok).toBe(true);
  });

  it('propagates failing status for OpenRouter', async () => {
    const result = await runHealthChecks({
      openrouterKey: 'or-key',
      notionKey: 'notion-key',
      notionVersion: '2022-06-28',
      fetcher: makeFetcher([{ ok: false, status: 401 }, { ok: true, status: 200 }]),
    });
    expect(result.openrouter.ok).toBe(false);
    expect(result.openrouter.status).toBe(401);
  });
});
```

**Step 2: Run tests to verify failure**
Run: `bun run test:run`
Expected: FAIL (module not found or function not defined)

**Step 3: Implement health check helper**

```ts
// lib/health-check.ts
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
    if (!openrouterKey) return { ok: false, status: 0, error: 'Missing OpenRouter API key' };
    try {
      const response = await fetcher('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${openrouterKey}` },
      });
      if (!response.ok) return { ok: false, status: response.status, error: 'OpenRouter request failed' };
      return { ok: true, status: response.status };
    } catch (error) {
      return { ok: false, status: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  })();

  const notion = await (async (): Promise<HealthCheckResult> => {
    if (!notionKey) return { ok: false, status: 0, error: 'Missing Notion API key' };
    try {
      const response = await fetcher('https://api.notion.com/v1/users/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${notionKey}`,
          'Notion-Version': notionVersion,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) return { ok: false, status: response.status, error: 'Notion request failed' };
      return { ok: true, status: response.status };
    } catch (error) {
      return { ok: false, status: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  })();

  return { openrouter, notion };
}
```

**Step 4: Run tests to verify pass**
Run: `bun run test:run`
Expected: PASS

**Step 5: Wire handler in background**

```ts
// entrypoints/background.ts (inside onMessage listener)
if (message.type === 'RUN_HEALTH_CHECK') {
  const storage = await browser.storage.local.get(['openrouter_api_key', 'notion_api_key']);
  const result = await runHealthChecks({
    openrouterKey: storage.openrouter_api_key as string | undefined,
    notionKey: storage.notion_api_key as string | undefined,
    notionVersion: NOTION_VERSION,
  });
  sendResponse(result);
  return true;
}
```

**Step 6: Run tests**
Run: `bun run test:run`
Expected: PASS

**Step 7: Run typecheck**
Run: `bun run compile`
Expected: exit 0

**Step 8: Commit**
```bash
git add lib/health-check.ts tests/health-check.test.ts entrypoints/background.ts
git commit -m "feat: add background health check"
```

### Task 3: Add settings view + save + health check UI

**Files:**
- Modify: `components/FloatingWidget.tsx`
- Create: `tests/floating-widget-settings.test.tsx`

**Step 1: Write failing tests for settings view**

```tsx
// tests/floating-widget-settings.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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

describe('FloatingWidget settings', () => {
  it('loads stored keys when opening settings', async () => {
    (globalThis as any).browser = {
      runtime: { getURL: vi.fn(() => '/icon/Annai.png'), sendMessage: vi.fn() },
      storage: { local: { get: vi.fn(async () => ({ openrouter_api_key: 'or', notion_api_key: 'no' })) } },
    };

    render(<FloatingWidget initialState=\"expanded\" />);
    await userEvent.click(screen.getByLabelText(/open settings/i));
    expect(await screen.findByLabelText(/openrouter api key/i)).toHaveValue('or');
    expect(await screen.findByLabelText(/notion api key/i)).toHaveValue('no');
  });

  it('saves keys and runs health check', async () => {
    const set = vi.fn(async () => undefined);
    const sendMessage = vi.fn(async () => ({ openrouter: { ok: true }, notion: { ok: false } }));
    (globalThis as any).browser = {
      runtime: { getURL: vi.fn(() => '/icon/Annai.png'), sendMessage },
      storage: { local: { get: vi.fn(async () => ({ openrouter_api_key: '', notion_api_key: '' })), set } },
    };

    render(<FloatingWidget initialState=\"expanded\" />);
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
```

**Step 2: Run tests to verify failure**
Run: `bun run test:run`
Expected: FAIL (labels/buttons not found or missing settings UI)

**Step 3: Implement settings view**

```ts
const [view, setView] = useState<'chat' | 'settings'>('chat');
const [settingsDraft, setSettingsDraft] = useState({ openrouterApiKey: '', notionApiKey: '' });
const [isDirty, setIsDirty] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [healthStatus, setHealthStatus] = useState<{
  openrouter?: { ok: boolean; status: number; error?: string };
  notion?: { ok: boolean; status: number; error?: string };
}>({});
```

**Step 4: Load stored keys when settings view opens**

```ts
useEffect(() => {
  if (view !== 'settings' || typeof browser === 'undefined') return;
  browser.storage.local.get(['openrouter_api_key', 'notion_api_key']).then((result) => {
    setSettingsDraft({
      openrouterApiKey: result.openrouter_api_key ?? '',
      notionApiKey: result.notion_api_key ?? '',
    });
    setIsDirty(false);
  });
}, [view]);
```

**Step 5: Save + run health check**

```ts
const handleSaveSettings = async () => {
  if (typeof browser === 'undefined') return;
  setIsSaving(true);
  await browser.storage.local.set({
    openrouter_api_key: settingsDraft.openrouterApiKey,
    notion_api_key: settingsDraft.notionApiKey,
  });
  setIsDirty(false);
  browser.runtime.sendMessage({ type: 'RUN_HEALTH_CHECK' }).then((result) => {
    setHealthStatus(result ?? {});
  }).finally(() => setIsSaving(false));
};
```

**Step 6: Add header controls + settings view UI**

```tsx
// Header right-side buttons
<button onClick={() => setView(view === 'chat' ? 'settings' : 'chat')}>
  {view === 'chat' ? '⚙' : '←'}
</button>

// Render settings view
{view === 'settings' && !isMinimized && (
  <div className="flex-1 p-4 space-y-4 bg-gray-900/50">
    <div>
      <p className="text-sm text-gray-400">Settings</p>
    </div>
    <div className="space-y-3">
      <div>
        <label className="text-xs text-gray-400">OpenRouter API Key</label>
        <Input
          type="text"
          value={settingsDraft.openrouterApiKey}
          onChange={(e) => {
            setSettingsDraft((prev) => ({ ...prev, openrouterApiKey: e.target.value }));
            setIsDirty(true);
          }}
        />
      </div>
      <div>
        <label className="text-xs text-gray-400">Notion API Key</label>
        <Input
          type="text"
          value={settingsDraft.notionApiKey}
          onChange={(e) => {
            setSettingsDraft((prev) => ({ ...prev, notionApiKey: e.target.value }));
            setIsDirty(true);
          }}
        />
      </div>
    </div>
    <div className="flex items-center gap-3">
      <Button onClick={handleSaveSettings} disabled={!isDirty || isSaving}>
        {isSaving ? 'Saving...' : 'Save'}
      </Button>
    </div>
    <div className="text-xs text-gray-400 space-y-1">
      <div>OpenRouter: {healthStatus.openrouter?.ok ? 'Connected' : healthStatus.openrouter ? 'Failed' : '—'}</div>
      <div>Notion: {healthStatus.notion?.ok ? 'Connected' : healthStatus.notion ? 'Failed' : '—'}</div>
    </div>
  </div>
)}
```

**Step 7: Run tests**
Run: `bun run test:run`
Expected: PASS

**Step 8: Run typecheck**
Run: `bun run compile`
Expected: exit 0

**Step 9: Commit**
```bash
git add components/FloatingWidget.tsx tests/floating-widget-settings.test.tsx
git commit -m "feat: add widget settings and health checks"
```

### Task 4: Manual verification

**Files:**
- None

**Step 1: Run dev and verify behavior**
Run: `bun run dev`
Expected: Widget opens, settings toggles, keys persist, and health check results appear after Save.

**Step 2: Capture notes**
Record any manual findings for follow-up.
