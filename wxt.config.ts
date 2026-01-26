import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    version: '0.1.0',
    permissions: ['storage'],
    host_permissions: [
      '*://*.notion.so/*',
      '*://notion.so/*',
      '*://api.notion.com/*',
      'https://openrouter.ai/*',
    ],
    web_accessible_resources: [
      {
        resources: ['/icon/*'],
        matches: ['*://*.notion.so/*', '*://notion.so/*'],
      },
    ],
  },
});
