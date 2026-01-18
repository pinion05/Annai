// Fix for MaxListenersExceededWarning
// This file sets up the environment before the content script runs
// to prevent readline Interface memory leak warnings from WXT/Bun

export {};

// Increase the default max listeners for all EventEmitter instances
// This prevents from warning: "Possible EventEmitter memory leak detected"
if (typeof process !== 'undefined' && process.setMaxListeners) {
  const defaultMaxListeners = process.getMaxListeners?.() || 10;
  const newMaxListeners = 20; // Increase from 10 to 20
  
  if (defaultMaxListeners < newMaxListeners) {
    process.setMaxListeners(newMaxListeners);
    console.log(`[Setup] Increased process max listeners from ${defaultMaxListeners} to ${newMaxListeners}`);
  }
}
