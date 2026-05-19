import api from './api';
import { User } from '../types';

export interface LoginPayload {
  supabaseAccessToken: string;
}

export interface RegisterPayload {
  supabaseAccessToken: string;
  name: string;
  phone: string;
  role?: 'buyer' | 'seller';
  studentId?: string;
  department?: string;
  residenceHall?: string;
  currentLevel?: string;
  location?: string;
}

interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    isNewUser?: boolean;
    needsProfileCompletion?: boolean;
  };
}

interface MeResponse {
  success: boolean;
  data: {
    user: User;
  };
}

const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', payload);
    return response.data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', payload);
    return response.data;
  },

  googleLogin: async (credential: string, role?: 'buyer' | 'seller'): Promise<AuthResponse> => {
    const response = await api.post('/auth/google', { credential, role });
    return response.data;
  },

  getMe: async (): Promise<MeResponse> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  switchRole: async (targetMode: 'buyer' | 'seller'): Promise<AuthResponse> => {
    const response = await api.put('/auth/switch-role', { targetMode });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};

export default authService;
