import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackChevron } from '@/components/ui/back-chevron';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Palette } from '@/components/ui/theme';
import { useChangePassword } from '@/features/auth/api';

/** Đổi mật khẩu khi đang đăng nhập — /auth/change-password. */
export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const change = useChangePassword();

  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const newValid = newPw.length >= 6;
  const confirmValid = confirm.length > 0 && confirm === newPw;
  const confirmError = confirm.length > 0 && confirm !== newPw ? 'Mật khẩu nhập lại không khớp' : undefined;

  const onSave = () => {
    if (!oldPw) return setErr('Nhập mật khẩu hiện tại.');
    if (!newValid) return setErr('Mật khẩu mới tối thiểu 6 ký tự.');
    if (!confirmValid) return setErr('Mật khẩu nhập lại không khớp.');
    setErr('');
    change.mutate(
      { oldPassword: oldPw, newPassword: newPw },
      {
        onSuccess: () => {
          setOk(true);
          setTimeout(back, 900);
        },
        onError: () => setErr('Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu hiện tại.'),
      },
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <BackChevron onPress={back} />
        <Text variant="title">Đổi mật khẩu</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TextField label="Mật khẩu hiện tại" value={oldPw} onChangeText={setOldPw} placeholder="Mật khẩu đang dùng" secure />
        <TextField
          label="Mật khẩu mới"
          value={newPw}
          onChangeText={setNewPw}
          placeholder="Tối thiểu 6 ký tự"
          secure
          valid={newValid}
          hint="Tối thiểu 6 ký tự"
        />
        <TextField
          label="Nhập lại mật khẩu mới"
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Gõ lại mật khẩu mới"
          secure
          valid={confirmValid}
          error={confirmError}
        />

        {ok ? (
          <View style={styles.okBanner}><Text style={styles.okText}>Đổi mật khẩu thành công!</Text></View>
        ) : err ? (
          <View style={styles.errBanner}><Text style={styles.errText}>{err}</Text></View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          title={change.isPending ? 'Đang đổi…' : 'Đổi mật khẩu'}
          onPress={onSave}
          loading={change.isPending}
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
  okBanner: { backgroundColor: Palette.successBg, borderRadius: 4, padding: 12 },
  okText: { color: Palette.successFg, fontSize: 13 },
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
