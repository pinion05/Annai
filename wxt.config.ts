import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-solid'],
  manifest: {
    name: 'Annai - AI Assistant for Notion',
    version: '0.1.0',
    description: 'AI-powered assistant for Notion with tool calling capabilities',
    permissions: ['storage'],
    host_permissions: [
      // AI Provider APIs
      'https://api.openai.com/*',
      'https://api.anthropic.com/*',
      'https://api.together.xyz/*',
      'https://openrouter.ai/*',
      'https://generativelanguage.googleapis.com/*',
      // Notion API
      'https://api.notion.com/*',
    ],
    web_accessible_resources: [
      {
        resources: ['/icon/*'],
        matches: ['*://*.notion.so/*', '*://notion.so/*'],
      },
    ],
    action: {
      default_icon: {
        '16': '/icon/16.png',
        '32': '/icon/32.png',
        '48': '/icon/48.png',
        '96': '/icon/96.png',
        '128': '/icon/128.png',
      },
      default_popup: 'popup/index.html',
      default_title: 'Annai Settings',
    },
    icons: {
      '16': '/icon/16.png',
      '32': '/icon/32.png',
      '48': '/icon/48.png',
      '96': '/icon/96.png',
      '128': '/icon/128.png',
    },
  },
});
