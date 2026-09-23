import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import http from '@/lib/api/client';
import type { ApiResponse } from '@/api';

/**
 * Địa chỉ giao hàng đã lưu. Type khai TẠI ĐÂY (không lấy từ schema sinh tự động)
 * vì schema chưa có 3 cột GHN id mới — sẽ đồng bộ khi regenerate OpenAPI.
 */
export interface Address {
  id: number;
  recipient_name: string;
  phone_number: string;
  label?: string;
  province: string;
  district: string;
  ward?: string;
  street: string;
  ghn_province_id?: number | null;
  ghn_district_id?: number | null;
  ghn_ward_code?: string | null;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AddressInput {
  recipient_name: string;
  phone_number: string;
  label?: string;
  province: string;
  district: string;
  ward?: string;
  street: string;
  ghn_province_id?: number;
  ghn_district_id?: number;
  ghn_ward_code?: string;
  is_default?: boolean;
}

export const addressKeys = {
  all: ['addresses'] as const,
};

/** Danh sách địa chỉ của tôi — mặc định đứng đầu (backend đã order). */
export function useAddresses() {
  return useQuery({
    queryKey: addressKeys.all,
    queryFn: async () => {
      const res = await http.get<ApiResponse<Address[]>>('/addresses');
      return res.data.data;
    },
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddressInput) => {
      const res = await http.post<ApiResponse<Address>>('/addresses', input);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: addressKeys.all }),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: AddressInput }) => {
      const res = await http.patch<ApiResponse<Address>>(`/addresses/${id}`, input);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: addressKeys.all }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await http.delete(`/addresses/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: addressKeys.all }),
  });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await http.patch(`/addresses/${id}/default`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: addressKeys.all }),
  });
}
