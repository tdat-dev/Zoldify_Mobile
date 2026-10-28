import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { BottomSheet, dismissKeyboardThen } from '@/components/ui/bottom-sheet';
import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';

/**
 * Bỏ dấu để so: gõ "ha" phải ra "Hà Nội", "thanh hoa" ra "Thanh Hóa". Trước
 * đây so nguyên chữ có dấu nên gõ không dấu (cách gõ nhanh phổ biến) không ra
 * kết quả nào đúng (28/10). Đ/đ không tách được bằng NFD nên đổi tay.
 */
function boDau(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export interface Option {
  key: string | number;
  label: string;
}

interface Props {
  label: string;
  value?: string;
  placeholder: string;
  options: Option[];
  loading?: boolean;
  disabled?: boolean;
  error?: string;
  onSelect: (o: Option) => void;
}

/** Ô chọn mở modal danh sách có tìm kiếm — dùng cho tỉnh/quận/phường. */
export function PickerField({
  label,
  value,
  placeholder,
  options,
  loading,
  disabled,
  error,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  // Đóng là xoá từ khoá: mở lại không thấy danh sách vẫn đang lọc dở.
  // Cất bàn phím TRƯỚC khi đóng: đóng Modal giữa lúc bàn phím còn mở làm bảng
  // kế tiếp (Quận -> Phường) mở ra lơ lửng (xem BottomSheet).
  const close = () =>
    dismissKeyboardThen(() => {
      setQ('');
      setOpen(false);
    });

  const needle = boDau(q);
  const filtered = needle ? options.filter((o) => boDau(o.label).includes(needle)) : options;

  return (
    <View>
      <Text variant="label" style={styles.label}>{label}</Text>
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.field, disabled && styles.disabled, !!error && styles.fieldError]}>
        <Text style={value ? styles.value : styles.placeholder} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Text style={styles.caret}>▾</Text>
      </Pressable>
      {error ? <Text variant="caption" style={styles.err}>{error}</Text> : null}

      <BottomSheet visible={open} onClose={close} style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text variant="heading">{label}</Text>
              <Pressable hitSlop={10} onPress={close} accessibilityLabel="Đóng">
                <Text style={styles.close}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.searchBox}>
              <TextInput
                style={styles.search}
                value={q}
                onChangeText={setQ}
                placeholder="Tìm nhanh…"
                placeholderTextColor={Palette.inkFaint}
                autoCorrect={false}
              />
            </View>

            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator color={Palette.brand} />
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(o) => String(o.key)}
                style={styles.list}
                keyboardShouldPersistTaps="handled"
                ItemSeparatorComponent={() => <View style={styles.sep} />}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.row}
                    onPress={() => {
                      onSelect(item);
                      close();
                    }}>
                    <Text variant="body">{item.label}</Text>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text variant="bodyMuted" style={styles.empty}>Không có kết quả.</Text>
                }
              />
            )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    backgroundColor: Palette.white,
    paddingHorizontal: 14,
  },
  disabled: { opacity: 0.5 },
  fieldError: { borderColor: Palette.dangerFg },
  value: { flex: 1, fontFamily: Font.regular, fontSize: 14, color: Palette.ink },
  placeholder: { flex: 1, fontFamily: Font.regular, fontSize: 14, color: Palette.inkFaint },
  caret: { fontFamily: Font.regular, fontSize: 14, color: Palette.inkMuted, marginLeft: 8 },
  err: { color: Palette.dangerFg, marginTop: 6 },

  sheet: { paddingTop: 12 },
  // Co theo chỗ trống phía trên bàn phím, ô tìm kiếm và tiêu đề luôn còn thấy.
  list: { flexGrow: 0, flexShrink: 1 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  close: { fontFamily: Font.medium, fontSize: 18, color: Palette.inkMuted },
  searchBox: { paddingHorizontal: 16, paddingBottom: 8 },
  search: {
    height: 44,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    paddingHorizontal: 14,
    fontFamily: Font.regular,
    fontSize: 14,
    color: Palette.ink,
  },
  loading: { padding: 32, alignItems: 'center' },
  row: { paddingVertical: 14, paddingHorizontal: 16 },
  sep: { height: 1, backgroundColor: Palette.line },
  empty: { padding: 24, textAlign: 'center' },
});
