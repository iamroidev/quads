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
  register: (data: Omit<RegisterData, 'supabaseAccessToken'> & { email: string; password: string }) => Promise<void | 'pending'>;
  login: (data: { email: string; password: string }) => Promise<void>;
  finalizeAuth: (supabaseAccessToken: string) => Promise<void>;
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

  const register = useCallback(async (data: Omit<RegisterData, 'supabaseAccessToken' | 'roles'> & { email: string; password: string; role?: any; roles?: any }) => {
    if (!isSupabaseConfigured) {
      toast.error('Authentication service is currently offline. Please contact the administrator.');
      throw new Error('Supabase is not configured.');
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email.toLowerCase(),
      password: data.password,
      options: {
        emailRedirectTo: 'https://quadsmarket.tech/auth/callback',
        data: {
          name: data.name,
          roles: data.roles || [data.role],
        },
      },
    });

    if (error) {
      throw new Error(error.message || 'Registration failed at authentication provider.');
    }

    // Email confirmation required — session is null until user clicks the link.
    // Stash the profile data so the callback page can finish creating the DB record.
    if (!authData.session?.access_token && authData.user) {
      sessionStorage.setItem('pending_registration', JSON.stringify({
        name: data.name,
        phone: data.phone,
        roles: data.roles || [data.role],
        studentId: data.studentId,
        department: data.department,
        residenceHall: data.residenceHall,
        currentLevel: data.currentLevel,
        location: data.location,
      }));
      toast.success('Check your email — click the confirmation link to finish creating your account.', { duration: 8000 });
      return 'pending' as const;
    }

    if (!authData.session?.access_token) {
      throw new Error('Registration succeeded but no session was created. Please check your email.');
    }

    const response = await authService.register({
      supabaseAccessToken: authData.session.access_token,
      name: data.name,
      phone: data.phone,
      roles: data.roles || [data.role],
      studentId: data.studentId,
      department: data.department,
      residenceHall: data.residenceHall,
      currentLevel: data.currentLevel,
      location: data.location,
    });
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
    toast.success('Account created successfully!', { duration: 1400 });
    trySubscribeWebPush();
  }, []);

  const login = useCallback(async (data: { email: string; password: string }) => {
    if (!isSupabaseConfigured) {
      toast.error('Authentication service is currently offline. Please contact the administrator.');
      throw new Error('Supabase is not configured.');
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email.toLowerCase(),
      password: data.password,
    });

    if (error || !authData.session?.access_token) {
      const msg = error?.message?.toLowerCase() || '';
      if (msg.includes('email not confirmed')) {
        throw new Error('Please confirm your email address before logging in. Check your inbox.');
      }
      if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
        // Supabase gives the same error for wrong password and unregistered email.
        // Check if the email exists in Supabase to give a clearer message.
        const { data: methods } = await supabase.auth.signInWithOtp({ email: data.email.toLowerCase(), options: { shouldCreateUser: false } }).catch(() => ({ data: null }));
        const emailExists = methods !== null;
        throw new Error(emailExists
          ? 'Incorrect password. Please try again or reset your password.'
          : 'No account found with that email address. Please sign up first.'
        );
      }
      throw new Error(error?.message || 'Login failed. Please try again.');
    }

    const response = await authService.login({ supabaseAccessToken: authData.session.access_token });
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
    toast.success(`Welcome back, ${newUser.name}!`, { duration: 1200 });
    // Subscribe to web push non-blockingly after login
    trySubscribeWebPush();
  }, []);

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

  // Called by /auth/callback after email confirmation — logs in or registers using the Supabase session
  const finalizeAuth = useCallback(async (supabaseAccessToken: string) => {
    let response;
    try {
      response = await authService.login({ supabaseAccessToken });
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 404) {
        const pending = sessionStorage.getItem('pending_registration');
        const profile = pending ? JSON.parse(pending) : {};
        response = await authService.register({
          supabaseAccessToken,
          name:          profile.name          || 'Student',
          phone:         profile.phone          || '',
          roles:         profile.roles          || ['buyer'],
          studentId:     profile.studentId      || '',
          department:    profile.department     || '',
          residenceHall: profile.residenceHall  || '',
          currentLevel:  profile.currentLevel   || '',
          location:      profile.location       || '',
        });
        sessionStorage.removeItem('pending_registration');
      } else {
        throw err;
      }
    }
    const { user: newUser, token: newToken } = response.data;
    const sanitized = {
      ...newUser,
      roles:    newUser.roles    || [],
      viewMode: newUser.viewMode || (newUser.roles?.includes('seller') ? 'seller' : 'buyer'),
    };
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(sanitized));
    setToken(newToken);
    setUser(sanitized);
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
        register,
        login,
        finalizeAuth,
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
