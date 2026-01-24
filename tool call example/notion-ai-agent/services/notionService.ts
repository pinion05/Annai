import { NotionConfig, NotionSearchResult } from '../types';

const NOTION_API_BASE = 'https://api.notion.com/v1';

// Helper to handle CORS proxy injection
const getUrl = (path: string, config: NotionConfig) => {
  const target = `${NOTION_API_BASE}${path}`;
  if (config.proxyUrl) {
    return `${config.proxyUrl}${encodeURIComponent(target)}`;
  }
  return target;
};

const getHeaders = (config: NotionConfig) => {
  return {
    'Authorization': `Bearer ${config.apiKey}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  };
};

export const notionService = {
  // 1. Search (Updated with pageSize)
  async search(query: string, config: NotionConfig, pageSize: number = 10): Promise<any> {
    const response = await fetch(getUrl('/search', config), {
      method: 'POST',
      headers: getHeaders(config),
      body: JSON.stringify({
        query,
        page_size: pageSize,
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time',
        },
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API Error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();

    // Simplify results
    const simplifiedResults = data.results.map((item: any) => {
        let title = "Untitled";
        
        if (item.object === 'database' && item.title) {
             title = item.title.map((t: any) => t.plain_text).join('');
        } else if (item.object === 'page' && item.properties) {
            const titleProp = Object.values(item.properties).find((p: any) => p.type === 'title');
            if (titleProp && (titleProp as any).title) {
                title = (titleProp as any).title.map((t: any) => t.plain_text).join('');
            }
        }
        
        return {
            id: item.id,
            object: item.object,
            title: title || "Untitled",
            url: item.url,
            last_edited_time: item.last_edited_time
        };
    });

    return {
        results: simplifiedResults,
        count: simplifiedResults.length,
        note: simplifiedResults.length === 0 ? "No results found. Ensure the Notion pages are shared with the integration." : undefined
    };
  },

  // 2. Query Database (New)
  async queryDatabase(databaseId: string, filter: any, sorts: any[], config: NotionConfig): Promise<any> {
    const body: any = {};
    if (filter) body.filter = filter;
    if (sorts && sorts.length > 0) body.sorts = sorts;

    const response = await fetch(getUrl(`/databases/${databaseId}/query`, config), {
        method: 'POST',
        headers: getHeaders(config),
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Notion API Error (${response.status}): ${error}`);
    }
    return response.json();
  },

  // 3. Retrieve Page (New) - Gets properties/metadata
  async retrievePage(pageId: string, config: NotionConfig): Promise<any> {
    const response = await fetch(getUrl(`/pages/${pageId}`, config), {
        method: 'GET',
        headers: getHeaders(config),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Notion API Error (${response.status}): ${error}`);
    }
    return response.json();
  },

  // 4. Fetch Block Children / Get Page Content (Existing)
  async getPageContent(blockId: string, config: NotionConfig): Promise<any> {
      const response = await fetch(getUrl(`/blocks/${blockId}/children`, config), {
          method: 'GET',
          headers: getHeaders(config),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Notion API Error (${response.status}): ${error}`);
      }
  
      return response.json();
  },

  // 5. Create Page (Existing)
  async createPage(parentPageId: string, title: string, content: string, config: NotionConfig): Promise<any> {
    const children = [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: content } }],
          },
        },
      ];

    // Strategy 1: Page Parent
    const bodyPage = {
      parent: { page_id: parentPageId }, 
      properties: { title: [{ text: { content: title } }] },
      children,
    };

    const response = await fetch(getUrl('/pages', config), {
      method: 'POST',
      headers: getHeaders(config),
      body: JSON.stringify(bodyPage),
    });

    if (response.ok) return response.json();

    // Strategy 2: Database Parent
    const errorText = await response.text();
    const bodyDb = {
        parent: { database_id: parentPageId },
        properties: { Name: { title: [{ text: { content: title } }] } },
        children
    };

    const responseDb = await fetch(getUrl('/pages', config), {
        method: 'POST',
        headers: getHeaders(config),
        body: JSON.stringify(bodyDb),
    });

    if (responseDb.ok) return responseDb.json();
    
    const errorTextDb = await responseDb.text();
    throw new Error(`Notion API Error: Failed to create page. \nPage Parent Attempt: ${errorText} \nDatabase Parent Attempt: ${errorTextDb}`);
  },

  // 6. Update Page Properties (New)
  async updatePageProperties(pageId: string, properties: any, config: NotionConfig): Promise<any> {
    const response = await fetch(getUrl(`/pages/${pageId}`, config), {
        method: 'PATCH',
        headers: getHeaders(config),
        body: JSON.stringify({ properties }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Notion API Error (${response.status}): ${error}`);
    }
    return response.json();
  },

  // 7. Append Block Children (Existing)
  async appendBlock(blockId: string, content: string, config: NotionConfig): Promise<any> {
    const response = await fetch(getUrl(`/blocks/${blockId}/children`, config), {
      method: 'PATCH',
      headers: getHeaders(config),
      body: JSON.stringify({
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ type: 'text', text: { content: content } }],
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Notion API Error (${response.status}): ${error}`);
    }

    return response.json();
  },

  // Extra: Get Database (To understand schema)
  async getDatabase(databaseId: string, config: NotionConfig): Promise<any> {
    const response = await fetch(getUrl(`/databases/${databaseId}`, config), {
        method: 'GET',
        headers: getHeaders(config),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Notion API Error (${response.status}): ${error}`);
    }
    return response.json();
  },

  // Extra: List Users
  async listUsers(config: NotionConfig): Promise<any> {
      const response = await fetch(getUrl(`/users`, config), {
          method: 'GET',
          headers: getHeaders(config),
      });
      
      if (!response.ok) {
          const error = await response.text();
          throw new Error(`Notion API Error (${response.status}): ${error}`);
      }
      return response.json();
  },

  // Extra: Create Comment
  async createComment(pageId: string, content: string, config: NotionConfig): Promise<any> {
      const response = await fetch(getUrl(`/comments`, config), {
          method: 'POST',
          headers: getHeaders(config),
          body: JSON.stringify({
              parent: { page_id: pageId },
              rich_text: [{ text: { content: content } }]
          })
      });

      if (!response.ok) {
          const error = await response.text();
          throw new Error(`Notion API Error (${response.status}): ${error}`);
      }
      return response.json();
  },

  // Extra: Get Me (Bot Info)
  async getMe(config: NotionConfig): Promise<any> {
      const response = await fetch(getUrl(`/users/me`, config), {
          method: 'GET',
          headers: getHeaders(config),
      });

      if (!response.ok) {
          const error = await response.text();
          throw new Error(`Notion API Error (${response.status}): ${error}`);
      }
      return response.json();
  }
};