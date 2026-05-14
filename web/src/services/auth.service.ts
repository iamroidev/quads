import api from './api';

export interface RegisterData {
  supabaseAccessToken: string;
  name: string;
  phone: string;
  role: 'buyer' | 'seller';
  studentId?: string;
  department?: string;
  residenceHall?: string;
  currentLevel?: string;
  location?: string;
}

export interface LoginData {
  supabaseAccessToken: string;
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

  login: async (data: LoginData) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  googleLogin: async (credential: string, role?: 'buyer' | 'seller', profileData?: any) => {
    const response = await api.post('/auth/google', { credential, role, profileData });
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

  switchRole: async (role: 'buyer' | 'seller') => {
    const response = await api.put('/auth/switch-role', { role });
    return response.data;
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
