import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Palette } from '@/components/ui/theme';
import { Text } from '@/components/ui/text';
import { useGoogleAuth } from '@/features/auth/use-google-auth';
import { googleAvailable } from '@/lib/firebase-config';

// Logo Google 4 màu chính thức (PNG), thay cho glyph 'G' đơn sắc.
const GOOGLE_LOGO = require('../../../../assets/images/google-g.png');
const GoogleIcon = () => (
  <Image source={GOOGLE_LOGO} style={styles.logo} contentFit="contain" />
);

/**
 * Nút đăng nhập/đăng ký bằng Google. Chỉ render ở nơi Google CHẠY ĐƯỢC
 * (app native dev/prod build, hoặc web secure origin) — quyết định bởi
 * `googleAvailable()`. Ở Expo Go / web-LAN nó trả null (màn hình đã tự ẩn cả
 * khối này rồi; guard ở đây là lớp phòng thủ, đồng thời tránh mount hook
 * expo-auth-session ở môi trường không hỗ trợ).
 */
export function GoogleButton({ label = 'Tiếp tục với Google' }: { label?: string }) {
  if (!googleAvailable()) return null;
  return <GoogleLive label={label} />;
}

function GoogleLive({ label }: { label: string }) {
  const { ready, busy, error, signInWithGoogle } = useGoogleAuth();
  return (
    <View>
      <Button
        variant="secondary"
        title={label}
        leading={<GoogleIcon />}
        loading={busy}
        disabled={!ready}
        onPress={signInWithGoogle}
      />
      {error ? (
        <Text variant="caption" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  logo: { width: 18, height: 18 },
  error: { color: Palette.dangerFg, marginTop: 8, textAlign: 'center' },
});
