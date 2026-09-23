import { useEffect } from 'react';
import { StyleSheet, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Palette, Radius } from './theme';

/**
 * Khối chờ (skeleton) — thay cho spinner giữa màn. Giữ đúng layout khi đang
 * tải nên không giật; nhịp mờ dần rất nhẹ (0.55↔1) hợp doctrine "sổ kê" phẳng,
 * KHÔNG shimmer gradient loè loẹt. Dùng để dựng khung card/list trong lúc chờ.
 */
export function Skeleton({
  width = '100%',
  height,
  radius = Radius.control,
  style,
}: {
  width?: DimensionValue;
  height: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(opacity);
  }, [opacity]);

  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[styles.base, { width, height, borderRadius: radius }, anim, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: Palette.surfaceSunken },
});
