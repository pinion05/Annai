// Import setup to fix MaxListenersExceededWarning
import '../lib/background-setup';

export default defineBackground(() => {
  console.log('[DEBUG] Annai background script initialized', { id: browser.runtime.id });

  // Handle extension installation
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      console.log('[Annai] Extension installed');
      // Open welcome page or show notification
    } else if (details.reason === 'update') {
      console.log('[Annai] Extension updated');
    }
  });

  // Handle messages from content scripts and popup
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Annai] Received message:', message);

    // Handle different message types
    switch (message.type) {
      case 'GET_SETTINGS':
        // Settings are stored in localStorage by the content script
        // This is a placeholder for future storage migration
        sendResponse({ success: true, data: null });
        break;

      case 'SAVE_SETTINGS':
        // Settings are saved to localStorage by the content script
        // This is a placeholder for future storage migration
        sendResponse({ success: true });
        break;

      default:
        console.warn('[Annai] Unknown message type:', message.type);
        sendResponse({ success: false, error: 'Unknown message type' });
    }

    // Return true to indicate async response
    return true;
  });

  // Handle storage changes
  browser.storage.onChanged.addListener((changes, areaName) => {
    console.log('[Annai] Storage changed:', changes, 'in', areaName);
    // Notify content scripts of storage changes if needed
  });

  // Debug: Check for any readline interfaces in background
  if (typeof process !== 'undefined') {
    console.log('[DEBUG] Background process check:', {
      hasStdin: !!process.stdin,
      hasStdout: !!process.stdout,
      hasStderr: !!process.stderr,
      maxListeners: process.getMaxListeners?.() || 'N/A',
    });
  }
});
