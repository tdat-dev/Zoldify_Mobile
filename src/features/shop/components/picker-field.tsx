import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';

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
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const filtered = q
    ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))
    : options;

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

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
            <View style={styles.sheetHeader}>
              <Text variant="heading">{label}</Text>
              <Pressable hitSlop={10} onPress={() => setOpen(false)}>
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
                keyboardShouldPersistTaps="handled"
                ItemSeparatorComponent={() => <View style={styles.sep} />}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.row}
                    onPress={() => {
                      onSelect(item);
                      setQ('');
                      setOpen(false);
                    }}>
                    <Text variant="body">{item.label}</Text>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text variant="bodyMuted" style={styles.empty}>Không có kết quả.</Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>
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

  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: Radius.modal,
    borderTopRightRadius: Radius.modal,
    maxHeight: '80%',
    paddingTop: 12,
  },
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
