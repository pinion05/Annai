# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


<!-- MANUAL: Project-specific configuration below -->

# Annai Browser Extension

**Annai** is a WXT-based Chrome extension that provides AI assistance within Notion pages via a floating chat widget.

## Development Commands

```bash
# Development server (Chrome)
bun run dev

# Development server (Firefox)
bun run dev:firefox

# Production build (Chrome)
bun run build

# Production build (Firefox)
bun run build:firefox

# ZIP packaging for webstore upload
bun run zip
bun run zip:firefox

# TypeScript type checking
bun run compile

# Install dependencies (runs wxt prepare automatically)
bun install
```

## Project Structure

```
Annai/
├── entrypoints/           # WXT entrypoints (extension entry points)
│   ├── popup/            # Extension popup UI (React)
│   │   ├── App.tsx       # Main popup component
│   │   └── main.tsx      # React rendering entry
│   ├── content/          # Content script injected into pages
│   │   └── index.tsx     # Mounts FloatingWidget on Notion pages
│   └── background.ts     # Background service worker (Notion API proxy)
├── components/           # React UI components
│   ├── ui/              # Base UI components (button, input)
│   ├── chat/            # Chat system (useChat, types)
│   └── FloatingWidget.tsx # Floating chat widget for Notion pages
├── lib/                  # Utilities and configurations
│   ├── utils.ts         # cn() helper (clsx + tailwind-merge)
│   ├── notion-tools.ts  # Notion API tool definitions for LLM
│   └── content-setup.ts # Content script setup
├── public/              # Static assets (icons)
├── wxt.config.ts        # WXT configuration with React module
└── tailwind.config.cjs  # Tailwind with shadcn/ui design system
```

## Key Architecture

### WXT Entrypoints System

1. **Popup** (`entrypoints/popup/`): Extension icon click popup
2. **Content Script** (`entrypoints/content/`): Injects FloatingWidget into Notion pages
3. **Background** (`entrypoints/background.ts`): Service worker handling Notion API proxy

### Notion API Integration

The background script acts as a secure proxy for Notion API:
- Stores API key in `browser.storage.local`
- Handles API calls: search pages, get page, create page, append block
- Content script communicates via `browser.runtime.sendMessage`

**Message types handled:**
- `NOTION_SEARCH_PAGES` - Search Notion pages
- `NOTION_GET_PAGE` - Retrieve a page
- `NOTION_CREATE_PAGE` - Create a new page
- `NOTION_APPEND_BLOCK` - Add content to a page

### LLM Chat System

- **useChat hook** (`components/chat/useChat.ts`): Handles streaming LLM responses
- **Message interface**: Supports user, assistant, system, and tool roles
- **Tool calling**: Notion tools defined in `lib/notion-tools.ts` for LLM integration
- **Streaming**: Uses fetch with ReadableStream for real-time responses

### UI Components

- **FloatingWidget**: Draggable, collapsible chat widget injected into Notion
- **Custom UI**: Button, Input components with Tailwind styling
- **Icons**: lucide-react for UI icons
- **Styling**: Tailwind CSS + tailwindcss-animate with shadcn/ui design tokens

### Content Script Matching

Matches: `*://*.notion.so/*`, `*://notion.so/*`

## Dependencies

| Category | Libraries |
|----------|-----------|
| Framework | React 19, WXT with @wxt-dev/module-react |
| UI | @radix-ui/react-slot |
| Styling | Tailwind CSS, tailwindcss-animate, clsx, tailwind-merge |
| AI/Chat | zod for validation |
| Utilities | class-variance-authority (cva) |
