import { tool } from 'ai';
import { z } from 'zod';

export const notionTools = {
  searchPages: tool({
    parameters: z.object({
      query: z.string().describe('Search query for pages'),
      limit: z.number().optional().default(10),
    }),
    execute: async ({ query, limit }) => {
      const response = await browser.runtime.sendMessage({
        type: 'NOTION_SEARCH_PAGES',
        query,
        limit,
      });
      return response;
    },
  }),

  getPage: tool({
    parameters: z.object({
      pageId: z.string().describe('The page ID to retrieve'),
    }),
    execute: async ({ pageId }) => {
      const response = await browser.runtime.sendMessage({
        type: 'NOTION_GET_PAGE',
        pageId,
      });
      return response;
    },
  }),

  createPage: tool({
    parameters: z.object({
      parentId: z.string().optional().describe('Parent page ID'),
      title: z.string().describe('Page title'),
      content: z.string().optional().describe('Initial content'),
    }),
    execute: async ({ parentId, title, content }) => {
      const response = await browser.runtime.sendMessage({
        type: 'NOTION_CREATE_PAGE',
        parentId,
        title,
        content,
      });
      return response;
    },
  }),

  appendBlock: tool({
    parameters: z.object({
      pageId: z.string().describe('Page ID to append to'),
      content: z.string().describe('Content to add'),
    }),
    execute: async ({ pageId, content }) => {
      const response = await browser.runtime.sendMessage({
        type: 'NOTION_APPEND_BLOCK',
        pageId,
        content,
      });
      return response;
    },
  }),
};

export type NotionTools = typeof notionTools;
