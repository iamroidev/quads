import api from './api';
import { PaginationInfo, Product } from '../types';

interface ProductListResponse {
  success: boolean;
  data: Product[];
  pagination: PaginationInfo;
}

interface ProductResponse {
  success: boolean;
  data: {
    product: Product;
  };
}

interface CreateProductPayload {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  deliveryOption?: string;
  pickupLocation?: string;
  tags?: string[];
  status?: string;
  images?: Array<{
    uri: string;
    type?: string;
    name?: string;
  }>;
}

interface SellerStatsResponse {
  success: boolean;
  data: {
    stats: {
      totalOrders: number;
      totalRevenue: number;
      pendingOrders: number;
      completedOrders: number;
      totalViews: number;
    };
  };
}

interface ProductDetailResponse {
  success: boolean;
  data: {
    product: Product;
  };
}

interface ProductCardFeedResponse {
  success: boolean;
  data: Product[];
}

interface PriceInsightsResponse {
  success: boolean;
  data: {
    min: number;
    max: number;
    average: number;
    median: number;
    sampleSize: number;
    q1: number;
    q3: number;
    dealLabel: 'great_deal' | 'fair_price' | 'premium';
  };
}

const productService = {
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    deliveryOption?: string;
    sort?: string;
  }): Promise<ProductListResponse> => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getProductById: async (id: string): Promise<ProductDetailResponse> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getRelated: async (productId: string, limit = 6): Promise<ProductCardFeedResponse> => {
    const response = await api.get(`/products/${productId}/related`, { params: { limit } });
    return response.data;
  },

  getRecommendations: async (params?: { productId?: string; limit?: number }): Promise<ProductCardFeedResponse> => {
    const response = await api.get('/products/recommendations', { params });
    return response.data;
  },

  getPriceInsights: async (productId: string): Promise<PriceInsightsResponse> => {
    const response = await api.get(`/products/${productId}/price-insights`);
    return response.data;
  },

  createProduct: async (payload: CreateProductPayload): Promise<ProductResponse> => {
    const hasImages = Array.isArray(payload.images) && payload.images.length > 0;

    if (hasImages) {
      const formData = new FormData();
      formData.append('title', payload.title);
      formData.append('description', payload.description);
      formData.append('price', String(payload.price));
      formData.append('category', payload.category);
      formData.append('condition', payload.condition);
      if (payload.deliveryOption) formData.append('deliveryOption', payload.deliveryOption);
      if (payload.pickupLocation) formData.append('pickupLocation', payload.pickupLocation);
      if (payload.status) formData.append('status', payload.status);
      if (payload.tags?.length) {
        formData.append('tags', payload.tags.join(','));
      }

      payload.images!.forEach((image, idx) => {
        formData.append('images', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.name || `listing-${Date.now()}-${idx}.jpg`,
        } as any);
      });

      const response = await api.post('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }

    const response = await api.post('/products', payload);
    return response.data;
  },

  duplicateProduct: async (id: string): Promise<ProductResponse> => {
    const response = await api.post(`/products/${id}/duplicate`);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  updateProduct: async (id: string, payload: Partial<CreateProductPayload>): Promise<ProductResponse> => {
    const hasImages = Array.isArray(payload.images) && payload.images.length > 0;
    if (hasImages) {
      const formData = new FormData();
      if (payload.title) formData.append('title', payload.title);
      if (payload.description) formData.append('description', payload.description);
      if (payload.price != null) formData.append('price', String(payload.price));
      if (payload.category) formData.append('category', payload.category);
      if (payload.condition) formData.append('condition', payload.condition);
      if (payload.deliveryOption) formData.append('deliveryOption', payload.deliveryOption);
      if (payload.pickupLocation) formData.append('pickupLocation', payload.pickupLocation);
      if (payload.status) formData.append('status', payload.status);
      if (payload.tags?.length) formData.append('tags', payload.tags.join(','));
      payload.images!.forEach((image, idx) => {
        formData.append('images', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.name || `listing-${Date.now()}-${idx}.jpg`,
        } as any);
      });
      const response = await api.put(`/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    }
    const response = await api.put(`/products/${id}`, payload);
    return response.data;
  },


  getSellerStats: async (): Promise<SellerStatsResponse> => {
    const response = await api.get('/orders/seller/stats');
    return response.data;
  },

  getMyListings: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    status?: string;
  }): Promise<ProductListResponse> => {
    const response = await api.get('/products/my/listings', { params });
    return response.data;
  },

  importProductsCsv: async (csvFile: {
    uri: string;
    type?: string;
    name?: string;
  }): Promise<{ success: boolean; message: string; data?: any }> => {
    const formData = new FormData();
    formData.append('csvFile', {
      uri: csvFile.uri,
      type: csvFile.type || 'text/csv',
      name: csvFile.name || `import-${Date.now()}.csv`,
    } as any);
    formData.append('withImages', 'true');

    const response = await api.post('/products/bulk/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default productService;
