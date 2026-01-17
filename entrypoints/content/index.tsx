import { render } from 'solid-js/web';
import FloatingWidget from '@/components/FloatingWidget';

export default defineContentScript({
  matches: ['*://*.notion.so/*', '*://notion.so/*'],

  main() {
    console.log('Annai floating widget initializing...');

    // Create container for the widget
    const container = document.createElement('div');
    container.id = 'annai-widget-container';
    document.body.appendChild(container);

    // Inject all required styles
    const style = document.createElement('style');
    style.textContent = `
      #annai-widget-container {
        position: fixed !important;
        z-index: 2147483647 !important;
        pointer-events: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      #annai-widget-container > * {
        pointer-events: auto !important;
      }
      #annai-widget-container [class*="fixed"] {
        z-index: 2147483647 !important;
      }

      /* Tailwind classes - mapped directly */
      .fixed { position: fixed !important; }
      .z-\\\\[9999\\\\] { z-index: 9999 !important; }
      .shadow-2xl { box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25) !important; }
      .w-96 { width: 24rem !important; }
      .h-\\\\[600px\\\\] { height: 600px !important; }
      .w-14 { width: 3.5rem !important; }
      .h-14 { height: 3.5rem !important; }
      .rounded-full { border-radius: 9999px !important; }
      .rounded-2xl { border-radius: 1rem !important; }
      .rounded-xl { border-radius: 0.75rem !important; }
      .rounded-lg { border-radius: 0.5rem !important; }
      .bg-gradient-to-br { background: linear-gradient(to bottom right, var(--tw-gradient-stops)) !important; }
      .from-violet-500, .from-violet-600, .to-purple-600, .to-purple-700 { --tw-gradient-stops: var(--tw-gradient-to); }
      .from-violet-500 { --tw-gradient-from: #8b5cf6; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgb(139 92 246 / 0)); }
      .to-purple-600 { --tw-gradient-to: #9333ea; }
      .from-violet-600 { --tw-gradient-from: #7c3aed; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgb(124 58 237 / 0)); }
      .to-purple-700 { --tw-gradient-to: #6b21a8; }
      .hover\\\\:from-violet-600:hover { --tw-gradient-from: #7c3aed; }
      .hover\\\\:to-purple-700:hover { --tw-gradient-to: #6b21a8; }
      .hover\\\\:scale-110:hover { transform: scale(1.1); }
      .active\\\\:scale-95:active { transform: scale(0.95); }
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
      .py-2\\\\.5 { padding-top: 0.625rem !important; padding-bottom: 0.625rem !important; }
      .px-4\\\\.py-2\\\\.5 { padding: 0.625rem 1rem !important; }
      .p-2\\\\.5 { padding: 0.625rem !important; }
      .p-1\\\\.5 { padding: 0.375rem !important; }
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
      .max-w-\\\\[75\\\\%\\\\] { max-width: 75% !important; }
      .bg-white { background-color: white !important; }
      .bg-gray-50 { background-color: #f9fafb !important; }
      .bg-gray-100 { background-color: #f3f4f6 !important; }
      .bg-gray-300 { background-color: #d1d5db !important; }
      .bg-gray-600 { background-color: #4b5563 !important; }
      .bg-gray-700 { background-color: #374151 !important; }
      .bg-gray-800 { background-color: #1f2937 !important; }
      .bg-gray-900 { background-color: #111827 !important; }
      .text-gray-400 { color: #9ca3af !important; }
      .text-gray-900 { color: #111827 !important; }
      .text-gray-100 { color: #f3f4f6 !important; }
      .text-sm { font-size: 0.875rem !important; }
      .font-semibold { font-weight: 600 !important; }
      .font-medium { font-weight: 500 !important; }
      .whitespace-pre-wrap { white-space: pre-wrap !important; }
      .break-words { overflow-wrap: break-word !important; }
      .disabled\\\\:opacity-50:disabled { opacity: 0.5 !important; }
      .disabled\\\\:cursor-not-allowed:disabled { cursor: not-allowed !important; }
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
      .bg-white\\\\/20 { background-color: rgba(255, 255, 255, 0.2) !important; }
      .bg-white\\\\/10 { background-color: rgba(255, 255, 255, 0.1) !important; }
      .hover\\\\:bg-white\\\\/10:hover { background-color: rgba(255, 255, 255, 0.1) !important; }
      .focus\\\\:ring-2:focus { box-shadow: 0 0 0 2px #8b5cf6 !important; }
      .placeholder-gray-400::placeholder { color: #9ca3af !important; }
      .placeholder-gray-500::placeholder { color: #6b7280 !important; }
      button { border: none; background: none; padding: 0; }
      input { border: none; outline: none; background: none; }
      .justify-end { justify-content: flex-end !important; }
      .bottom-4 { bottom: 1rem !important; }
      .right-4 { right: 1rem !important; }
    `;
    document.head.appendChild(style);

    // Wait for DOM to be ready
    const initWidget = () => {
      if (document.body) {
        render(() => <FloatingWidget position="bottom-right" />, container);
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
