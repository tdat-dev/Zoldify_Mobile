import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import http from '@/lib/api/client';
import type { ApiResponse, CreateProductDto, Paginated, Product } from '@/api';

/** Bộ lọc danh sách sản phẩm — khớp query param backend nhận. */
export interface ProductFilters {
  q?: string;
  category_id?: number;
  seller_id?: number;
  price_min?: number;
  price_max?: number;
  sort?: string;
}

/**
 * Query-key factory: đi từ chung -> riêng, luôn là mảng.
 *
 * Nhờ phân tầng này mà `invalidateQueries` trúng đúng mức cần:
 *   productKeys.all            -> mọi thứ về sản phẩm
 *   productKeys.lists()        -> mọi danh sách (mọi bộ lọc/trang)
 *   productKeys.detail(id)     -> đúng một sản phẩm
 */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (page: number, limit: number, filters?: ProductFilters) =>
    [...productKeys.lists(), { page, limit, ...filters }] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
};

async function fetchProducts(page: number, limit: number, filters?: ProductFilters) {
  const res = await http.get<ApiResponse<Paginated<Product>>>('/products', {
    params: { current: page, pageSize: limit, ...filters },
  });
  return res.data.data;
}

async function fetchProduct(id: number) {
  const res = await http.get<ApiResponse<Product>>(`/products/${id}`);
  return res.data.data;
}

/** Danh sách sản phẩm có phân trang + lọc. Trả thẳng { result, meta }. */
export function useProducts(page = 1, limit = 20, filters?: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(page, limit, filters),
    queryFn: () => fetchProducts(page, limit, filters),
  });
}

/** Chi tiết một sản phẩm. */
export function useProduct(id: number) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => fetchProduct(id),
    enabled: Number.isFinite(id),
  });
}

/** Đăng bán: tạo sản phẩm mới (cần đăng nhập). Làm mới feed sau khi tạo. */
export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateProductDto) => {
      const res = await http.post<ApiResponse<Product>>('/products', dto);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.lists() }),
  });
}

/**
 * Tìm kiếm: theo từ khoá `q` (>= 2 ký tự) VÀ/HOẶC theo tầm tiền. Chạy khi có
 * ít nhất một trong hai — để mở "/search?price_max=100000" (không từ khoá) vẫn
 * ra kết quả, đúng như bộ lọc giá bên web.
 */
export function useProductSearch(input: {
  q?: string;
  price_min?: number;
  price_max?: number;
}) {
  const q = (input.q ?? '').trim();
  const hasPrice = input.price_min != null || input.price_max != null;
  const active = q.length >= 2 || hasPrice;

  const filters: ProductFilters = {
    ...(q.length >= 2 ? { q } : {}),
    ...(input.price_min != null ? { price_min: input.price_min } : {}),
    ...(input.price_max != null ? { price_max: input.price_max } : {}),
  };

  return useQuery({
    queryKey: productKeys.list(1, 20, filters),
    queryFn: () => fetchProducts(1, 20, filters),
    enabled: active,
  });
}
