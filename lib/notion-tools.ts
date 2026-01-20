import { z } from 'zod';

// Notion tool schemas
export const searchPagesSchema = z.object({
  query: z.string().describe('Search query for pages'),
  limit: z.number().optional().default(10),
});

export const getPageSchema = z.object({
  pageId: z.string().describe('The page ID to retrieve'),
});

export const createPageSchema = z.object({
  parentId: z.string().optional().describe('Parent page ID'),
  title: z.string().describe('Page title'),
  content: z.string().optional().describe('Initial content'),
});

export const appendBlockSchema = z.object({
  pageId: z.string().describe('Page ID to append to'),
  content: z.string().describe('Content to add'),
});

// Tool definitions for LLM - using ai SDK's tool function
export const notionTools = {
  searchPages: {
    parameters: searchPagesSchema,
    execute: async (args: z.infer<typeof searchPagesSchema>) => {
      const response = await browser.runtime.sendMessage({
        type: 'NOTION_SEARCH_PAGES',
        query: args.query,
        limit: args.limit,
      });
      return response;
    },
  },

  getPage: {
    parameters: getPageSchema,
    execute: async (args: z.infer<typeof getPageSchema>) => {
      const response = await browser.runtime.sendMessage({
        type: 'NOTION_GET_PAGE',
        pageId: args.pageId,
      });
      return response;
    },
  },

  createPage: {
    parameters: createPageSchema,
    execute: async (args: z.infer<typeof createPageSchema>) => {
      const response = await browser.runtime.sendMessage({
        type: 'NOTION_CREATE_PAGE',
        parentId: args.parentId,
        title: args.title,
        content: args.content,
      });
      return response;
    },
  },

  appendBlock: {
    parameters: appendBlockSchema,
    execute: async (args: z.infer<typeof appendBlockSchema>) => {
      const response = await browser.runtime.sendMessage({
        type: 'NOTION_APPEND_BLOCK',
        pageId: args.pageId,
        content: args.content,
      });
      return response;
    },
  },
};

export type NotionTools = typeof notionTools;
