import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const extras = (Constants.expoConfig?.extra || {}) as {
  apiUrl?: string;
};

const REMOTE_API_URL = 'https://api.quadsmarket.tech/api';

const normalizeApiUrl = (rawUrl?: string) => {
  if (!rawUrl) return '';
  const trimmedUrl = rawUrl.trim();
  if (!trimmedUrl) return '';

  try {
    const parsed = new URL(trimmedUrl);
    const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
    if (isLocalhost && Constants.appOwnership === 'expo') {
      return '';
    }
  } catch {
    // Keep non-standard URLs as-is after trimming.
  }

  return trimmedUrl.replace(/\/+$/, '');
};

const API_URL =
  normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL) ||
  normalizeApiUrl(extras.apiUrl) ||
  REMOTE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // SecureStore might not be available
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      error.userMessage =
        error.code === 'ECONNABORTED'
          ? 'Request timed out. Check your connection and try again.'
          : 'Cannot reach server. Check internet or API URL.';
    }

    if (error.response?.status === 401) {
      try {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
      } catch {
        // Ignore
      }
    }
    return Promise.reject(error);
  }
);

export default api;
