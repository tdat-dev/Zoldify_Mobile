import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { useProducts } from '@/features/products/api';
import { API_URL } from '@/lib/config';

/**
 * Màn hình mẫu — chứng minh cả chuỗi chạy được:
 * NativeWind (className) + TanStack Query + axios + kiểu sinh từ openapi.
 *
 * Thay nội dung này bằng trang chủ thật. Giữ lại phần xử lý
 * loading/lỗi/rỗng, đó là ba trạng thái hay bị quên nhất.
 */
export default function HomeScreen() {
  const { data, isPending, isError, error, refetch, isRefetching } = useProducts(1, 20);

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-light">
        <ActivityIndicator size="large" />
        <Text className="mt-3 text-slate-600">Đang tải sản phẩm…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-brand-light px-6">
        <Text className="text-center text-base font-semibold text-slate-800">
          Không gọi được API
        </Text>
        <Text className="text-center text-sm text-slate-500">
          {error instanceof Error ? error.message : 'Lỗi không rõ'}
        </Text>
        <Text className="text-center text-xs text-slate-400">Đang gọi: {API_URL}</Text>
        <Pressable
          onPress={() => refetch()}
          className="mt-2 rounded-lg bg-brand px-5 py-3">
          <Text className="font-semibold text-white">Thử lại</Text>
        </Pressable>
      </View>
    );
  }

  if (data.result.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-light px-6">
        <Text className="text-center text-slate-600">Chưa có sản phẩm nào</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data.result}
      keyExtractor={(item) => String(item.id)}
      refreshing={isRefetching}
      onRefresh={refetch}
      contentContainerClassName="p-4 gap-3"
      ListHeaderComponent={
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-slate-900">Sản phẩm</Text>
          <Pressable onPress={() => router.push('/login')}>
            <Text className="font-medium text-brand">Đăng nhập</Text>
          </Pressable>
        </View>
      }
      renderItem={({ item }) => (
        <View className="rounded-xl border border-slate-200 bg-white p-4">
          <Text className="text-base font-semibold text-slate-900">{item.name}</Text>
          <Text className="mt-1 text-brand">
            {Number(item.price).toLocaleString('vi-VN')} đ
          </Text>
        </View>
      )}
    />
  );
}
