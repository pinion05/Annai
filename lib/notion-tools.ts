import { z } from 'zod';
import { browser } from 'wxt/browser';

const searchNotionSchema = z.object({
  query: z.string().describe('Search query for pages or databases'),
  pageSize: z.number().optional().default(10),
});

const queryDatabaseSchema = z.object({
  databaseId: z.string().describe('The database ID to query'),
  filter: z.record(z.string(), z.unknown()).optional(),
  sorts: z.array(z.record(z.string(), z.unknown())).optional(),
});

const retrievePageSchema = z.object({
  pageId: z.string().describe('The page ID to retrieve'),
});

const getPageContentSchema = z.object({
  pageId: z.string().describe('The page ID to read blocks from'),
});

const createPageSchema = z.object({
  parentId: z.string().optional().describe('Parent page or database ID'),
  title: z.string().describe('Page title'),
  content: z.string().optional().describe('Initial paragraph content'),
});

const updatePagePropertiesSchema = z.object({
  pageId: z.string().describe('The page ID to update'),
  properties: z.record(z.string(), z.unknown()).describe('Notion properties payload'),
});

const appendBlockSchema = z.object({
  blockId: z.string().describe('The block/page ID to append to'),
  content: z.string().describe('The text content to append'),
});

const getDatabaseSchema = z.object({
  databaseId: z.string().describe('The database ID to retrieve'),
});

const listUsersSchema = z.object({});

const createCommentSchema = z.object({
  pageId: z.string().describe('The page ID to comment on'),
  content: z.string().describe('The comment text'),
});

const getMeSchema = z.object({});

export const notionToolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'search_notion',
      description: 'Search for pages or databases in Notion to find IDs or content.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query text.' },
          pageSize: { type: 'integer', description: 'Number of results to return.' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_database',
      description: 'Query a Notion database with filters and sorts.',
      parameters: {
        type: 'object',
        properties: {
          databaseId: { type: 'string', description: 'The database ID.' },
          filter: { type: 'object', description: 'Notion filter payload.' },
          sorts: { type: 'array', items: { type: 'object' }, description: 'Notion sort payload.' },
        },
        required: ['databaseId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'retrieve_page',
      description: 'Retrieve a Notion page properties and metadata.',
      parameters: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'The page ID.' },
        },
        required: ['pageId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_page_content',
      description: 'Read block content from a Notion page.',
      parameters: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'The page ID to read.' },
        },
        required: ['pageId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_notion_page',
      description: 'Create a new Notion page under a parent page or database.',
      parameters: {
        type: 'object',
        properties: {
          parentId: { type: 'string', description: 'Parent page or database ID.' },
          title: { type: 'string', description: 'Title of the new page.' },
          content: { type: 'string', description: 'Initial paragraph content.' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_page_properties',
      description: 'Update the properties of a Notion page.',
      parameters: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'The page ID.' },
          properties: { type: 'object', description: 'Notion properties payload.' },
        },
        required: ['pageId', 'properties'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'append_block_to_page',
      description: 'Append a paragraph block to a page or block.',
      parameters: {
        type: 'object',
        properties: {
          blockId: { type: 'string', description: 'Target block or page ID.' },
          content: { type: 'string', description: 'Text content to append.' },
        },
        required: ['blockId', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_database',
      description: 'Retrieve Notion database schema and metadata.',
      parameters: {
        type: 'object',
        properties: {
          databaseId: { type: 'string', description: 'The database ID.' },
        },
        required: ['databaseId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_users',
      description: 'List all users in the Notion workspace.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_comment',
      description: 'Create a comment on a Notion page.',
      parameters: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'The page ID.' },
          content: { type: 'string', description: 'Comment content.' },
        },
        required: ['pageId', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_me',
      description: 'Get the current bot user info.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];

type NotionTool = {
  schema: z.ZodTypeAny;
  execute: (args: any) => Promise<unknown>;
};

export const notionTools: Record<string, NotionTool> = {
  search_notion: {
    schema: searchNotionSchema,
    execute: async (args: z.infer<typeof searchNotionSchema>) => {
      return browser.runtime.sendMessage({
        type: 'NOTION_SEARCH_PAGES',
        query: args.query,
        limit: args.pageSize,
      });
    },
  },
  query_database: {
    schema: queryDatabaseSchema,
    execute: async (args: z.infer<typeof queryDatabaseSchema>) => {
      return browser.runtime.sendMessage({
        type: 'NOTION_QUERY_DATABASE',
        databaseId: args.databaseId,
        filter: args.filter,
        sorts: args.sorts,
      });
    },
  },
  retrieve_page: {
    schema: retrievePageSchema,
    execute: async (args: z.infer<typeof retrievePageSchema>) => {
      return browser.runtime.sendMessage({
        type: 'NOTION_GET_PAGE',
        pageId: args.pageId,
      });
    },
  },
  get_page_content: {
    schema: getPageContentSchema,
    execute: async (args: z.infer<typeof getPageContentSchema>) => {
      return browser.runtime.sendMessage({
        type: 'NOTION_GET_PAGE_CONTENT',
        pageId: args.pageId,
      });
    },
  },
  create_notion_page: {
    schema: createPageSchema,
    execute: async (args: z.infer<typeof createPageSchema>) => {
      return browser.runtime.sendMessage({
        type: 'NOTION_CREATE_PAGE',
        parentId: args.parentId,
        title: args.title,
        content: args.content,
      });
    },
  },
  update_page_properties: {
    schema: updatePagePropertiesSchema,
    execute: async (args: z.infer<typeof updatePagePropertiesSchema>) => {
      return browser.runtime.sendMessage({
        type: 'NOTION_UPDATE_PAGE_PROPERTIES',
        pageId: args.pageId,
        properties: args.properties,
      });
    },
  },
  append_block_to_page: {
    schema: appendBlockSchema,
    execute: async (args: z.infer<typeof appendBlockSchema>) => {
      return browser.runtime.sendMessage({
        type: 'NOTION_APPEND_BLOCK',
        pageId: args.blockId,
        content: args.content,
      });
    },
  },
  get_database: {
    schema: getDatabaseSchema,
    execute: async (args: z.infer<typeof getDatabaseSchema>) => {
      return browser.runtime.sendMessage({
        type: 'NOTION_GET_DATABASE',
        databaseId: args.databaseId,
      });
    },
  },
  list_users: {
    schema: listUsersSchema,
    execute: async () => {
      return browser.runtime.sendMessage({
        type: 'NOTION_LIST_USERS',
      });
    },
  },
  create_comment: {
    schema: createCommentSchema,
    execute: async (args: z.infer<typeof createCommentSchema>) => {
      return browser.runtime.sendMessage({
        type: 'NOTION_CREATE_COMMENT',
        pageId: args.pageId,
        content: args.content,
      });
    },
  },
  get_me: {
    schema: getMeSchema,
    execute: async () => {
      return browser.runtime.sendMessage({
        type: 'NOTION_GET_ME',
      });
    },
  },
};

export type NotionToolName = keyof typeof notionTools;
