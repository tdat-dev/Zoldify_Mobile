import http from '@/lib/http';
import type { ApiResponse, Paginated, Product } from '@/api';

export const productService = {
  getAll(
    currentPage = 1,
    limit = 10,
    params?: {
      q?: string;
      category_id?: number;
      seller_id?: number;
      price_min?: number;
      price_max?: number;
      sort?: string;
    },
  ) {
    return http.get<ApiResponse<Paginated<Product>>>('/products', {
      params: { current: currentPage, pageSize: limit, ...params },
    });
  },

  getOne(id: number) {
    return http.get<ApiResponse<Product>>(`/products/${id}`);
  },
};
