import { Client } from '@notionhq/client';

export class NotionClient {
  private client: Client;

  constructor(apiKey: string) {
    this.client = new Client({
      auth: apiKey,
    });
  }

  // 페이지 생성
  async createPage(params: {
    parentId: string;
    title: string;
    content?: string;
  }) {
    const pageData: any = {
      parent: { page_id: params.parentId },
      properties: {
        title: {
          title: [
            {
              text: {
                content: params.title,
              },
            },
          ],
        },
      },
    };

    if (params.content) {
      pageData.children = [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: params.content,
                },
              },
            ],
          },
        },
      ];
    }

    const result = await this.client.pages.create(pageData);
    return {
      id: result.id,
    };
  }

  // 페이지 읽기
  async getPage(pageId: string) {
    const result = await this.client.pages.retrieve({ page_id: pageId });
    return result;
  }

  // 페이지 수정
  async updatePage(pageId: string, params: {
    title?: string;
    archived?: boolean;
  }) {
    const updateData: any = {};

    if (params.title) {
      updateData.properties = {
        title: {
          title: [
            {
              text: {
                content: params.title,
              },
            },
          ],
        },
      };
    }

    if (params.archived !== undefined) {
      updateData.archived = params.archived;
    }

    const result = await this.client.pages.update({
      page_id: pageId,
      ...updateData,
    });
    return result;
  }

  // 페이지 삭제 (아카이브)
  async deletePage(pageId: string) {
    return this.updatePage(pageId, { archived: true });
  }

  // 블록 추가
  async appendBlock(pageId: string, block: {
    type: string;
    content: string;
  }) {
    const blockData = this.createBlockData(block.type, block.content);
    const result = await this.client.blocks.children.append({
      block_id: pageId,
      children: [blockData],
    });
    return {
      id: result.results[0].id,
    };
  }

  // 블록 수정
  async updateBlock(blockId: string, block: {
    type: string;
    content: string;
  }) {
    const blockData = this.createBlockData(block.type, block.content);
    const result = await this.client.blocks.update({
      block_id: blockId,
      ...blockData,
    });
    return result;
  }

  // 블록 삭제
  async deleteBlock(blockId: string) {
    return this.client.blocks.delete({ block_id: blockId });
  }

  // 블록 데이터 생성
  private createBlockData(type: string, content: string): any {
    const baseBlock = {
      object: 'block',
    };

    switch (type) {
      case 'paragraph':
        return {
          ...baseBlock,
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: { content },
              },
            ],
          },
        };
      case 'heading_1':
        return {
          ...baseBlock,
          type: 'heading_1',
          heading_1: {
            rich_text: [
              {
                type: 'text',
                text: { content },
              },
            ],
          },
        };
      case 'heading_2':
        return {
          ...baseBlock,
          type: 'heading_2',
          heading_2: {
            rich_text: [
              {
                type: 'text',
                text: { content },
              },
            ],
          },
        };
      case 'heading_3':
        return {
          ...baseBlock,
          type: 'heading_3',
          heading_3: {
            rich_text: [
              {
                type: 'text',
                text: { content },
              },
            ],
          },
        };
      case 'bullet_list':
        return {
          ...baseBlock,
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                type: 'text',
                text: { content },
              },
            ],
          },
        };
      case 'numbered_list':
        return {
          ...baseBlock,
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: [
              {
                type: 'text',
                text: { content },
              },
            ],
          },
        };
      case 'to_do':
        return {
          ...baseBlock,
          type: 'to_do',
          to_do: {
            rich_text: [
              {
                type: 'text',
                text: { content },
              },
            ],
          },
        };
      case 'code':
        return {
          ...baseBlock,
          type: 'code',
          code: {
            rich_text: [
              {
                type: 'text',
                text: { content },
              },
            ],
            language: 'plain_text',
          },
        };
      case 'quote':
        return {
          ...baseBlock,
          type: 'quote',
          quote: {
            rich_text: [
              {
                type: 'text',
                text: { content },
              },
            ],
          },
        };
      default:
        return this.createBlockData('paragraph', content);
    }
  }
}

// 싱글톤 인스턴스
let notionClientInstance: NotionClient | null = null;

export function getNotionClient(apiKey: string): NotionClient {
  if (!notionClientInstance) {
    notionClientInstance = new NotionClient(apiKey);
  }
  return notionClientInstance;
}
