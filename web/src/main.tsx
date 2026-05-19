import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    if (import.meta.env.DEV) {
      const registrations = await navigator.serviceWorker.getRegistrations().catch(() => []);
      await Promise.all(registrations.map((r) => r.unregister())).catch(() => {});
      return;
    }

    // Main PWA service worker (caching)
    navigator.serviceWorker.register('/sw.js').catch(() => {});

    // Push notification service worker (separate scope for push events)
    navigator.serviceWorker.register('/push-sw.js', { scope: '/' }).catch(() => {});
  });

  // Handle navigation messages from push-sw.js when user clicks a notification
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'NOTIFICATION_CLICK') {
      const url = event.data.url;
      if (url && url !== window.location.pathname) {
        window.location.href = url;
      }
    }
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const AppRoot: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || '904520092449-gnrmhr6h0ltvf74uqdh0s3pcflalljji.apps.googleusercontent.com'}>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CartProvider>
              <SocketProvider>
                <App />
                <Toaster
                  position={isMobile ? 'bottom-center' : 'bottom-right'}
                  toastOptions={{
                    duration: 2500,
                    className: 'bulletin-toast',
                    style: {
                      borderRadius: '0px',
                      background: '#fffdf8',
                      color: '#000',
                      fontSize: '11px',
                      fontWeight: '900',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      border: '4px solid #000',
                      boxShadow: '8px 8px 0 0 rgba(0,0,0,1)',
                      padding: '16px 20px',
                      fontFamily: '"JetBrains Mono", monospace',
                      maxWidth: '400px',
                    },
                    success: {
                      style: {
                        background: '#fffacd', // Yellow notice
                      },
                      iconTheme: {
                        primary: '#000',
                        secondary: '#fffacd',
                      },
                    },
                    error: {
                      style: {
                        background: '#ff6b6b', // Red alert
                        color: '#fff',
                      },
                      iconTheme: {
                        primary: '#fff',
                        secondary: '#ff6b6b',
                      },
                    },
                  }}
                />
              </SocketProvider>
            </CartProvider>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>
);
