import { browser } from 'wxt/browser';

export default defineBackground(() => {
  const NOTION_API_BASE = 'https://api.notion.com/v1';
  const NOTION_VERSION = '2022-06-28';

  // Handle messages from content script
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message.type !== 'string') {
      return;
    }

    const needsStorage =
      message.type === 'SET_NOTION_API_KEY' ||
      message.type === 'GET_NOTION_API_KEY' ||
      message.type === 'SET_OPENROUTER_API_KEY' ||
      message.type === 'GET_OPENROUTER_API_KEY' ||
      message.type === 'RUN_HEALTH_CHECK' ||
      message.type === 'SET_NOTION_DATABASE_ID' ||
      message.type.startsWith('NOTION_');

    if (needsStorage && !browser.storage?.local) {
      sendResponse({ error: 'Storage API unavailable' });
      return true;
    }

    if (message.type === 'SET_NOTION_API_KEY') {
      browser.storage.local.set({ notion_api_key: message.apiKey }).then(() => {
        sendResponse({ success: true });
      });
      return true;
    }

    if (message.type === 'GET_NOTION_API_KEY') {
      browser.storage.local.get('notion_api_key').then((result) => {
        sendResponse({ apiKey: result.notion_api_key });
      });
      return true;
    }

    if (message.type === 'SET_OPENROUTER_API_KEY') {
      browser.storage.local.set({ openrouter_api_key: message.apiKey }).then(() => {
        sendResponse({ success: true });
      });
      return true;
    }

    if (message.type === 'GET_OPENROUTER_API_KEY') {
      browser.storage.local.get('openrouter_api_key').then((result) => {
        sendResponse({ apiKey: result.openrouter_api_key });
      });
      return true;
    }

    if (message.type === 'RUN_HEALTH_CHECK') {
      const maskKey = (value?: string) => {
        if (!value) return 'missing';
        const trimmed = value.trim();
        if (!trimmed) return 'empty';
        const last4 = trimmed.slice(-4);
        return `len:${trimmed.length} last4:${last4}`;
      };

      const runHealthCheck = async () => {
        const keys = await browser.storage.local.get(['openrouter_api_key', 'notion_api_key']);
        const openrouterKey = keys.openrouter_api_key as string | undefined;
        const notionKey = keys.notion_api_key as string | undefined;

        console.log('[health-check][background] start', {
          openrouter: maskKey(openrouterKey),
          notion: maskKey(notionKey),
        });

        const result: {
          openrouter: { ok: boolean; status: number; error?: string };
          notion: { ok: boolean; status: number; error?: string };
        } = {
          openrouter: { ok: false, status: 0, error: 'OpenRouter API key not configured' },
          notion: { ok: false, status: 0, error: 'Notion API key not configured' },
        };

        if (openrouterKey) {
          try {
            const response = await fetch('https://openrouter.ai/api/v1/models/user', {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${openrouterKey}`,
                'HTTP-Referer': 'https://notion.so',
                'X-Title': 'Annai',
              },
            });
            console.log('[health-check][background] openrouter response', {
              ok: response.ok,
              status: response.status,
            });
            result.openrouter = {
              ok: response.ok,
              status: response.status,
              error: response.ok ? undefined : await response.text(),
            };
          } catch (error) {
            result.openrouter = {
              ok: false,
              status: 0,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        }

        if (notionKey) {
          try {
            const response = await fetch(`${NOTION_API_BASE}/users/me`, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${notionKey}`,
                'Notion-Version': NOTION_VERSION,
              },
            });
            console.log('[health-check][background] notion response', {
              ok: response.ok,
              status: response.status,
            });
            result.notion = {
              ok: response.ok,
              status: response.status,
              error: response.ok ? undefined : await response.text(),
            };
          } catch (error) {
            result.notion = {
              ok: false,
              status: 0,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        }

        console.log('[health-check][background] result', result);
        return result;
      };

      runHealthCheck()
        .then(sendResponse)
        .catch((error) => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          sendResponse({
            openrouter: { ok: false, status: 0, error: errorMessage },
            notion: { ok: false, status: 0, error: errorMessage },
          });
        });
      return true;
    }

    if (message.type === 'SET_NOTION_DATABASE_ID') {
      browser.storage.local.set({ notion_database_id: message.databaseId }).then(() => {
        sendResponse({ success: true });
      });
      return true;
    }

    if (!message.type.startsWith('NOTION_')) {
      return;
    }

    const handleNotionRequest = async () => {
      const storage = await browser.storage.local.get('notion_api_key');
      const apiKey = storage.notion_api_key;

      if (!apiKey) {
        return { error: 'Notion API key not configured' };
      }

      const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      };

      try {
        switch (message.type) {
          case 'NOTION_SEARCH_PAGES': {
            const response = await fetch(`${NOTION_API_BASE}/search`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                query: message.query,
                page_size: message.limit,
                filter: { property: 'object', value: 'page' },
              }),
            });
            return await response.json();
          }

          case 'NOTION_GET_PAGE': {
            const response = await fetch(`${NOTION_API_BASE}/pages/${message.pageId}`, {
              method: 'GET',
              headers,
            });
            return await response.json();
          }

          case 'NOTION_GET_PAGE_CONTENT': {
            const response = await fetch(`${NOTION_API_BASE}/blocks/${message.pageId}/children`, {
              method: 'GET',
              headers,
            });
            return await response.json();
          }

          case 'NOTION_QUERY_DATABASE': {
            const response = await fetch(`${NOTION_API_BASE}/databases/${message.databaseId}/query`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                filter: message.filter,
                sorts: message.sorts,
              }),
            });
            return await response.json();
          }

          case 'NOTION_CREATE_PAGE': {
            const storage = await browser.storage.local.get('notion_database_id');
            const databaseId = storage.notion_database_id;

            const response = await fetch(`${NOTION_API_BASE}/pages`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                parent: message.parentId
                  ? { page_id: message.parentId }
                  : { database_id: databaseId },
                properties: {
                  title: {
                    title: [{ text: { content: message.title } }],
                  },
                },
                children: message.content
                  ? [
                      {
                        object: 'block',
                        type: 'paragraph',
                        paragraph: {
                          rich_text: [{ type: 'text', text: { content: message.content } }],
                        },
                      },
                    ]
                  : undefined,
              }),
            });
            return await response.json();
          }

          case 'NOTION_UPDATE_PAGE_PROPERTIES': {
            const response = await fetch(`${NOTION_API_BASE}/pages/${message.pageId}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({
                properties: message.properties,
              }),
            });
            return await response.json();
          }

          case 'NOTION_APPEND_BLOCK': {
            const response = await fetch(`${NOTION_API_BASE}/blocks/${message.pageId}/children`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({
                children: [
                  {
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                      rich_text: [{ type: 'text', text: { content: message.content } }],
                    },
                  },
                ],
              }),
            });
            return await response.json();
          }

          case 'NOTION_GET_DATABASE': {
            const response = await fetch(`${NOTION_API_BASE}/databases/${message.databaseId}`, {
              method: 'GET',
              headers,
            });
            return await response.json();
          }

          case 'NOTION_LIST_USERS': {
            const response = await fetch(`${NOTION_API_BASE}/users`, {
              method: 'GET',
              headers,
            });
            return await response.json();
          }

          case 'NOTION_CREATE_COMMENT': {
            const response = await fetch(`${NOTION_API_BASE}/comments`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                parent: { page_id: message.pageId },
                rich_text: [{ text: { content: message.content } }],
              }),
            });
            return await response.json();
          }

          case 'NOTION_GET_ME': {
            const response = await fetch(`${NOTION_API_BASE}/users/me`, {
              method: 'GET',
              headers,
            });
            return await response.json();
          }

          default:
            return { error: 'Unknown message type' };
        }
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    };

    handleNotionRequest().then(sendResponse);
    return true;
  });

  console.log('[DEBUG] Annai background script initialized');
});
