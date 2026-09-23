import { useQuery } from '@tanstack/react-query';

import http from '@/lib/api/client';
import type { ApiResponse } from '@/api';

/** Danh mục (khớp response /categories: có product_count, image tương đối). */
export interface Category {
  id: number;
  name: string;
  image?: string | null;
  slug?: string | null;
  description?: string | null;
  product_count?: number;
}

export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
};

async function fetchCategories(): Promise<Category[]> {
  const res = await http.get<ApiResponse<{ result: Category[] }>>('/categories');
  return res.data.data.result ?? [];
}

/** Danh sách danh mục — ít đổi nên giữ tươi lâu. */
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000,
  });
}
