import { browser } from 'wxt/browser';
import { runHealthChecks } from '@/lib/health-check';

export default defineBackground(() => {
  const NOTION_API_BASE = 'https://api.notion.com/v1';
  const NOTION_VERSION = '2022-06-28';

  // Handle messages from content script
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const messageType = typeof message?.type === 'string' ? message.type : '';
    if (!messageType.startsWith('NOTION_')) {
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

  // Handle API key storage
  browser.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.type === 'RUN_HEALTH_CHECK') {
      browser.storage.local
        .get(['openrouter_api_key', 'notion_api_key'])
        .then((result) => {
          const openrouterKey =
            typeof message.openrouterKey === 'string'
              ? message.openrouterKey
              : (result.openrouter_api_key as string | undefined);
          const notionKey =
            typeof message.notionKey === 'string'
              ? message.notionKey
              : (result.notion_api_key as string | undefined);
          return runHealthChecks({
            openrouterKey,
            notionKey,
            notionVersion: NOTION_VERSION,
          });
        })
        .then(sendResponse);
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

    if (message.type === 'SET_NOTION_DATABASE_ID') {
      browser.storage.local.set({ notion_database_id: message.databaseId }).then(() => {
        sendResponse({ success: true });
      });
      return true;
    }
  });

  console.log('[DEBUG] Annai background script initialized');
});
