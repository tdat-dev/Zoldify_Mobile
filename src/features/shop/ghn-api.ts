import { useQuery } from '@tanstack/react-query';

import http from '@/lib/api/client';
import type { ApiResponse } from '@/api';

/** Shape GHN (giữ đúng tên trường của GHN). */
export interface GhnProvince {
  ProvinceID: number;
  ProvinceName: string;
}
export interface GhnDistrict {
  DistrictID: number;
  DistrictName: string;
}
export interface GhnWard {
  WardCode: string;
  WardName: string;
}

const ghnKeys = {
  provinces: ['ghn', 'provinces'] as const,
  districts: (p: number) => ['ghn', 'districts', p] as const,
  wards: (d: number) => ['ghn', 'wards', d] as const,
};

async function get<T>(url: string): Promise<T[]> {
  const res = await http.get<ApiResponse<{ result?: T[] } | T[] | null>>(url);
  const data = res.data.data;
  // Tỉnh test của GHN có thể trả data: null -> coi như danh sách rỗng.
  if (!data) return [];
  return Array.isArray(data) ? data : (data.result ?? []);
}

/** Danh mục GHN đổi rất chậm → giữ tươi lâu. Cần đăng nhập (backend chặn). */
export function useProvinces() {
  return useQuery({
    queryKey: ghnKeys.provinces,
    queryFn: () => get<GhnProvince>('/ghn/provinces'),
    staleTime: 60 * 60 * 1000,
  });
}

export function useDistricts(provinceId: number | null) {
  return useQuery({
    queryKey: ghnKeys.districts(provinceId ?? 0),
    queryFn: () => get<GhnDistrict>(`/ghn/districts?province_id=${provinceId}`),
    enabled: !!provinceId,
    staleTime: 60 * 60 * 1000,
  });
}

export function useWards(districtId: number | null) {
  return useQuery({
    queryKey: ghnKeys.wards(districtId ?? 0),
    queryFn: () => get<GhnWard>(`/ghn/wards?district_id=${districtId}`),
    enabled: !!districtId,
    staleTime: 60 * 60 * 1000,
  });
}
