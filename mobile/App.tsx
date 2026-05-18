import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initPushRuntime } from './src/services/push.service';
import { handleInitialNotificationOpen } from './src/services/notificationNavigation.service';
import initSentry from './src/services/sentry';

initSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const colorScheme = useColorScheme(); // Listens to system light/dark scheme switches dynamically

  useEffect(() => {
    const cleanup = initPushRuntime();
    handleInitialNotificationOpen();
    return cleanup;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}
