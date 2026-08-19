import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useCreateProduct } from '@/features/products/api';
import { useCategories } from '@/features/categories/api';
import { useAuthStore } from '@/features/auth/store';
import { TabPlaceholder } from '@/features/shared/tab-placeholder';
import { uploadImage } from '@/lib/upload';

const CONDITIONS = [
  { value: 'new', label: 'Mới' },
  { value: 'like_new', label: 'Như mới' },
  { value: 'good', label: 'Tốt' },
  { value: 'fair', label: 'Khá' },
  { value: 'used', label: 'Đã dùng' },
];

/** Đăng bán: khách -> mời đăng nhập; đã đăng nhập -> form tạo sản phẩm thật. */
export default function SellScreen() {
  const insets = useSafeAreaInsets();
  const guest = useAuthStore((s) => s.status) !== 'signedIn';
  const { data: categories } = useCategories();
  const create = useCreateProduct();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [condition, setCondition] = useState('new');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; price?: string; category?: string }>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (guest) {
    return <TabPlaceholder title="Đăng bán" note="Đăng nhập để đăng bán món của bạn." />;
  }

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) setImageUri(res.assets[0].uri);
  };

  const validate = () => {
    const next: typeof errors = {};
    if (name.trim().length < 3) next.name = 'Nhập tên món (từ 3 ký tự).';
    if (!(Number(price) > 0)) next.price = 'Nhập giá hợp lệ.';
    if (!categoryId) next.category = 'Chọn một danh mục.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async () => {
    setErrorMsg(null);
    if (!validate()) return;
    try {
      setBusy(true);
      let image: string | undefined;
      if (imageUri) image = await uploadImage(imageUri);
      const product = await create.mutateAsync({
        name: name.trim(),
        price: Number(price),
        category_id: categoryId!,
        condition,
        image,
        description: description.trim() || undefined,
      });
      router.push({ pathname: '/products/[id]', params: { id: product.id } });
    } catch (e) {
      // Hiện đúng thông báo của backend (vd cần cài địa chỉ lấy hàng).
      const msg = (e as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
      setErrorMsg(typeof msg === 'string' ? msg : 'Đăng bán chưa được. Thử lại nhé.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text variant="title">Đăng bán</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Pressable style={styles.imageBox} onPress={pickImage}>
          {imageUri ? (
            <Image source={imageUri} style={styles.imagePreview} contentFit="cover" />
          ) : (
            <View style={styles.imageEmpty}>
              <View style={styles.plusV} />
              <View style={styles.plusH} />
              <Text variant="caption" style={styles.imageHint}>Thêm ảnh</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.form}>
          <TextField label="Tên món" value={name} onChangeText={setName} placeholder="VD: Áo khoác gió Uniqlo" error={errors.name} />
          <TextField label="Giá (đ)" value={price} onChangeText={setPrice} placeholder="150000" keyboardType="number-pad" error={errors.price} />

          <View>
            <Text variant="label" style={styles.fieldLabel}>Danh mục</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {(categories ?? []).map((c) => {
                const on = categoryId === c.id;
                return (
                  <Pressable key={c.id} onPress={() => setCategoryId(c.id)} style={[styles.chip, on && styles.chipOn]}>
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {errors.category ? <Text variant="caption" style={styles.err}>{errors.category}</Text> : null}
          </View>

          <View>
            <Text variant="label" style={styles.fieldLabel}>Tình trạng</Text>
            <View style={styles.chipsWrap}>
              {CONDITIONS.map((c) => {
                const on = condition === c.value;
                return (
                  <Pressable key={c.value} onPress={() => setCondition(c.value)} style={[styles.chip, on && styles.chipOn]}>
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <TextField
            label="Mô tả"
            value={description}
            onChangeText={setDescription}
            placeholder="Mô tả tình trạng, lý do bán…"
            multiline
            numberOfLines={4}
            style={styles.multiline}
          />

          {errorMsg ? <Text variant="caption" style={styles.err}>{errorMsg}</Text> : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          title={busy ? 'Đang đăng…' : 'Đăng bán'}
          onPress={onSubmit}
          loading={busy || create.isPending}
          disabled={busy}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surfacePage },
  header: {
    backgroundColor: Palette.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  body: { padding: 16, gap: 16 },
  imageBox: {
    aspectRatio: 1.4,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    borderStyle: 'dashed',
    backgroundColor: Palette.white,
    overflow: 'hidden',
  },
  imagePreview: { width: '100%', height: '100%' },
  imageEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  plusV: { position: 'absolute', width: 3, height: 26, borderRadius: 2, backgroundColor: Palette.inkFaint, marginBottom: 22 },
  plusH: { position: 'absolute', width: 26, height: 3, borderRadius: 2, backgroundColor: Palette.inkFaint, marginBottom: 22 },
  imageHint: { marginTop: 40 },
  form: { gap: 16 },
  fieldLabel: { marginBottom: 8 },
  chips: { gap: 8, paddingRight: 4 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    backgroundColor: Palette.white,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipOn: { borderColor: Palette.brand, backgroundColor: Palette.brandTint },
  chipText: { fontFamily: Font.medium, fontSize: 13, color: Palette.ink },
  chipTextOn: { color: Palette.brand, fontFamily: Font.semibold },
  multiline: { minHeight: 96, textAlignVertical: 'top', paddingTop: 10 },
  err: { color: Palette.dangerFg, marginTop: 6 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
    backgroundColor: Palette.white,
  },
});
