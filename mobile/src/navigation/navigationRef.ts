import { createNavigationContainerRef } from '@react-navigation/native';

/**
 * Navigation reference for deep-linking from external events (notifications, URLs).
 * Used when the navigator isn't immediately ready (e.g., on app launch).
 */
export const navigationRef = createNavigationContainerRef<any>();
