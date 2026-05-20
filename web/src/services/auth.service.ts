import api from './api';

export interface RegisterData {
  name: string;
  phone: string;
  roles: ('buyer' | 'seller' | 'admin')[];
  studentId?: string;
  department?: string;
  residenceHall?: string;
  currentLevel?: string;
  location?: string;
}

export interface UpdateProfileData {
  name?: string;
  storeName?: string;
  brandName?: string;
  phone?: string;
  avatar?: string;
  studentId?: string;
  department?: string;
  residenceHall?: string;
  currentLevel?: string;
  location?: string;
  bio?: string;
}

export interface SellerOnboardingData {
  storeName?: string;
  brandName?: string;
  responseTimeMinutes?: number;
  payoutMethod?: 'momo' | 'bank';
  payoutProvider?: string;
  payoutAccountName?: string;
  payoutAccountNumber?: string;
  identityStatus?: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  completed?: boolean;
}

export interface ChangePasswordData {
  currentPassword?: string;
  newPassword?: string;
}

export interface UserStats {
  activeListings: number;
  totalSales: number;
  rating: number;
  totalReviews: number;
  totalOrders: number;
  unreadNotifications: number;
  responseTime: number;
  responseRate: number;
}

const authService = {
  register: async (data: RegisterData) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileData) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/auth/profile/avatar', formData);
    return response.data;
  },

  updateSellerOnboarding: async (data: SellerOnboardingData) => {
    const response = await api.put('/auth/seller-onboarding', data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordData) => {
    const response = await api.put('/auth/change-password', data);
    return response.data;
  },

  switchRole: async (targetMode: 'buyer' | 'seller') => {
    const response = await api.put('/auth/switch-role', { targetMode });
    return response.data;
  },

  sendEmailVerification: async () => {
    const response = await api.post('/auth/send-verification-email');
    return response.data;
  },

  verifyEmail: async (code: string) => {
    const response = await api.post('/auth/verify-email', { code });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    // server returns { success, data: { user, token } } — unwrap to { data: { user, token } }
    return { data: response.data.data };
  },

  googleLogin: async (idToken: string, role?: string, profileData?: any) => {
    const response = await api.post('/auth/google', { credential: idToken, role, profileData });
    return { data: response.data.data };
  },

  sendOtp: async (email: string, purpose: 'login' | 'register') => {
    const response = await api.post('/auth/otp/send', { email, purpose });
    return response.data;
  },

  verifyOtpLogin: async (email: string, code: string) => {
    const response = await api.post('/auth/otp/verify/login', { email, code });
    return { data: response.data.data };
  },

  verifyOtpRegister: async (email: string, code: string, profile: any) => {
    const response = await api.post('/auth/otp/verify/register', { email, code, profile });
    return { data: response.data.data };
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getUserStats: async () => {
    const response = await api.get('/auth/profile/stats');
    return response.data.data.stats as UserStats;
  },
};

export default authService;
