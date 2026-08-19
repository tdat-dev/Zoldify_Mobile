import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import http from '@/lib/api/client';
import type { ApiResponse } from '@/api';

/** Các trường pickup GHN cần đủ để được phép đăng bán. */
export interface ShopPickup {
  pickup_name?: string;
  pickup_phone?: string;
  pickup_address?: string;
  pickup_province_name?: string;
  pickup_district_id?: number;
  pickup_district_name?: string;
  pickup_ward_code?: string;
  pickup_ward_name?: string;
}

export interface Shop extends ShopPickup {
  id: number;
  name: string;
  slug: string;
}

const shopKeys = { me: ['shop', 'me'] as const };

async function fetchMyShop(): Promise<Shop | null> {
  try {
    const res = await http.get<ApiResponse<Shop>>('/shop/me');
    return res.data.data;
  } catch (e) {
    // Chưa có shop -> backend trả 404; coi như null để form hiện trống.
    if ((e as { response?: { status?: number } })?.response?.status === 404) return null;
    throw e;
  }
}

/** Shop của tôi (null nếu chưa tạo). */
export function useMyShop() {
  return useQuery({ queryKey: shopKeys.me, queryFn: fetchMyShop, retry: false });
}

/** Bỏ dấu + gạch nối để làm slug từ tên shop. */
function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || `shop-${Date.now()}`;
}

interface SaveInput extends ShopPickup {
  name: string;
  hasShop: boolean;
}

/** Tạo shop nếu chưa có (POST), hoặc cập nhật pickup (PATCH). */
export function useSaveShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ hasShop, name, ...pickup }: SaveInput) => {
      if (hasShop) {
        const res = await http.patch<ApiResponse<Shop>>('/shop', { name, ...pickup });
        return res.data.data;
      }
      const res = await http.post<ApiResponse<Shop>>('/shop', {
        name,
        slug: slugify(name),
        ...pickup,
      });
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: shopKeys.me }),
  });
}
