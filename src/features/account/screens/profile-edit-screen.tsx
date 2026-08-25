import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { BackChevron } from '@/components/ui/back-chevron';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Font, Palette } from '@/components/ui/theme';
import { authApi, authKeys, useUpdateProfile, type ProfileUser } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';
import { uploadImage } from '@/lib/upload';

const GENDERS = ['Nam', 'Nữ', 'Khác'];

/** Sửa hồ sơ cá nhân — avatar, tên, SĐT, giới tính (giống "Sửa hồ sơ" Shopee). */
export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const update = useUpdateProfile();

  const { data: profile, isPending } = useQuery({
    queryKey: authKeys.profile(),
    queryFn: () => authApi.profile() as Promise<ProfileUser>,
  });

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');

  // Điền sẵn khi profile về (chỉ một lần — state rỗng ban đầu).
  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name ?? '');
    setPhone(profile.phone_number ?? '');
    setGender(profile.gender ?? '');
    setAvatar(profile.avatar ?? null);
  }, [profile]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setErr('Cần quyền truy cập ảnh để đổi avatar.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (res.canceled || !res.assets?.[0]) return;
    setErr('');
    setUploading(true);
    try {
      const url = await uploadImage(res.assets[0].uri, 'avatars');
      setAvatar(url);
    } catch {
      setErr('Tải ảnh lên thất bại. Thử lại nhé.');
    } finally {
      setUploading(false);
    }
  };

  const onSave = () => {
    if (!name.trim()) {
      setErr('Tên không được để trống.');
      return;
    }
    setErr('');
    update.mutate(
      {
        full_name: name.trim(),
        phone_number: phone.trim(),
        gender,
        ...(avatar ? { avatar } : {}),
      },
      {
        onSuccess: async () => {
          await refreshProfile();
          back();
        },
        onError: () => setErr('Lưu hồ sơ thất bại. Thử lại nhé.'),
      },
    );
  };

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <BackChevron onPress={back} />
      <Text variant="title">Sửa hồ sơ</Text>
    </View>
  );

  if (isPending) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.center}><ActivityIndicator size="large" color={Palette.brand} /></View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {header}
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.avatarWrap} onPress={pickAvatar} disabled={uploading}>
          <Avatar name={name} uri={avatar} size={96} />
          <View style={styles.avatarEdit}>
            <Text style={styles.avatarEditText}>{uploading ? 'Đang tải…' : 'Đổi ảnh'}</Text>
          </View>
        </Pressable>

        <TextField label="Họ và tên" value={name} onChangeText={setName} placeholder="Tên hiển thị" />
        <TextField
          label="Số điện thoại"
          value={phone}
          onChangeText={setPhone}
          placeholder="090…"
          keyboardType="phone-pad"
        />

        <View>
          <Text variant="label" style={styles.label}>Giới tính</Text>
          <View style={styles.genderRow}>
            {GENDERS.map((g) => {
              const on = gender === g;
              return (
                <Pressable
                  key={g}
                  style={[styles.genderChip, on && styles.genderOn]}
                  onPress={() => setGender(on ? '' : g)}>
                  <Text style={[styles.genderText, on && styles.genderTextOn]}>{g}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.emailRow}>
          <Text variant="label" style={styles.label}>Email</Text>
          <Text variant="body" style={styles.emailValue}>{profile?.email}</Text>
        </View>

        {err ? (
          <View style={styles.errBanner}><Text style={styles.errText}>{err}</Text></View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          title={update.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
          onPress={onSave}
          loading={update.isPending}
          disabled={uploading}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  body: { padding: 16, gap: 16 },
  avatarWrap: { alignSelf: 'center', alignItems: 'center', gap: 8 },
  avatarEdit: {},
  avatarEditText: { fontFamily: Font.semibold, fontSize: 13, color: Palette.brand },
  label: { marginBottom: 8 },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    backgroundColor: Palette.white,
  },
  genderOn: { borderColor: Palette.brand, backgroundColor: Palette.brandTint },
  genderText: { fontFamily: Font.medium, fontSize: 14, color: Palette.ink },
  genderTextOn: { color: Palette.brand, fontFamily: Font.semibold },
  emailRow: { gap: 4 },
  emailValue: { color: Palette.inkMuted },
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
