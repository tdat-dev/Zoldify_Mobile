import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from './text';
import { Font, Palette, Radius } from './theme';

export interface SelectOption {
  id: string | number;
  name: string;
}

/**
 * Ô chọn dạng hàng bấm → mở modal danh sách (thay dropdown khó bấm trên mobile).
 * Dùng cho danh mục, tỉnh/quận/phường GHN… Rỗng/khoá thì mờ và không mở được.
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
}) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find((o) => o.id === value) ?? null;

  return (
    <View>
      {label ? (
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <Pressable
        style={[styles.row, disabled && styles.rowDisabled]}
        disabled={disabled}
        onPress={() => setOpen(true)}>
        <Text variant="body" style={selected ? undefined : styles.placeholder} numberOfLines={1}>
          {selected ? selected.name : placeholder}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color={Palette.inkFaint} />
        ) : (
          <Ionicons name="chevron-forward" size={18} color={Palette.inkFaint} />
        )}
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.sheetHead}>
            <Text variant="heading">{title ?? placeholder}</Text>
            <Pressable hitSlop={8} onPress={() => setOpen(false)} accessibilityLabel="Đóng">
              <Ionicons name="close" size={22} color={Palette.inkMuted} />
            </Pressable>
          </View>
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {options.length === 0 ? (
              <Text variant="bodyMuted" style={styles.empty}>Không có lựa chọn.</Text>
            ) : (
              options.map((o) => {
                const on = o.id === value;
                return (
                  <Pressable
                    key={String(o.id)}
                    style={styles.item}
                    onPress={() => {
                      onSelect(o.id);
                      setOpen(false);
                    }}>
                    <Text variant="body" style={on ? styles.itemOn : undefined}>{o.name}</Text>
                    {on ? <Ionicons name="checkmark" size={18} color={Palette.brand} /> : null}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>
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
  placeholder: { color: Palette.inkFaint },
  backdrop: { flex: 1, backgroundColor: 'rgba(25,32,41,0.4)' },
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
  list: { paddingHorizontal: 16 },
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
