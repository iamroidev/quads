import api from './api';
import { User } from '../types';

export interface RegisterPayload {
  name: string;
  phone: string;
  role?: 'buyer' | 'seller';
  roles?: ('buyer' | 'seller')[];
  password?: string;
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
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', payload);
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

  loginWithPassword: async (email: string, password: string, totpCode?: string): Promise<any> => {
    const response = await api.post('/auth/login', { email, password, totpCode });
    if (response.data?.totpRequired) {
      return { data: response.data };
    }
    return { data: response.data.data };
  },

  googleLogin: async (idToken: string, role?: string, profileData?: any): Promise<any> => {
    const response = await api.post('/auth/google', { credential: idToken, role, profileData });
    return { data: response.data.data };
  },

  sendOtp: async (email: string, purpose: 'login' | 'register'): Promise<any> => {
    const response = await api.post('/auth/otp/send', { email, purpose });
    return response.data;
  },

  verifyOtpLogin: async (email: string, code: string, totpCode?: string): Promise<any> => {
    const response = await api.post('/auth/otp/verify/login', { email, code, totpCode });
    if (response.data?.totpRequired) {
      return { data: response.data };
    }
    return { data: response.data.data };
  },

  verifyOtpRegister: async (email: string, code: string, profile: any): Promise<any> => {
    const response = await api.post('/auth/otp/verify/register', { email, code, profile });
    return { data: response.data.data };
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};

export default authService;
