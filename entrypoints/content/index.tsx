// Import setup to fix MaxListenersExceededWarning
import '../../lib/content-setup';
import { render } from 'solid-js/web';
import FloatingWidget from '@/components/FloatingWidget';

const WIDGET_CONTAINER_ID = 'annai-widget-container';
const WIDGET_STYLE_ID = 'annai-widget-style';

export default defineContentScript({
  matches: ['*://*.notion.so/*', '*://notion.so/*'],

  main() {
    // Prevent duplicate initialization
    if (document.getElementById(WIDGET_CONTAINER_ID)) {
      console.log('[DEBUG] Annai widget already initialized, skipping...');
      return;
    }

    console.log('[DEBUG] Annai floating widget initializing...');
    console.log('[DEBUG] Checking for readline Interface listeners...');
    
    // Debug: Check if there are any readline interfaces
    if (typeof process !== 'undefined' && process.stdin) {
      console.log('[DEBUG] process.stdin exists:', !!process.stdin);
      console.log('[DEBUG] process.stdin.listenerCount("line"):', process.stdin.listenerCount?.('line') || 'N/A');
    }

    // Create container for the widget
    const container = document.createElement('div');
    container.id = WIDGET_CONTAINER_ID;
    document.body.appendChild(container);

    // Inject styles only once
    if (!document.getElementById(WIDGET_STYLE_ID)) {
      const style = document.createElement('style');
      style.id = WIDGET_STYLE_ID;
      style.textContent = `
        #${WIDGET_CONTAINER_ID} {
          position: fixed !important;
          z-index: 2147483647 !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        #${WIDGET_CONTAINER_ID} > * {
          pointer-events: auto !important;
        }
        #${WIDGET_CONTAINER_ID} [class*="fixed"] {
          z-index: 2147483647 !important;
        }

        /* Tailwind classes */
        .fixed { position: fixed !important; }
        .z-\\[9999\\] { z-index: 9999 !important; }
        .shadow-2xl { box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25) !important; }
        .w-96 { width: 24rem !important; }
        .h-\\[600px\\] { height: 600px !important; }
        .w-14 { width: 3.5rem !important; }
        .h-14 { height: 3.5rem !important; }
        .rounded-full { border-radius: 9999px !important; }
        .rounded-2xl { border-radius: 1rem !important; }
        .rounded-xl { border-radius: 0.75rem !important; }
        .rounded-lg { border-radius: 0.5rem !important; }
        .hover\\:scale-110:hover { transform: scale(1.1); }
        .active\\:scale-95:active { transform: scale(0.95); }
        .text-white { color: white !important; }
        .flex { display: flex !important; }
        .flex-col { flex-direction: column !important; }
        .items-center { align-items: center !important; }
        .justify-center { justify-content: center !important; }
        .justify-between { justify-content: space-between !important; }
        .gap-2 { gap: 0.5rem !important; }
        .gap-3 { gap: 0.75rem !important; }
        .p-4 { padding: 1rem !important; }
        .px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
        .py-3 { padding-top: 0.75rem !important; padding-bottom: 0.75rem !important; }
        .py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
        .py-2\\.5 { padding-top: 0.625rem !important; padding-bottom: 0.625rem !important; }
        .px-4\\.py-2\\.5 { padding: 0.625rem 1rem !important; }
        .p-2\\.5 { padding: 0.625rem !important; }
        .p-1\\.5 { padding: 0.375rem !important; }
        .border { border-width: 1px !important; border-style: solid !important; }
        .border-gray-200 { border-color: #e5e7eb !important; }
        .border-gray-700 { border-color: #374151 !important; }
        .overflow-hidden { overflow: hidden !important; }
        .overflow-y-auto { overflow-y: auto !important; }
        .space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem !important; }
        .transition-all { transition-property: all !important; transition-timing-function: cubic-bezier(0, 0, 0.2, 1) !important; }
        .duration-300 { transition-duration: 300ms !important; }
        .duration-200 { transition-duration: 200ms !important; }
        .ease-out { transition-timing-function: cubic-bezier(0, 0, 0.2, 1) !important; }
        .cursor-pointer { cursor: pointer !important; }
        .cursor-grab { cursor: grab !important; }
        .cursor-grabbing { cursor: grabbing !important; }
        .select-none { user-select: none !important; }
        .w-full { width: 100% !important; }
        .h-full { height: 100% !important; }
        .flex-1 { flex: 1 1 0% !important; }
        .max-w-\\[75\\%\\] { max-width: 75% !important; }
        .bg-white { background-color: #09090b !important; }
        .bg-gray-50 { background-color: rgba(17, 24, 39, 0.5) !important; }
        .bg-gray-100 { background-color: #1f2937 !important; }
        .bg-gray-300 { background-color: #374151 !important; }
        .bg-gray-600 { background-color: #374151 !important; }
        .bg-gray-700 { background-color: #1f2937 !important; }
        .bg-gray-800 { background-color: #1f2937 !important; }
        .bg-gray-900 { background-color: #09090b !important; }
        .bg-zinc-950 { background-color: #09090b !important; }
        .text-gray-400 { color: #6b7280 !important; }
        .text-gray-900 { color: #f3f4f6 !important; }
        .text-gray-100 { color: #f3f4f6 !important; }
        .text-sm { font-size: 0.875rem !important; }
        .font-semibold { font-weight: 600 !important; }
        .font-medium { font-weight: 500 !important; }
        .whitespace-pre-wrap { white-space: pre-wrap !important; }
        .break-words { overflow-wrap: break-word !important; }
        .disabled\\:opacity-50:disabled { opacity: 0.5 !important; }
        .disabled\\:cursor-not-allowed:disabled { cursor: not-allowed !important; }
        .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important; }
        .h-8 { height: 2rem !important; }
        .w-8 { width: 2rem !important; }
        .h-4 { height: 1rem !important; }
        .w-4 { width: 1rem !important; }
        .h-5 { height: 1.25rem !important; }
        .w-5 { width: 1.25rem !important; }
        .h-6 { height: 1.5rem !important; }
        .w-6 { width: 1.5rem !important; }
        .h-12 { height: 3rem !important; }
        .w-12 { width: 3rem !important; }
        .mb-2 { margin-bottom: 0.5rem !important; }
        .border-t { border-top-width: 1px !important; border-top-style: solid !important; }
        .opacity-50 { opacity: 0.5 !important; }
        .gap-1 { gap: 0.25rem !important; }
        .bg-white\\/20 { background-color: rgba(255, 255, 255, 0.2) !important; }
        .bg-white\\/10 { background-color: rgba(255, 255, 255, 0.1) !important; }
        .hover\\:bg-white\\/10:hover { background-color: rgba(255, 255, 255, 0.1) !important; }
        .focus\\:ring-2:focus { box-shadow: 0 0 0 2px #4b5563 !important; }
        .placeholder-gray-400::placeholder { color: #6b7280 !important; }
        .placeholder-gray-500::placeholder { color: #4b5563 !important; }
        .bg-yellow-500 { background-color: #eab308 !important; }
        .bg-red-500 { background-color: #ef4444 !important; }
        .shadow-md { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important; }
        .hover\\:shadow-lg:hover { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important; }
        .group:hover .group-hover\\:opacity-100 { opacity: 1 !important; }
        .opacity-0 { opacity: 0 !important; }
        .opacity-100 { opacity: 1 !important; }
        /* Only reset input, not button - let Tailwind button styles work */
        input { border: none; outline: none; background: none; }
        .justify-end { justify-content: flex-end !important; }
        .bottom-4 { bottom: 1rem !important; }
        .right-4 { right: 1rem !important; }

        /* macOS style spring animation - softer version */
        @keyframes macosSpringEnter {
          0% {
            opacity: 0;
            transform: scale(0.85) translateY(20px);
          }
          25% {
            opacity: 0.8;
            transform: scale(1.05) translateY(-5px);
          }
          40% {
            opacity: 1;
            transform: scale(1.01) translateY(-2px);
          }
          55% {
            transform: scale(0.99) translateY(1.5px);
          }
          70% {
            transform: scale(1.005) translateY(-1px);
          }
          82% {
            transform: scale(0.998) translateY(0.5px);
          }
          92% {
            transform: scale(1.002) translateY(-0.25px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* Smooth ease-out exit animation - calm and gentle */
        @keyframes macosSpringExit {
          0% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          20% {
            opacity: 0.8;
            transform: scale(0.98) translateY(5px);
          }
          40% {
            opacity: 0.6;
            transform: scale(0.96) translateY(10px);
          }
          60% {
            opacity: 0.4;
            transform: scale(0.94) translateY(15px);
          }
          80% {
            opacity: 0.2;
            transform: scale(0.92) translateY(18px);
          }
          100% {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Wait for DOM to be ready
    const initWidget = () => {
      if (document.body) {
        render(() => <FloatingWidget position="bottom-right" initialState="collapsed" />, container);
        console.log('Annai floating widget mounted!');
      } else {
        requestAnimationFrame(initWidget);
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initWidget);
    } else {
      initWidget();
    }
  },
});
