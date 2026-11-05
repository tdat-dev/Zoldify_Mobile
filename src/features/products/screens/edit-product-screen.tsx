import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackChevron } from '@/components/ui/back-chevron';
import { Button } from '@/components/ui/button';
import { KEYBOARD_GAP } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Font, Palette, Radius } from '@/components/ui/theme';
import { useAuthStore } from '@/features/auth/store';
import {
  useDeleteProduct,
  useProduct,
  useUpdateProduct,
  useUpdateProductStock,
} from '@/features/products/api';
import { CONDITION_LABEL } from '@/features/products/filters';
import { apiErrorMessage } from '@/lib/api/error-message';

const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'used'];
const DESC_MAX = 1000;

/**
 * Người bán sửa món của mình trên app (D-22, E2E 02/11: trước đây mở món của
 * mình chỉ thấy nút mua). Sửa tên, giá, số lượng, thương hiệu, thông số, tình
 * trạng, mô tả; xoá món. Ảnh và danh mục sửa trên web.
 */
export default function EditProductScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);
  const me = useAuthStore((s) => s.user);
  const { data: product, isPending, isError, refetch } = useProduct(productId);
  const update = useUpdateProduct(productId);
  const updateStock = useUpdateProductStock(productId);
  const remove = useDeleteProduct();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [brand, setBrand] = useState('');
  const [spec, setSpec] = useState('');
  const [condition, setCondition] = useState('new');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ name?: string; price?: string; stock?: string }>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState<number | null>(null);

  // Nạp dữ liệu món vào form một lần (không đè lên chữ người bán đang sửa).
  // Làm ngay lúc render (mẫu "chỉnh state khi prop đổi" của React), không
  // setState trong effect.
  if (product && loadedId !== product.id) {
    setName(product.name ?? '');
    setPrice(String(Math.round(Number(product.price) || 0)));
    setStock(String(product.stock ?? 0));
    setBrand(product.brand ?? '');
    setSpec(product.spec ?? '');
    setCondition(product.condition || 'new');
    setDescription(product.description ?? '');
    setLoadedId(product.id);
  }

  const back = () => (router.canGoBack() ? router.back() : router.replace('/account'));
  const busy = update.isPending || updateStock.isPending || remove.isPending;
  const isOwner = !!product && product.seller?.id === me?.id;

  const onSave = async () => {
    if (!product) return;
    const next: typeof errors = {};
    if (name.trim().length < 3) next.name = 'Nhập tên món (từ 3 ký tự).';
    if (!(Number(price) > 0)) next.price = 'Nhập giá hợp lệ.';
    if (stock === '' || !Number.isInteger(Number(stock))) next.stock = 'Nhập số lượng.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setErrorMsg(null);
    try {
      await update.mutateAsync({
        name: name.trim(),
        price: Number(price),
        brand: brand.trim() || undefined,
        spec: spec.trim() || undefined,
        condition,
        description: description.trim() || undefined,
      });
      if (Number(stock) !== product.stock) await updateStock.mutateAsync(Number(stock));
      back();
    } catch (e) {
      setErrorMsg(apiErrorMessage(e, 'Chưa lưu được. Thử lại nhé.'));
    }
  };

  const onDelete = () => {
    Alert.alert('Xoá món này?', 'Món sẽ không còn hiện trên Zoldify nữa.', [
      { text: 'Giữ lại', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: () =>
          remove.mutate(productId, {
            onSuccess: () => router.replace('/account'),
            onError: (e) => setErrorMsg(apiErrorMessage(e, 'Chưa xoá được. Thử lại nhé.')),
          }),
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <BackChevron onPress={back} />
        <Text variant="title">Sửa món</Text>
      </View>

      {isPending ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Palette.brand} /></View>
      ) : isError || !product ? (
        <View style={styles.center}>
          <Text variant="heading">Không tải được món này</Text>
          <Button title="Thử lại" variant="secondary" onPress={() => refetch()} />
        </View>
      ) : !isOwner ? (
        <View style={styles.center}>
          <Text variant="bodyMuted">Bạn chỉ sửa được món của chính mình.</Text>
        </View>
      ) : (
        <>
          <KeyboardAwareScrollView
            bottomOffset={KEYBOARD_GAP}
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <TextField label="Tên món" value={name} onChangeText={setName} error={errors.name} />
            <View style={styles.twoCol}>
              <View style={styles.col}>
                <TextField
                  label="Giá (đ)"
                  value={price}
                  onChangeText={(t) => setPrice(t.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  error={errors.price}
                />
              </View>
              <View style={styles.col}>
                <TextField
                  label="Số lượng"
                  value={stock}
                  onChangeText={(t) => setStock(t.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  error={errors.stock}
                />
              </View>
            </View>
            <View style={styles.twoCol}>
              <View style={styles.col}>
                <TextField label="Thương hiệu" value={brand} onChangeText={setBrand} />
              </View>
              <View style={styles.col}>
                <TextField label="Size / Phân loại" value={spec} onChangeText={setSpec} />
              </View>
            </View>

            <View>
              <Text variant="label" style={styles.fieldLabel}>Tình trạng</Text>
              <View style={styles.chipsWrap}>
                {CONDITIONS.map((c) => {
                  const on = condition === c;
                  return (
                    <Pressable key={c} onPress={() => setCondition(c)} style={[styles.chip, on && styles.chipOn]}>
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>{CONDITION_LABEL[c] ?? c}</Text>
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
                multiline
                numberOfLines={4}
                style={styles.multiline}
              />
              <Text variant="caption" style={styles.count}>{description.length}/{DESC_MAX}</Text>
            </View>

            <Text variant="caption" style={styles.hint}>Đổi ảnh và danh mục trên trang web Zoldify.</Text>

            {errorMsg ? <Text variant="caption" style={styles.err}>{errorMsg}</Text> : null}

            <Button title="Xoá món" variant="ghost" onPress={onDelete} disabled={busy} />
          </KeyboardAwareScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            <Button title="Lưu thay đổi" onPress={onSave} loading={update.isPending || updateStock.isPending} disabled={busy} />
          </View>
        </>
      )}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  body: { padding: 16, gap: 16 },
  twoCol: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  fieldLabel: { marginBottom: 8 },
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
  hint: { color: Palette.inkFaint },
  err: { color: Palette.dangerFg },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
    backgroundColor: Palette.white,
  },
});
