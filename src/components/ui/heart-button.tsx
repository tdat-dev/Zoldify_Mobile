import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useWishlistStore } from '@/features/wishlist/store';
import { Palette } from './theme';

/**
 * Nút lưu (tim) — nguồn sự thật là wishlist store, nên bấm ở đâu cũng đồng bộ.
 * `floating` = đặt đè lên ảnh (nền trắng mờ tròn cho dễ đọc, kiểu Vinted/Depop);
 * ngược lại là icon trần dùng trong hàng nút.
 */
export function HeartButton({
  productId,
  size = 22,
  floating = false,
  style,
}: {
  productId: number;
  size?: number;
  floating?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const saved = useWishlistStore((s) => s.set.has(productId));
  const toggle = useWishlistStore((s) => s.toggle);

  return (
    <Pressable
      onPress={() => toggle(productId)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ selected: saved }}
      accessibilityLabel={saved ? 'Bỏ lưu' : 'Lưu món này'}
      style={[floating && styles.floating, style]}>
      <Ionicons
        name={saved ? 'heart' : 'heart-outline'}
        size={size}
        color={saved ? Palette.price : floating ? Palette.ink : Palette.inkMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  floating: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
