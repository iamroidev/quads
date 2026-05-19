import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService, { RegisterData, UpdateProfileData, ChangePasswordData } from '../services/auth.service';
import { User } from '../types';
import toast from 'react-hot-toast';
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
  verifyOtpAndRegister: (email: string, otp: string, profile: RegisterData) => Promise<void>;
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

  // ── OTP — fully server-side, no Supabase dependency ────────────────────────

  const sendRegistrationOtp = useCallback(async (email: string) => {
    await authService.sendOtp(email.toLowerCase(), 'register');
  }, []);

  const verifyOtpAndRegister = useCallback(async (
    email: string,
    otp: string,
    profile: RegisterData,
  ) => {
    const response = await authService.verifyOtpRegister(email.toLowerCase(), otp.trim(), profile);
    const { user: newUser, token: newToken } = response.data;
    _persistUser(newUser, newToken);
    trySubscribeWebPush();
  }, [_persistUser]);

  const sendLoginOtp = useCallback(async (email: string) => {
    await authService.sendOtp(email.toLowerCase(), 'login');
  }, []);

  const verifyOtpAndLogin = useCallback(async (email: string, otp: string) => {
    const response = await authService.verifyOtpLogin(email.toLowerCase(), otp.trim());
    const { user: newUser, token: newToken } = response.data;
    const sanitized = _persistUser(newUser, newToken);
    toast.success(`Welcome back, ${sanitized.name || newUser.name}!`, { duration: 1200 });
    trySubscribeWebPush();
  }, [_persistUser]);

  // ── Password login (admin/support only) ─────────────────────────────────────

  const login = useCallback(async (data: { email: string; password: string }) => {
    const response = await authService.login(data.email.toLowerCase(), data.password);
    const { user: newUser, token: newToken } = response.data;
    const sanitized = _persistUser(newUser, newToken);
    toast.success(`Welcome back, ${sanitized.name || newUser.name}!`, { duration: 1200 });
    trySubscribeWebPush();
  }, [_persistUser]);

  // ── Google login — sends ID token directly to our server ────────────────────

  const googleLogin = useCallback(async (credential: string, role: 'buyer' | 'seller' | undefined = 'buyer', profileData?: Partial<User>) => {
    const response = await authService.googleLogin(credential, role, profileData);
    const { user: newUser, token: newToken } = response.data;
    const sanitized = _persistUser(newUser, newToken);
    toast.success(`Welcome, ${sanitized.name || newUser.name}!`, { duration: 1200 });
    trySubscribeWebPush();
    return {
      needsProfileCompletion: !!response.data?.needsProfileCompletion,
      isNewUser: !!response.data?.isNewUser,
    };
  }, [_persistUser]);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { /* ignore */ }
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
