import api from './api';

export interface VerificationStatus {
  emailVerified: boolean;
  phoneVerified: boolean;
  isVerified: boolean;
  email: string;
  phone: string;
  role: 'buyer' | 'seller' | 'admin';
}

const verificationService = {
  /**
   * Send email verification OTP to the specified email
   */
  sendEmailOTP: async (email: string) => {
    const response = await api.post('/verification/send-email', { email });
    return response.data;
  },

  /**
   * Send phone verification OTP via AWS SNS
   */
  sendPhoneOTP: async (phone: string) => {
    const response = await api.post('/verification/send-sms', { phone });
    return response.data;
  },

  /**
   * Verify a 6-digit OTP code
   */
  verifyCode: async (code: string, type: 'email' | 'phone') => {
    const response = await api.post('/verification/verify', { code, type });
    return response.data;
  },

  /**
   * Get current user's verification status
   */
  getStatus: async (): Promise<VerificationStatus> => {
    const response = await api.get('/verification/status');
    return response.data.data;
  },
};

export default verificationService;