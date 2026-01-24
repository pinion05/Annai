import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { notionService } from "./notionService";
import { NotionConfig } from "../types";

// --- Tool Definitions ---

// 1. Search
const searchNotionTool: FunctionDeclaration = {
  name: "search_notion",
  description: "Search for pages or databases in Notion. Use this to find IDs or content.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "The search query text." },
      pageSize: { type: Type.INTEGER, description: "The number of results to return. Default is 10." },
    },
    required: ["query"],
  },
};

// 2. Query Database
const queryDatabaseTool: FunctionDeclaration = {
  name: "query_database",
  description: "Query a specific database to filter and sort pages. Returns page properties (not content). Use 'get_database' first to understand available properties if unsure.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      databaseId: { type: Type.STRING, description: "The UUID of the database to query." },
      filter: { 
          type: Type.OBJECT, 
          description: "Notion API filter object. Example: { \"property\": \"Status\", \"select\": { \"equals\": \"Done\" } }",
          nullable: true
      },
      sorts: { 
          type: Type.ARRAY, 
          items: { type: Type.OBJECT },
          description: "Notion API sort object array. Example: [{ \"property\": \"Name\", \"direction\": \"ascending\" }]",
          nullable: true
      },
    },
    required: ["databaseId"],
  },
};

// 3. Retrieve Page
const retrievePageTool: FunctionDeclaration = {
  name: "retrieve_page",
  description: "Retrieve a page object to see its properties (status, tags, dates, relations) and title. Does NOT return block content.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      pageId: { type: Type.STRING, description: "The UUID of the page." },
    },
    required: ["pageId"],
  },
};

// 4. Get Page Content
const getPageContentTool: FunctionDeclaration = {
  name: "get_page_content",
  description: "Read the actual block content (paragraphs, headings, lists) of a Notion page.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      pageId: { type: Type.STRING, description: "The UUID of the page to read." },
    },
    required: ["pageId"],
  },
};

// 5. Create Page
const createPageTool: FunctionDeclaration = {
  name: "create_notion_page",
  description: "Create a new page in Notion under a parent page.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      parentId: { type: Type.STRING, description: "The ID of the parent page or database." },
      title: { type: Type.STRING, description: "The title of the new page." },
      content: { type: Type.STRING, description: "Initial paragraph content for the page." },
    },
    required: ["parentId", "title", "content"],
  },
};

// 6. Update Page Properties
const updatePagePropertiesTool: FunctionDeclaration = {
  name: "update_page_properties",
  description: "Update the properties of a page (e.g., change Status, Date, or Title). Do not use this for body content.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      pageId: { type: Type.STRING, description: "The UUID of the page to update." },
      properties: { 
          type: Type.OBJECT, 
          description: "Notion properties object. Key is property name. Example: { \"Status\": { \"status\": { \"name\": \"Done\" } } }" 
      },
    },
    required: ["pageId", "properties"],
  },
};

// 7. Append Block Children
const appendBlockTool: FunctionDeclaration = {
  name: "append_block_to_page",
  description: "Append a paragraph block to an existing Notion page or block. Use this to add content to a page.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      blockId: { type: Type.STRING, description: "The ID of the block/page to append to." },
      content: { type: Type.STRING, description: "The text content to append." },
    },
    required: ["blockId", "content"],
  },
};

// Extra: Get Database
const getDatabaseTool: FunctionDeclaration = {
  name: "get_database",
  description: "Retrieve database metadata to understand its schema (property names and types). Useful before querying or updating.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      databaseId: { type: Type.STRING, description: "The UUID of the database." },
    },
    required: ["databaseId"],
  },
};

// Extra: List Users
const listUsersTool: FunctionDeclaration = {
  name: "list_users",
  description: "List all users in the workspace. Useful for finding user IDs for assignments or mentions.",
  parameters: {
    type: Type.OBJECT,
    properties: {}, // No params
  },
};

// Extra: Create Comment
const createCommentTool: FunctionDeclaration = {
    name: "create_comment",
    description: "Add a comment to a page.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            pageId: { type: Type.STRING, description: "The UUID of the page." },
            content: { type: Type.STRING, description: "The text content of the comment." },
        },
        required: ["pageId", "content"]
    }
}

// Extra: Get Me
const getMeTool: FunctionDeclaration = {
    name: "get_me",
    description: "Get information about the current bot user. Useful for verifying the connection or finding the bot's own user ID.",
    parameters: {
        type: Type.OBJECT,
        properties: {},
    }
}

