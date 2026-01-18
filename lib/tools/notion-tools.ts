import { z } from 'zod';
import { NotionClient } from '../notion/client';

// 툴 콜텍스트 타입
export interface ToolContext {
  notion: {
    apiKey: string;
    databaseId: string;
  };
}

// 툴 팩토리 함수 - Notion API 키를 받아서 툴을 생성합니다
export function createNotionTools(context: ToolContext) {
  const client = new NotionClient(context.notion.apiKey);

  return {
    getPage: {
      description: 'Get a specific page by ID',
      parameters: z.object({
        pageId: z.string().describe('Page ID'),
      }),
      execute: async (input: { pageId: string }) => {
        const page = await client.getPage(input.pageId);
        return { page };
      },
    },

    createPage: {
      description: 'Create a new page in the database',
      parameters: z.object({
        parentId: z.string().describe('Parent page or database ID'),
        title: z.string().describe('Page title'),
        content: z.string().optional().describe('Page content'),
      }),
      execute: async (input: { parentId: string; title: string; content?: string }) => {
        const page = await client.createPage({
          parentId: input.parentId,
          title: input.title,
          content: input.content,
        });
        return { page };
      },
    },

    updatePage: {
      description: 'Update an existing page',
      parameters: z.object({
        pageId: z.string().describe('Page ID'),
        title: z.string().optional().describe('New page title'),
        archived: z.boolean().optional().describe('Archive the page'),
      }),
      execute: async (input: { pageId: string; title?: string; archived?: boolean }) => {
        const page = await client.updatePage(input.pageId, {
          title: input.title,
          archived: input.archived,
        });
        return { page };
      },
    },

    deletePage: {
      description: 'Delete a page (archive it)',
      parameters: z.object({
        pageId: z.string().describe('Page ID'),
      }),
      execute: async (input: { pageId: string }) => {
        await client.deletePage(input.pageId);
        return { success: true };
      },
    },

    appendBlock: {
      description: 'Append a block to a page',
      parameters: z.object({
        pageId: z.string().describe('Page ID'),
        blockType: z.enum(['paragraph', 'heading_1', 'heading_2', 'heading_3', 'bullet_list', 'numbered_list', 'to_do', 'code', 'quote']).describe('Block type'),
        content: z.string().describe('Block content'),
      }),
      execute: async (input: { pageId: string; blockType: string; content: string }) => {
        const block = await client.appendBlock(
          input.pageId,
          {
            type: input.blockType,
            content: input.content,
          },
        );
        return { block };
      },
    },
  };
}
