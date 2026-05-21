import api from './api';

export interface LostFoundItem {
  _id?: string;
  id?: string; // compatibility mapping
  type: 'lost' | 'found';
  title: string;
  category: string;
  date: string;
  location: string;
  description: string;
  contactName: string;
  contactInfo: string;
  imageUrl?: string;
  createdAt: string;
  userId?: string | { _id: string; name: string; avatar?: string; isVerified?: boolean };
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const lostFoundService = {
  getItems: async (filters?: { type?: string; category?: string }): Promise<ApiResponse<LostFoundItem[]>> => {
    const response = await api.get('/lost-found', { params: filters });
    return response.data;
  },

  createItem: async (data: Omit<LostFoundItem, 'createdAt' | 'id' | '_id'>): Promise<ApiResponse<LostFoundItem>> => {
    const response = await api.post('/lost-found', data);
    return response.data;
  },

  deleteItem: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/lost-found/${id}`);
    return response.data;
  },
};

export default lostFoundService;
