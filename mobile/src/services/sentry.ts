function initSentry() {
  // Disabled in Expo Go to avoid Metro bundling failure from Sentry's promise polyfill import.
  if (__DEV__) return;
}

export default initSentry;
