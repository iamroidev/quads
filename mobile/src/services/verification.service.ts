import api from './api';

export const verificationService = {
  sendEmailOTP: async (): Promise<{ success: boolean; message: string }> => {
    const res = await api.post('/verification/send-email');
    return res.data;
  },

  sendPhoneOTP: async (phone: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.post('/verification/send-sms', { phone });
    return res.data;
  },

  verifyCode: async (
    code: string,
    type: 'email' | 'phone'
  ): Promise<{ success: boolean; message: string; data?: { isVerified: boolean } }> => {
    const res = await api.post('/verification/verify', { code, type, purpose: 'verify_' + type });
    return res.data;
  },

  getStatus: async (): Promise<{
    success: boolean;
    data: { emailVerified: boolean; phoneVerified: boolean; isVerified: boolean };
  }> => {
    const res = await api.get('/verification/status');
    return res.data;
  },

  respondToOffer: async (
    conversationId: string,
    msgId: string,
    status: 'accepted' | 'rejected' | 'countered',
    counterAmount?: number
  ): Promise<{ success: boolean; message: string }> => {
    const res = await api.patch(`/conversations/${conversationId}/messages/${msgId}/offer`, {
      status,
      counterAmount,
    });
    return res.data;
  },
};

export default verificationService;
