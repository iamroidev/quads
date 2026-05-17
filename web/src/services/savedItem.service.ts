import api from './api';
import { PaginationInfo, ProductPopulated } from '../types';

interface ToggleSavedResponse {
  success: boolean;
  message: string;
  data: {
    saved: boolean;
    savedItems: {
      productId: string;
      savedAt: string; // ISO date string
      priceWhenSaved: number;
    }[];
  };
}

interface SavedItemsResponse {
  success: boolean;
  data: { products: ProductPopulated[] };
  pagination: PaginationInfo;
}

interface IsSavedResponse {
  success: boolean;
  data: { isSaved: boolean };
}

interface SavedItemIdsResponse {
  success: boolean;
  data: { savedItemIds: string[] };
}

interface SavedItemsWithPriceChangesResponse {
  success: boolean;
  data: { products: ProductPopulated[] };
  pagination: PaginationInfo;
  priceChanges: {
    productId: string;
    currentPrice: number;
    priceWhenSaved: number;
    changePercent: number;
  }[];
}

const savedItemService = {
  toggleSavedItem: async (productId: string): Promise<ToggleSavedResponse> => {
    const response = await api.post(`/saved/${productId}`);
    return response.data;
  },

  getSavedItems: async (
    page: number = 1,
    limit: number = 20
  ): Promise<SavedItemsResponse> => {
    const response = await api.get('/saved', { params: { page, limit } });
    return response.data;
  },

  getSavedItemsWithPriceChanges: async (
    page: number = 1,
    limit: number = 20
  ): Promise<SavedItemsWithPriceChangesResponse> => {
    const response = await api.get('/saved/price-changes', { params: { page, limit } });
    return response.data;
  },

  isSaved: async (productId: string): Promise<IsSavedResponse> => {
    const response = await api.get(`/saved/${productId}/is-saved`);
    return response.data;
  },

  getSavedItemIds: async (): Promise<SavedItemIdsResponse> => {
    const response = await api.get('/saved/ids');
    return response.data;
  },
};

export default savedItemService;
