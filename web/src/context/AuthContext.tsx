import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService, { RegisterData, UpdateProfileData, ChangePasswordData } from '../services/auth.service';
import { User } from '../types';
import toast from 'react-hot-toast';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import notificationService from '../services/notification.service';

// Subscribe to web push after login — silent, non-blocking
const trySubscribeWebPush = async () => {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (!import.meta.env.VITE_VAPID_PUBLIC_KEY) return;
    await notificationService.subscribeToPush();
  } catch {
    // Non-critical — don't block login if push subscription fails
  }
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // OTP registration flow
  sendRegistrationOtp: (email: string) => Promise<void>;
  verifyOtpAndRegister: (email: string, otp: string, profile: Omit<RegisterData, 'supabaseAccessToken'>) => Promise<void>;
  // OTP login flow
  sendLoginOtp: (email: string) => Promise<void>;
  verifyOtpAndLogin: (email: string, otp: string) => Promise<void>;
  // Password login (kept for admin/support)
  login: (data: { email: string; password: string }) => Promise<void>;
  googleLogin: (credential: string, role?: 'buyer' | 'seller', profileData?: Partial<User>) => Promise<{ needsProfileCompletion: boolean; isNewUser?: boolean }>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  refreshUser: () => Promise<void>;
  switchRole: (role: 'buyer' | 'seller') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await authService.getMe();
          const userData = response.data.user;
          const sanitizedUser = { 
            ...userData, 
            roles: userData.roles || [],
            viewMode: userData.viewMode || (userData.roles?.includes('seller') ? 'seller' : 'buyer')
          };
          setUser(sanitizedUser);
          localStorage.setItem('user', JSON.stringify(sanitizedUser));
        } catch {
          // Token is invalid/expired
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, [token]);

  const _persistUser = useCallback((newUser: any, newToken: string) => {
    const sanitized = {
      ...newUser,
      roles:    newUser.roles    || [],
      viewMode: newUser.viewMode || (newUser.roles?.includes('seller') ? 'seller' : 'buyer'),
    };
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(sanitized));
    setToken(newToken);
    setUser(sanitized);
    return sanitized;
  }, []);

  // ── OTP registration ────────────────────────────────────────────────────────

  const sendRegistrationOtp = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) throw new Error('Authentication service offline.');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase(),
      options: { shouldCreateUser: true },
    });
    if (error) throw new Error(error.message || 'Failed to send verification code.');
  }, []);

  const verifyOtpAndRegister = useCallback(async (
    email: string,
    otp: string,
    profile: Omit<RegisterData, 'supabaseAccessToken'>,
  ) => {
    const { data: { session }, error } = await supabase.auth.verifyOtp({
      email: email.toLowerCase(),
      token: otp.trim(),
      type: 'email',
    });
    if (error || !session?.access_token) {
      throw new Error(error?.message?.includes('expired') || error?.message?.includes('invalid')
        ? 'Incorrect or expired code. Please check and try again.'
        : error?.message || 'Verification failed.');
    }
    const response = await authService.register({
      supabaseAccessToken: session.access_token,
      ...profile,
    });
    const { user: newUser, token: newToken } = response.data;
    _persistUser(newUser, newToken);
    trySubscribeWebPush();
  }, [_persistUser]);

  // ── OTP login ───────────────────────────────────────────────────────────────

  const sendLoginOtp = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) throw new Error('Authentication service offline.');
    // shouldCreateUser: false so we don't accidentally register someone trying to log in
    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase(),
      options: { shouldCreateUser: false },
    });
    if (error) {
      const msg = error.message?.toLowerCase() || '';
      if (msg.includes('user not found') || msg.includes('no user')) {
        throw new Error('No account found with that email address. Please sign up first.');
      }
      throw new Error(error.message || 'Failed to send login code.');
    }
  }, []);

  const verifyOtpAndLogin = useCallback(async (email: string, otp: string) => {
    const { data: { session }, error } = await supabase.auth.verifyOtp({
      email: email.toLowerCase(),
      token: otp.trim(),
      type: 'email',
    });
    if (error || !session?.access_token) {
      throw new Error(error?.message?.includes('expired') || error?.message?.includes('invalid')
        ? 'Incorrect or expired code. Please check and try again.'
        : error?.message || 'Verification failed.');
    }
    const response = await authService.login({ supabaseAccessToken: session.access_token });
    const { user: newUser, token: newToken } = response.data;
    const sanitized = _persistUser(newUser, newToken);
    toast.success(`Welcome back, ${sanitized.name || newUser.name}!`, { duration: 1200 });
    trySubscribeWebPush();
  }, [_persistUser]);

  // ── Password login (admin/support only) ─────────────────────────────────────

  const login = useCallback(async (data: { email: string; password: string }) => {
    if (!isSupabaseConfigured) throw new Error('Authentication service offline.');
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email.toLowerCase(),
      password: data.password,
    });
    if (error || !authData.session?.access_token) {
      const msg = error?.message?.toLowerCase() || '';
      if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
        throw new Error('Incorrect email or password.');
      }
      throw new Error(error?.message || 'Login failed. Please try again.');
    }
    const response = await authService.login({ supabaseAccessToken: authData.session.access_token });
    const { user: newUser, token: newToken } = response.data;
    const sanitized = _persistUser(newUser, newToken);
    toast.success(`Welcome back, ${sanitized.name || newUser.name}!`, { duration: 1200 });
    trySubscribeWebPush();
  }, [_persistUser]);

  const googleLogin = useCallback(async (credential: string, role: 'buyer' | 'seller' | undefined = 'buyer', profileData?: Partial<User>) => {
    // 1. Exchange Google ID token for Supabase session
    const { data: { session }, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: credential,
    });

    if (error || !session?.access_token) {
      throw new Error(error?.message || 'Supabase Google sign in failed');
    }

    // 2. Send Supabase access token to our backend
    const response = await authService.googleLogin(session.access_token, role, profileData);
    const { user: newUser, token: newToken } = response.data;
    const sanitizedUser = { 
      ...newUser, 
      roles: newUser.roles || [],
      viewMode: newUser.viewMode || (newUser.roles?.includes('seller') ? 'seller' : 'buyer')
    };

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(sanitizedUser));
    setToken(newToken);
    setUser(sanitizedUser);
    toast.success(`Welcome, ${newUser.name}!`, { duration: 1200 });
    trySubscribeWebPush();

    return {
      needsProfileCompletion: !!response.data?.needsProfileCompletion,
      isNewUser: !!response.data?.isNewUser,
    };
  }, []);


  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore errors during logout
    }
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore sign out errors
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully', { duration: 900 });
  }, []);

  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    const response = await authService.updateProfile(data);
    const updatedUser = response.data.user;
    const sanitizedUser = { 
      ...updatedUser, 
      roles: updatedUser.roles || [],
      viewMode: updatedUser.viewMode || (updatedUser.roles?.includes('seller') ? 'seller' : 'buyer')
    };
    setUser(sanitizedUser);
    localStorage.setItem('user', JSON.stringify(sanitizedUser));
    toast.success('Profile updated successfully', { duration: 1200 });
  }, []);

  const changePassword = useCallback(async (data: ChangePasswordData) => {
    await authService.changePassword(data);
    toast.success('Password changed successfully', { duration: 1200 });
  }, []);

  const switchRole = useCallback(async (targetMode: 'buyer' | 'seller') => {
    const response = await authService.switchRole(targetMode);
    const { user: updatedUser, token: newToken } = response.data;
    const sanitizedUser = { 
      ...updatedUser, 
      roles: updatedUser.roles || [],
      viewMode: updatedUser.viewMode || (updatedUser.roles?.includes('seller') ? 'seller' : 'buyer')
    };
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(sanitizedUser));
    setToken(newToken);
    setUser(sanitizedUser);
    toast.success(`Switched to ${targetMode} mode`, { duration: 1200 });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getMe();
      const userData = response.data.user;
      const sanitizedUser = { 
        ...userData, 
        roles: userData.roles || [],
        viewMode: userData.viewMode || (userData.roles?.includes('seller') ? 'seller' : 'buyer')
      };
      setUser(sanitizedUser);
      localStorage.setItem('user', JSON.stringify(sanitizedUser));
    } catch {
      // Silently fail
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        sendRegistrationOtp,
        verifyOtpAndRegister,
        sendLoginOtp,
        verifyOtpAndLogin,
        login,
        googleLogin,
        logout,
        updateProfile,
        changePassword,
        refreshUser,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
