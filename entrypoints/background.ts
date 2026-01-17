// Import setup to fix MaxListenersExceededWarning
import '../lib/background-setup';

export default defineBackground(() => {
  console.log('[DEBUG] Hello background!', { id: browser.runtime.id });
  
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
