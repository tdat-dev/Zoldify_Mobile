import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackChevron } from '@/components/ui/back-chevron';
import { Button } from '@/components/ui/button';
import { KEYBOARD_GAP } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Font, Palette } from '@/components/ui/theme';
import { useDeleteAccount, useProfile } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import { apiErrorMessage } from '@/lib/api/error-message';

/**
 * Xoá tài khoản ngay trong app (Google Play bắt buộc với app cho đăng ký, D-14).
 * Tài khoản có mật khẩu phải nhập lại mật khẩu; tài khoản Google chưa đặt mật
 * khẩu (has_password=false) chỉ cần xác nhận. Xoá xong là đăng xuất, về trang chủ.
 */
export default function DeleteAccountScreen() {
  const insets = useSafeAreaInsets();
  const remove = useDeleteAccount();
  const accountDeleted = useAuthStore((s) => s.accountDeleted);
  const { data: profile } = useProfile();
  // Chưa biết chắc thì vẫn hỏi mật khẩu (an toàn hơn).
  const noPassword = profile?.has_password === false;

  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const back = () => (router.canGoBack() ? router.back() : router.replace('/account'));

  const run = () => {
    remove.mutate(noPassword ? undefined : password, {
      onSuccess: () => {
        accountDeleted();
        router.replace('/');
        Alert.alert('Đã xoá tài khoản', 'Cảm ơn bạn đã dùng Zoldify.');
      },
      onError: (e) => setErr(apiErrorMessage(e, 'Chưa xoá được tài khoản. Thử lại nhé.')),
    });
  };

  const onDelete = () => {
    if (!noPassword && !password) {
      setErr('Nhập mật khẩu hiện tại để xác nhận.');
      return;
    }
    setErr('');
    Alert.alert(
      'Xoá tài khoản vĩnh viễn?',
      'Hồ sơ, địa chỉ, giỏ hàng và tin nhắn của bạn sẽ bị xoá. Không khôi phục được.',
      [
        { text: 'Giữ lại', style: 'cancel' },
        { text: 'Xoá tài khoản', style: 'destructive', onPress: run },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <BackChevron onPress={back} />
        <Text variant="title">Xoá tài khoản</Text>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={KEYBOARD_GAP}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.warnBox}>
          <Text style={styles.warnTitle}>Việc này không hoàn tác được</Text>
          <Text style={styles.warnText}>
            Sau khi xoá, bạn không đăng nhập lại bằng tài khoản này được nữa. Đơn đang giao
            dở và tiền còn trong ví cần xử lý xong trước, nếu không hệ thống sẽ từ chối.
          </Text>
        </View>

        {noPassword ? (
          <Text variant="bodyMuted" style={styles.note}>
            Tài khoản của bạn đăng nhập bằng Google, chỉ cần bấm nút bên dưới và xác nhận.
          </Text>
        ) : (
          <TextField
            label="Mật khẩu hiện tại"
            value={password}
            onChangeText={setPassword}
            placeholder="Nhập để xác nhận"
            secure
          />
        )}

        {err ? (
          <View style={styles.errBanner}>
            <Text style={styles.errText}>{err}</Text>
          </View>
        ) : null}
      </KeyboardAwareScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          title={remove.isPending ? 'Đang xoá…' : 'Xoá tài khoản'}
          onPress={onDelete}
          loading={remove.isPending}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surfacePage },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.white,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  body: { padding: 16, gap: 14 },
  note: { lineHeight: 20 },
  warnBox: { backgroundColor: Palette.dangerBg, borderRadius: 4, padding: 12, gap: 4 },
  warnTitle: { color: Palette.dangerFg, fontSize: 14, fontFamily: Font.semibold },
  warnText: { color: Palette.dangerFg, fontSize: 13, lineHeight: 19 },
  errBanner: { backgroundColor: Palette.dangerBg, borderRadius: 4, padding: 12 },
  errText: { color: Palette.dangerFg, fontSize: 13 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.lineStrong,
    backgroundColor: Palette.white,
  },
});
