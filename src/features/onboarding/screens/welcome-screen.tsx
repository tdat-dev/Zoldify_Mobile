import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Wordmark } from '@/components/ui/brand-mark';
import { Text } from '@/components/ui/text';
import { Palette } from '@/components/ui/theme';
import { PagerDots } from '@/features/onboarding/components/pager-dots';
import { WelcomeArt } from '@/features/onboarding/components/welcome-art';
import { SLIDES } from '@/features/onboarding/data/slides';

/**
 * Màn chào đầu tiên: carousel 3 slide khoe giá trị, rồi đưa vào luồng
 * đăng nhập/đăng ký. Không có "home khách" — auth-gate chặn trước đó.
 */
export default function WelcomeScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Wordmark size={30} />
        <Pressable
          hitSlop={12}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          accessibilityLabel="Đóng">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item }) => (
          <View style={{ width }}>
            <View style={styles.slide}>
              <WelcomeArt slide={item.key} />
              <View style={styles.copy}>
                <Text variant="display">{item.title}</Text>
                <Text variant="bodyMuted" style={styles.body}>
                  {item.body}
                </Text>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.dots}>
        <PagerDots count={SLIDES.length} index={index} />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button title="Bắt đầu" onPress={() => router.push('/email-entry')} />
        <Pressable
          style={styles.signInRow}
          hitSlop={8}
          onPress={() => router.push('/email-entry')}>
          <Text variant="bodyMuted">Đã có tài khoản? </Text>
          <Text variant="link">Đăng nhập</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surfacePage },
  topBar: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  close: { fontFamily: 'BeVietnamPro_500Medium', fontSize: 20, color: '#64748B' },
  slide: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 24 },
  copy: { marginTop: 44 },
  body: { marginTop: 12, fontSize: 16, lineHeight: 24 },
  dots: { alignItems: 'flex-start', paddingHorizontal: 24, marginBottom: 8 },
  footer: { paddingHorizontal: 24, paddingTop: 12, gap: 14 },
  signInRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
