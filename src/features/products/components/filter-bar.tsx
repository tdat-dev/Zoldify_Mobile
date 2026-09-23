import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Font, Palette, Radius } from '@/components/ui/theme';
import {
  CONDITION_LABEL,
  CONDITION_ORDER,
  SORT_OPTIONS,
  countActiveFilters,
  isDefaultQuery,
  type ProductQuery,
} from '@/features/products/filters';
import { PRICE_SCOPES } from '@/features/products/price-scopes';

/** Một "viên" chip chọn — phẳng 4px, bật thì viền + nền brand nhạt. */
function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, on && styles.chipOn]} onPress={onPress}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

/**
 * Thanh Sắp xếp / Lọc dùng chung cho Search + Category. Tự giữ sheet; màn ngoài
 * chỉ truyền `value` + `onChange`. Sheet dùng bản nháp, chỉ ghi ra khi bấm "Áp dụng"
 * để người dùng đổi nhiều thứ rồi mới chạy lại API một lần.
 */
export function FilterBar({
  value,
  onChange,
}: {
  value: ProductQuery;
  onChange: (next: ProductQuery) => void;
}) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ProductQuery>(value);

  const activeCount = countActiveFilters(value);
  const sortLabel = SORT_OPTIONS.find((s) => s.value === value.sort)?.label ?? 'Mới nhất';

  const openSheet = () => {
    setDraft(value);
    setOpen(true);
  };
  const apply = () => {
    onChange(draft);
    setOpen(false);
  };
  const reset = () => setDraft({ sort: 'newest' });

  const setPrice = (min?: number, max?: number) => {
    // Bấm lại tầm tiền đang chọn = bỏ chọn về "Mọi giá".
    const same = draft.price_min === min && draft.price_max === max;
    setDraft((d) => ({ ...d, price_min: same ? undefined : min, price_max: same ? undefined : max }));
  };
  const setCondition = (c?: string) =>
    setDraft((d) => ({ ...d, condition: d.condition === c ? undefined : c }));

  return (
    <>
      <View style={styles.bar}>
        <Pressable style={styles.trigger} onPress={openSheet}>
          <Ionicons name="swap-vertical" size={16} color={Palette.ink} />
          <Text style={styles.triggerText} numberOfLines={1}>{sortLabel}</Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable style={styles.trigger} onPress={openSheet}>
          <Ionicons name="options-outline" size={16} color={activeCount ? Palette.brand : Palette.ink} />
          <Text style={[styles.triggerText, activeCount ? styles.triggerTextOn : null]}>Lọc</Text>
          {activeCount ? (
            <View style={styles.badge}><Text style={styles.badgeText}>{activeCount}</Text></View>
          ) : null}
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.sheetHead}>
            <Text variant="heading">Sắp xếp & Lọc</Text>
            <Pressable hitSlop={8} onPress={() => setOpen(false)} accessibilityLabel="Đóng">
              <Ionicons name="close" size={22} color={Palette.inkMuted} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text variant="label" style={styles.section}>Sắp xếp</Text>
            <View style={styles.sortList}>
              {SORT_OPTIONS.map((s) => {
                const on = draft.sort === s.value;
                return (
                  <Pressable key={s.value} style={styles.sortRow} onPress={() => setDraft((d) => ({ ...d, sort: s.value }))}>
                    <Text variant="body" style={on ? styles.sortOn : undefined}>{s.label}</Text>
                    {on ? <Ionicons name="checkmark" size={18} color={Palette.brand} /> : null}
                  </Pressable>
                );
              })}
            </View>

            <Text variant="label" style={styles.section}>Tầm tiền</Text>
            <View style={styles.chips}>
              {PRICE_SCOPES.map((p) => (
                <Chip
                  key={p.key}
                  label={p.label}
                  on={
                    p.key === 'any'
                      ? draft.price_min == null && draft.price_max == null
                      : draft.price_min === p.price_min && draft.price_max === p.price_max
                  }
                  onPress={() =>
                    p.key === 'any'
                      ? setDraft((d) => ({ ...d, price_min: undefined, price_max: undefined }))
                      : setPrice(p.price_min, p.price_max)
                  }
                />
              ))}
            </View>

            <Text variant="label" style={styles.section}>Tình trạng</Text>
            <View style={styles.chips}>
              <Chip label="Tất cả" on={!draft.condition} onPress={() => setDraft((d) => ({ ...d, condition: undefined }))} />
              {CONDITION_ORDER.map((c) => (
                <Chip key={c} label={CONDITION_LABEL[c]} on={draft.condition === c} onPress={() => setCondition(c)} />
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.footerBtn}>
              <Button
                title="Xoá lọc"
                variant="secondary"
                onPress={reset}
                disabled={isDefaultQuery(draft)}
              />
            </View>
            <View style={styles.footerBtn}>
              <Button title="Áp dụng" onPress={apply} />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  trigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
  },
  triggerText: { fontFamily: Font.medium, fontSize: 13.5, color: Palette.ink },
  triggerTextOn: { color: Palette.brand, fontFamily: Font.semibold },
  divider: { width: 1, height: 20, backgroundColor: Palette.line },
  badge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: Radius.control,
    backgroundColor: Palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: Font.bold, fontSize: 11, color: Palette.white },
  backdrop: { flex: 1, backgroundColor: 'rgba(25,32,41,0.4)' },
  sheet: {
    backgroundColor: Palette.white,
    borderTopLeftRadius: Radius.modal,
    borderTopRightRadius: Radius.modal,
    maxHeight: '80%',
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  body: { paddingHorizontal: 16 },
  section: { marginTop: 16, marginBottom: 10 },
  sortList: { gap: 2 },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  sortOn: { fontFamily: Font.semibold, color: Palette.brand },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    backgroundColor: Palette.white,
  },
  chipOn: { borderColor: Palette.brand, backgroundColor: Palette.brandTint },
  chipText: { fontFamily: Font.medium, fontSize: 13, color: Palette.ink },
  chipTextOn: { color: Palette.brand, fontFamily: Font.semibold },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  footerBtn: { flex: 1 },
});