const tools: Tool[] = [{
  functionDeclarations: [
      searchNotionTool, 
      queryDatabaseTool,
      retrievePageTool,
      getPageContentTool, 
      createPageTool, 
      updatePagePropertiesTool,
      appendBlockTool,
      getDatabaseTool,
      listUsersTool,
      createCommentTool,
      getMeTool
    ]
}];

export class GeminiAgent {
  private ai: GoogleGenAI;
  private notionConfig: NotionConfig;
  private history: any[] = [];

  constructor(notionConfig: NotionConfig) {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.notionConfig = notionConfig;
  }

  async sendMessage(
    message: string, 
    onToolCall?: (toolName: string, args: any) => void
  ): Promise<{ text: string, toolCalls: any[] }> {
    
    // Initialize chat with history
    const chat = this.ai.chats.create({
        model: "gemini-3-pro-preview",
        history: this.history,
        config: {
          systemInstruction: `You are an expert Notion Agent. You manage the user's workspace using the Notion API.
          
          CRITICAL INSTRUCTION:
          - Notion integrations need manual sharing. If a search fails, remind the user to share pages.
          
          CAPABILITIES & BEST PRACTICES:
          - **Search First**: If you don't know an ID, use 'search_notion'.
          - **Databases**: 
             - Use 'get_database' to see property schemas (e.g., is "Status" a select or status type?).
             - Use 'query_database' to find pages based on criteria (e.g., "Find all tasks where Status is Done").
          - **Pages**:
             - Use 'retrieve_page' to see metadata (properties).
             - Use 'get_page_content' to read the actual text/blocks.
             - Use 'update_page_properties' to change status, tags, etc.
          - **Multi-step Execution**: Chain tools. Search -> Get Database Schema -> Query -> Update.
          - **Reasoning**: Plan your Notion API calls carefully. If an update fails, check the property schema using 'get_database'.
          - **Verification**: Use 'get_me' if the user asks "Who are you?" or "Is the connection working?".
          `,
          tools: tools,
          thinkingConfig: {
            thinkingBudget: 32768, 
          }
        },
    });

    console.log("Sending to Gemini:", message);
    let response = await chat.sendMessage({ message });
    
    const executedToolCalls: any[] = [];
    let loopCount = 0;
    const MAX_LOOPS = 10; 

    while (response.functionCalls && response.functionCalls.length > 0) {
        if (loopCount >= MAX_LOOPS) {
            console.warn("Max tool chain limit reached. Breaking loop.");
            break;
        }
        loopCount++;

        const calls = response.functionCalls;
        const toolResponseParts: any[] = [];
        
        for (const call of calls) {
            console.log("Tool Call:", call.name, call.args);
            if (onToolCall) onToolCall(call.name, call.args);
            
            const args = call.args as any;
            let result = {};
            try {
                switch (call.name) {
                case "search_notion":
                    result = await notionService.search(args.query, this.notionConfig, args.pageSize);
                    break;
                case "query_database":
                    result = await notionService.queryDatabase(args.databaseId, args.filter, args.sorts, this.notionConfig);
                    break;
                case "retrieve_page":
                    result = await notionService.retrievePage(args.pageId, this.notionConfig);
                    break;
                case "get_page_content":
                    result = await notionService.getPageContent(args.pageId, this.notionConfig);
                    break;
                case "create_notion_page":
                    result = await notionService.createPage(args.parentId, args.title, args.content, this.notionConfig);
                    break;
                case "update_page_properties":
                    result = await notionService.updatePageProperties(args.pageId, args.properties, this.notionConfig);
                    break;
                case "append_block_to_page":
                    result = await notionService.appendBlock(args.blockId, args.content, this.notionConfig);
                    break;
                case "get_database":
                    result = await notionService.getDatabase(args.databaseId, this.notionConfig);
                    break;
                case "list_users":
                    result = await notionService.listUsers(this.notionConfig);
                    break;
                case "create_comment":
                    result = await notionService.createComment(args.pageId, args.content, this.notionConfig);
                    break;
                case "get_me":
                    result = await notionService.getMe(this.notionConfig);
                    break;
                default:
                    result = { error: "Unknown tool" };
                }
            } catch (e: any) {
                console.error("Tool Execution Error", e);
                result = { error: e.message };
            }
            
            executedToolCalls.push({ name: call.name, args: call.args, result });
            
            toolResponseParts.push({
                functionResponse: {
                    name: call.name,
                    response: { result },
                    id: call.id 
                }
            });
        }
        
        console.log("Sending tool responses:", toolResponseParts);
        response = await chat.sendMessage({ message: toolResponseParts });
    }

    this.history = await chat.getHistory();

    return { 
        text: response.text || "", 
        toolCalls: executedToolCalls 
    };
  }
}