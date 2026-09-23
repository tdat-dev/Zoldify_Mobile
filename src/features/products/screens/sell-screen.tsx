import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { KEYBOARD_GAP } from '@/components/ui/screen';
import { PhotoUploadGrid } from '@/components/ui/photo-upload-grid';
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

const DESC_MAX = 1000;

/** Đăng bán: khách -> mời đăng nhập; đã đăng nhập -> form tạo sản phẩm thật. */
export default function SellScreen() {
  const insets = useSafeAreaInsets();
  const guest = useAuthStore((s) => s.status) !== 'signedIn';
  const { data: categories } = useCategories();
  const create = useCreateProduct();

  const [images, setImages] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [condition, setCondition] = useState('new');
  const [description, setDescription] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; price?: string; category?: string; images?: string }>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (guest) {
    return <TabPlaceholder title="Đăng bán" note="Đăng nhập để đăng bán món của bạn." />;
  }

  const selectedCategory = categories?.find((c) => c.id === categoryId) ?? null;

  const validate = () => {
    const next: typeof errors = {};
    if (images.length === 0) next.images = 'Thêm ít nhất 1 ảnh.';
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
      // Upload lần lượt từng ảnh -> mảng path server. Ảnh đầu là ảnh bìa (image)
      // để feed cũ vẫn hiện đúng; gửi cả `images` cho gallery chi tiết.
      const uploaded: string[] = [];
      for (const uri of images) uploaded.push(await uploadImage(uri));
      const product = await create.mutateAsync({
        name: name.trim(),
        price: Number(price),
        stock: Math.max(1, Number(stock) || 1),
        category_id: categoryId!,
        condition,
        image: uploaded[0],
        images: uploaded,
        brand: brand.trim() || undefined,
        spec: size.trim() || undefined,
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

      <KeyboardAwareScrollView
        bottomOffset={KEYBOARD_GAP}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View>
          <Text variant="label" style={styles.fieldLabel}>Ảnh món ({images.length}/10)</Text>
          <PhotoUploadGrid value={images} onChange={setImages} max={10} />
          {errors.images ? <Text variant="caption" style={styles.err}>{errors.images}</Text> : null}
        </View>

        <View style={styles.form}>
          <TextField label="Tên món" value={name} onChangeText={setName} placeholder="VD: Áo khoác gió Uniqlo" error={errors.name} />

          <View>
            <View style={styles.twoCol}>
              <View style={styles.col}>
                <TextField label="Giá (đ)" value={price} onChangeText={setPrice} placeholder="150000" keyboardType="number-pad" error={errors.price} />
              </View>
              <View style={styles.col}>
                <TextField label="Số lượng" value={stock} onChangeText={(t) => setStock(t.replace(/[^0-9]/g, ''))} placeholder="1" keyboardType="number-pad" />
              </View>
            </View>
            {!errors.price ? (
              <Text variant="caption" style={styles.hint}>
                Đồ cũ thường 1 món; hàng mới nhập đúng số lượng bạn có.
              </Text>
            ) : null}
          </View>

          <View style={styles.twoCol}>
            <View style={styles.col}>
              <TextField label="Thương hiệu" value={brand} onChangeText={setBrand} placeholder="VD: Uniqlo" />
            </View>
            <View style={styles.col}>
              <TextField label="Size / Phân loại" value={size} onChangeText={setSize} placeholder="VD: M, 40, 128GB" />
            </View>
          </View>

          {/* Danh mục: hàng bấm mở picker (thay chip cuộn ngang giấu lựa chọn). */}
          <View>
            <Text variant="label" style={styles.fieldLabel}>Danh mục</Text>
            <Pressable style={styles.pickerRow} onPress={() => setPickerOpen(true)}>
              <Text variant="body" style={selectedCategory ? undefined : styles.pickerPlaceholder}>
                {selectedCategory ? selectedCategory.name : 'Chọn danh mục'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={Palette.inkFaint} />
            </Pressable>
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

          <View>
            <TextField
              label="Mô tả"
              value={description}
              onChangeText={(t) => setDescription(t.slice(0, DESC_MAX))}
              placeholder="Mô tả tình trạng, thời gian dùng, lý do bán…"
              multiline
              numberOfLines={4}
              style={styles.multiline}
            />
            <Text variant="caption" style={styles.count}>
              {description.length}/{DESC_MAX}
            </Text>
          </View>

          {errorMsg ? (
            <View style={styles.errBox}>
              <Text variant="caption" style={styles.err}>{errorMsg}</Text>
              <Button
                title="Cài đặt shop"
                variant="secondary"
                onPress={() => router.push('/shop/settings')}
              />
            </View>
          ) : null}
        </View>
      </KeyboardAwareScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          title={busy ? 'Đang đăng…' : 'Đăng bán'}
          onPress={onSubmit}
          loading={busy || create.isPending}
          disabled={busy}
        />
      </View>

      {/* Picker danh mục — modal trượt từ đáy, danh sách đầy đủ. */}
      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setPickerOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.sheetHead}>
            <Text variant="heading">Chọn danh mục</Text>
            <Pressable hitSlop={8} onPress={() => setPickerOpen(false)}>
              <Ionicons name="close" size={22} color={Palette.inkMuted} />
            </Pressable>
          </View>
          <ScrollView style={styles.sheetList}>
            {(categories ?? []).map((c) => {
              const on = categoryId === c.id;
              return (
                <Pressable
                  key={c.id}
                  style={styles.sheetRow}
                  onPress={() => {
                    setCategoryId(c.id);
                    setPickerOpen(false);
                  }}>
                  <Text variant="body" style={on ? styles.sheetRowOn : undefined}>{c.name}</Text>
                  {on ? <Ionicons name="checkmark" size={18} color={Palette.brand} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
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
  form: { gap: 16 },
  fieldLabel: { marginBottom: 8 },
  hint: { marginTop: 6, color: Palette.inkFaint },
  twoCol: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: 14,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    backgroundColor: Palette.white,
  },
  pickerPlaceholder: { color: Palette.inkFaint },
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
  count: { marginTop: 6, textAlign: 'right', color: Palette.inkFaint },
  err: { color: Palette.dangerFg, marginTop: 6 },
  errBox: { gap: 10 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
    backgroundColor: Palette.white,
  },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(25,32,41,0.4)' },
  sheet: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: Radius.modal,
    borderTopRightRadius: Radius.modal,
    maxHeight: '70%',
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  sheetList: { paddingHorizontal: 16 },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  sheetRowOn: { fontFamily: Font.semibold, color: Palette.brand },
});
