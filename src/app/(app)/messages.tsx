import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Palette } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/store';

/**
 * Tin nhắn — mở từ icon trên header. Chat thật (Socket.IO gateway /chat) là
 * luồng riêng lớn, chưa dựng ở mobile; ở đây là màn giữ chỗ + cổng đăng nhập.
 */
export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const guest = useAuthStore((s) => s.status) !== 'signedIn';
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable hitSlop={10} onPress={back} accessibilityLabel="Quay lại">
          <View style={styles.chevron} />
        </Pressable>
        <Text variant="title">Tin nhắn</Text>
      </View>

      <View style={styles.center}>
        <Text variant="heading" style={styles.line}>
          {guest ? 'Tin nhắn với người bán' : 'Chưa có cuộc trò chuyện'}
        </Text>
        <Text variant="bodyMuted" style={styles.line}>
          {guest
            ? 'Đăng nhập để nhắn tin, hỏi giá và chốt đơn với người bán.'
            : 'Nhắn tin sẽ có ở bước tiếp theo — đang hoàn thiện.'}
        </Text>
        {guest ? (
          <View style={styles.cta}>
            <Button title="Đăng nhập / Tạo tài khoản" onPress={() => router.push('/welcome')} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surfacePage },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  chevron: {
    width: 11,
    height: 11,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: Palette.ink,
    transform: [{ rotate: '45deg' }],
    marginLeft: 4,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  line: { textAlign: 'center' },
  cta: { marginTop: 8, alignSelf: 'stretch', paddingHorizontal: 16 },
});
