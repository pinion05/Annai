import '../lib/content-setup';
import { createRoot } from 'react-dom/client';
import FloatingWidget from '@/components/FloatingWidget';

const WIDGET_CONTAINER_ID = 'annai-widget-container';

export default defineContentScript({
  matches: ['*://*.notion.so/*', '*://notion.so/*'],

  main() {
    // Prevent duplicate initialization
    if (document.getElementById(WIDGET_CONTAINER_ID)) {
      console.log('[DEBUG] Annai widget already initialized, skipping...');
      return;
    }

    console.log('[DEBUG] Annai floating widget initializing...');

    // Create container for the widget
    const container = document.createElement('div');
    container.id = WIDGET_CONTAINER_ID;
    document.body.appendChild(container);

    // Initialize React root
    const root = createRoot(container);
    root.render(<FloatingWidget position="bottom-right" initialState="collapsed" />);

    console.log('Annai floating widget mounted!');
  },
});
