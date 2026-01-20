import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    host_permissions: ['*://*.notion.so/*', '*://notion.so/*', '*://api.notion.com/*'],
    web_accessible_resources: [
      {
        resources: ['/icon/*'],
        matches: ['*://*.notion.so/*', '*://notion.so/*'],
      },
    ],
  },
});
