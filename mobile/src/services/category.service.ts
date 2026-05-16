import api from './api';

export interface CategoryWithCount {
  _id: string;
  name: string;
  slug: string;
  productCount: number;
  icon?: string;
}

interface ApiCategoryWithCountsResponse {
  success: boolean;
  data: { categories: CategoryWithCount[] };
}

const categoryService = {
  getCategoriesWithCounts: async (): Promise<ApiCategoryWithCountsResponse> => {
    const response = await api.get('/categories/with-counts');
    return response.data;
  },
};

export default categoryService;
