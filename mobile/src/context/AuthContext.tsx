import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import authService, { RegisterPayload } from '../services/auth.service';
import { User } from '../types';
import { syncPushSubscription, removePushSubscription } from '../services/push.service';
import { supabase } from '../services/supabase';
import chatService from '../services/chat.service';
import notificationService from '../services/notification.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (credential: string, role?: 'buyer' | 'seller') => Promise<{ isNewUser?: boolean; needsProfileCompletion?: boolean }>;
  register: (data: Omit<RegisterPayload, 'supabaseAccessToken'> & { password: string; email: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  viewMode: 'buyer' | 'seller';
  setViewMode: (mode: 'buyer' | 'seller') => void;
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
  refreshUnreadCounts: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, _setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewModeState] = useState<'buyer' | 'seller'>('buyer');

  const setViewMode = async (mode: 'buyer' | 'seller') => {
    setViewModeState(mode);
    await SecureStore.setItemAsync('viewMode', mode);
    // Sync with server so viewMode persists across sessions
    try {
      const response = await authService.switchRole(mode);
      const { user: updatedUser, token: newToken } = response.data;
      await SecureStore.setItemAsync('token', newToken);
      await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
      setToken(newToken);
      setUser(updatedUser);
    } catch {
      // Server sync failed silently — local state is already updated
    }
  };

  const normalizeUser = (u: any): User | null => {
    if (!u) return null;
    const role = u.role || (u.roles?.includes('admin') ? 'admin' : (u.roles?.includes('seller') ? 'seller' : 'buyer'));
    return { ...u, role };
  };

  const setUser = (u: any) => {
    _setUser(normalizeUser(u));
  };

  const isAuthenticated = !!user && !!token;

  // Load stored auth on mount
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('token');
        const storedViewMode = await SecureStore.getItemAsync('viewMode');
        if (storedToken) {
          setToken(storedToken);
          const response = await authService.getMe();
          const newUser = response.data.user;
          const normalized = normalizeUser(newUser);
          setUser(newUser);
          if (storedViewMode === 'buyer' || storedViewMode === 'seller') {
            setViewModeState(storedViewMode);
          } else if (normalized) {
            const defaultMode = normalized.role === 'seller' || normalized.role === 'admin' ? 'seller' : 'buyer';
            await setViewMode(defaultMode);
          }
        }
      } catch {
        // Do not clear viewMode preference on transient backend/fetch errors
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
      } finally {
        setIsLoading(false);
      }
    };
    loadAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (error || !data.session?.access_token) {
      throw new Error(error?.message || 'Invalid email or password.');
    }

    const response = await authService.login({ supabaseAccessToken: data.session.access_token });
    const { user: newUser, token: newToken } = response.data;
    const normalized = normalizeUser(newUser);
    await SecureStore.setItemAsync('token', newToken);
    await SecureStore.setItemAsync('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    
    const storedViewMode = await SecureStore.getItemAsync('viewMode');
    if (storedViewMode === 'buyer' || storedViewMode === 'seller') {
      setViewModeState(storedViewMode);
    } else if (normalized) {
      const defaultMode = normalized.role === 'seller' || normalized.role === 'admin' ? 'seller' : 'buyer';
      await setViewMode(defaultMode);
    }
    await syncPushSubscription();
  }, []);

  const googleLogin = useCallback(async (credential: string, role?: 'buyer' | 'seller') => {
    const response = await authService.googleLogin(credential, role);
    const { user: newUser, token: newToken } = response.data;
    const normalized = normalizeUser(newUser);
    await SecureStore.setItemAsync('token', newToken);
    await SecureStore.setItemAsync('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    
    const storedViewMode = await SecureStore.getItemAsync('viewMode');
    if (storedViewMode === 'buyer' || storedViewMode === 'seller') {
      setViewModeState(storedViewMode);
    } else if (normalized) {
      const defaultMode = normalized.role === 'seller' || normalized.role === 'admin' ? 'seller' : 'buyer';
      await setViewMode(defaultMode);
    }
    await syncPushSubscription();
    return {
      isNewUser: !!response.data?.isNewUser,
      needsProfileCompletion: !!response.data?.needsProfileCompletion,
    };
  }, []);

  const register = useCallback(async (data: Omit<RegisterPayload, 'supabaseAccessToken'> & { password: string; email: string }) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email.toLowerCase(),
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: data.role,
        },
      },
    });

    if (error || !authData.session?.access_token) {
      throw new Error(error?.message || 'Registration failed at authentication provider.');
    }

    const response = await authService.register({
      supabaseAccessToken: authData.session.access_token,
      name: data.name,
      phone: data.phone,
      role: data.role,
      studentId: data.studentId,
      location: data.location,
    });
    const { user: newUser, token: newToken } = response.data;
    const normalized = normalizeUser(newUser);
    await SecureStore.setItemAsync('token', newToken);
    await SecureStore.setItemAsync('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    
    const storedViewMode = await SecureStore.getItemAsync('viewMode');
    if (storedViewMode === 'buyer' || storedViewMode === 'seller') {
      setViewModeState(storedViewMode);
    } else if (normalized) {
      const defaultMode = normalized.role === 'seller' || normalized.role === 'admin' ? 'seller' : 'buyer';
      await setViewMode(defaultMode);
    }
    await syncPushSubscription();
  }, []);

  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const refreshUnreadCounts = useCallback(async () => {
    try {
      const [chatRes, notifRes] = await Promise.all([
        chatService.getUnreadCount(),
        notificationService.getUnreadCount(),
      ]);
      if (chatRes.data) setUnreadMessagesCount(chatRes.data.unreadCount || 0);
      if (notifRes.data) setUnreadNotificationsCount(notifRes.data.unreadCount || 0);
    } catch {}
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshUnreadCounts();
      const interval = setInterval(refreshUnreadCounts, 20000);
      return () => clearInterval(interval);
    } else {
      setUnreadMessagesCount(0);
      setUnreadNotificationsCount(0);
    }
  }, [isAuthenticated, refreshUnreadCounts]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {}
    try {
      await supabase.auth.signOut();
    } catch {}
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    await SecureStore.deleteItemAsync('viewMode');
    await removePushSubscription();
    setToken(null);
    _setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getMe();
      setUser(response.data.user);
    } catch {}
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    syncPushSubscription();
  }, [isAuthenticated, user?._id]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        googleLogin,
        register,
        logout,
        refreshUser,
        viewMode,
        setViewMode,
        unreadMessagesCount,
        unreadNotificationsCount,
        refreshUnreadCounts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
