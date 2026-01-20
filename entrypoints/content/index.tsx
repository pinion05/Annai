import '../../lib/content-setup';
import './style.css';
import { createRoot } from 'react-dom/client';
import FloatingWidget from '@/components/FloatingWidget';

const WIDGET_CONTAINER_ID = 'annai-widget-container';

export default defineContentScript({
  matches: ['*://*.notion.so/*', '*://notion.so/*'],

  main() {
    console.log('[DEBUG] Annai content script executing...');
    console.log('[DEBUG] Current URL:', window.location.href);
    console.log('[DEBUG] document.body exists:', !!document.body);

    // Prevent duplicate initialization
    if (document.getElementById(WIDGET_CONTAINER_ID)) {
      console.log('[DEBUG] Annai widget already initialized, skipping...');
      return;
    }

    console.log('[DEBUG] Annai floating widget initializing...');

    // Create container for the widget
    const container = document.createElement('div');
    container.id = WIDGET_CONTAINER_ID;
    console.log('[DEBUG] Container created:', container);
    document.body.appendChild(container);
    console.log('[DEBUG] Container appended to body');

    // Initialize React root
    try {
      const root = createRoot(container);
      console.log('[DEBUG] React root created:', root);
      root.render(<FloatingWidget position="bottom-right" initialState="collapsed" />);
      console.log('[DEBUG] FloatingWidget rendered');

      // Check if widget is in DOM after a short delay
      setTimeout(() => {
        const widget = document.getElementById(WIDGET_CONTAINER_ID);
        console.log('[DEBUG] Widget in DOM:', widget);
        console.log('[DEBUG] Widget HTML:', widget?.innerHTML?.slice(0, 200));
        console.log('[DEBUG] Widget computed styles:', widget ? {
          display: getComputedStyle(widget).display,
          visibility: getComputedStyle(widget).visibility,
          opacity: getComputedStyle(widget).opacity,
          zIndex: getComputedStyle(widget).zIndex,
        } : 'not found');
      }, 1000);

      console.log('Annai floating widget mounted!');
    } catch (error) {
      console.error('[DEBUG] Error mounting widget:', error);
    }
  },
});
