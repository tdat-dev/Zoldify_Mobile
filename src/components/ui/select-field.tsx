import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { matchesVi } from '@/lib/text';

import { BottomSheet, dismissKeyboardThen } from './bottom-sheet';
import { Text } from './text';
import { Font, Palette, Radius } from './theme';

export interface SelectOption {
  id: string | number;
  name: string;
}

/** Danh sách dài hơn chừng này thì tự có ô tìm (tỉnh 63 dòng, quận, phường). */
const SEARCH_THRESHOLD = 8;

/**
 * Ô chọn dạng hàng bấm → mở modal danh sách (thay dropdown khó bấm trên mobile).
 * Dùng cho danh mục, tỉnh/quận/phường GHN… Rỗng/khoá thì mờ và không mở được.
 *
 * Danh sách dài có ô tìm không dấu ("ha noi" ra "Hà Nội"): trước đây 63 tỉnh
 * không có ô tìm, phải cuộn tìm từng dòng (D-05, E2E 02/11). Thứ tự dòng do nơi
 * gọi quyết định (GHN trả lộn xộn thì nơi gọi sắp A-Z bằng sortByNameVi).
 */
export function SelectField({
  label,
  value,
  placeholder,
  title,
  options,
  onSelect,
  disabled,
  loading,
  error,
  searchable,
}: {
  label?: string;
  /** id đang chọn (để đánh dấu ✓ trong danh sách). */
  value: string | number | null;
  placeholder: string;
  /** Tiêu đề modal; mặc định lấy theo placeholder. */
  title?: string;
  options: SelectOption[];
  onSelect: (id: string | number) => void;
  disabled?: boolean;
  loading?: boolean;
  /** Câu báo lỗi dưới ô (viền đỏ). */
  error?: string;
  /** Ép bật/tắt ô tìm; mặc định bật khi danh sách dài. */
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const selected = options.find((o) => o.id === value) ?? null;
  const withSearch = searchable ?? options.length > SEARCH_THRESHOLD;
  const filtered = withSearch && q ? options.filter((o) => matchesVi(o.name, q)) : options;

  // Đóng là xoá từ khoá; cất bàn phím trước khi đóng (xem BottomSheet).
  const close = () =>
    dismissKeyboardThen(() => {
      setQ('');
      setOpen(false);
    });

  return (
    <View>
      {label ? (
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <Pressable
        style={[styles.row, disabled && styles.rowDisabled, !!error && styles.rowError]}
        disabled={disabled}
        onPress={() => setOpen(true)}>
        <Text variant="body" style={[styles.value, !selected && styles.placeholder]} numberOfLines={1}>
          {selected ? selected.name : placeholder}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color={Palette.inkFaint} />
        ) : (
          <Ionicons name="chevron-forward" size={18} color={Palette.inkFaint} />
        )}
      </Pressable>
      {error ? <Text variant="caption" style={styles.err}>{error}</Text> : null}

      <BottomSheet visible={open} onClose={close} style={styles.sheet}>
        <View style={styles.sheetHead}>
          <Text variant="heading">{title ?? placeholder}</Text>
          <Pressable hitSlop={8} onPress={close} accessibilityLabel="Đóng">
            <Ionicons name="close" size={22} color={Palette.inkMuted} />
          </Pressable>
        </View>
        {withSearch ? (
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={Palette.inkFaint} />
            <TextInput
              style={styles.search}
              value={q}
              onChangeText={setQ}
              placeholder="Tìm nhanh, gõ không dấu cũng được"
              placeholderTextColor={Palette.inkFaint}
              autoCorrect={false}
            />
          </View>
        ) : null}
        <FlatList
          data={filtered}
          keyExtractor={(o) => String(o.id)}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text variant="bodyMuted" style={styles.empty}>
              {q ? 'Không có kết quả.' : 'Không có lựa chọn.'}
            </Text>
          }
          renderItem={({ item: o }) => {
            const on = o.id === value;
            return (
              <Pressable
                style={styles.item}
                onPress={() => {
                  onSelect(o.id);
                  close();
                }}>
                <Text variant="body" style={on ? styles.itemOn : undefined}>{o.name}</Text>
                {on ? <Ionicons name="checkmark" size={18} color={Palette.brand} /> : null}
              </Pressable>
            );
          }}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    backgroundColor: Palette.white,
  },
  rowDisabled: { backgroundColor: Palette.surfaceSunken, opacity: 0.7 },
  rowError: { borderColor: Palette.dangerFg },
  value: { flex: 1, marginRight: 8 },
  placeholder: { color: Palette.inkFaint },
  err: { color: Palette.dangerFg, marginTop: 6 },
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.lineStrong,
  },
  search: { flex: 1, fontFamily: Font.regular, fontSize: 14, color: Palette.ink, paddingVertical: 0 },
  // Co theo chỗ trống phía trên bàn phím, ô tìm và tiêu đề luôn còn thấy.
  list: { paddingHorizontal: 16, flexGrow: 0, flexShrink: 1 },
  empty: { padding: 16, textAlign: 'center' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  itemOn: { fontFamily: Font.semibold, color: Palette.brand },
});
