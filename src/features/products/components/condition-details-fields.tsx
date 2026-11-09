import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Font, Palette, Radius } from '@/components/ui/theme';
import {
  LIMITS,
  type DurabilityError,
  type DurabilityForm,
} from '@/features/products/condition-details';

/**
 * Các ô "Độ bền" ở màn Đăng bán và Sửa tin, cùng nội dung với web
 * (`ConditionDetailsFields.tsx`). Mọi ô tuỳ chọn; ô pin chỉ hiện ở danh mục có
 * pin vì server trả 400 khi áo hay chảo khai pin.
 */
export function ConditionDetailsFields({
  value,
  onChange,
  withBattery,
  errors = [],
}: {
  value: DurabilityForm;
  onChange: (next: DurabilityForm) => void;
  withBattery: boolean;
  errors?: DurabilityError[];
}) {
  const set = <K extends keyof DurabilityForm>(k: K, v: DurabilityForm[K]) =>
    onChange({ ...value, [k]: v });
  const loi = (k: DurabilityError, msg: string) => (errors.includes(k) ? msg : undefined);
  const chiSo = (t: string) => t.replace(/[^\d]/g, '').slice(0, 3);

  return (
    <View style={styles.root}>
      <View>
        <Text variant="label">Độ bền</Text>
        <Text variant="caption" style={styles.lead}>
          Không bắt buộc. Điền càng đủ, người mua càng ít phải nhắn hỏi.
        </Text>
      </View>

      <View style={styles.row}>
        {withBattery ? (
          <View style={styles.col}>
            <TextField
              label="Pin còn (%)"
              value={value.battery}
              onChangeText={(t) => set('battery', chiSo(t))}
              keyboardType="number-pad"
              placeholder="VD: 87"
              error={loi('battery', `Từ 0 đến ${LIMITS.battery}.`)}
            />
          </View>
        ) : null}
        <View style={styles.col}>
          <TextField
            label="Đã dùng (tháng)"
            value={value.usedMonths}
            onChangeText={(t) => set('usedMonths', chiSo(t))}
            keyboardType="number-pad"
            placeholder="VD: 12"
            error={loi('usedMonths', `Từ 0 đến ${LIMITS.usedMonths}.`)}
          />
        </View>
        <View style={styles.col}>
          <TextField
            label="Bảo hành (tháng)"
            value={value.warrantyMonths}
            onChangeText={(t) => set('warrantyMonths', chiSo(t))}
            keyboardType="number-pad"
            placeholder="VD: 6"
            error={loi('warrantyMonths', `Từ 0 đến ${LIMITS.warrantyMonths}.`)}
          />
        </View>
      </View>

      <TextField
        label="Khuyết điểm"
        value={value.defects}
        onChangeText={(t) => set('defects', t)}
        placeholder={'Xước nhẹ cạnh trái\nLoa ngoài hơi rè'}
        hint="Mỗi dòng một lỗi. Không có thì để trống."
        error={loi('defects', `Tối đa ${LIMITS.items} dòng, mỗi dòng ${LIMITS.defectLength} ký tự.`)}
        multiline
        numberOfLines={3}
        style={styles.multiline}
      />

      <TextField
        label="Phụ kiện kèm theo"
        value={value.accessories}
        onChangeText={(t) => set('accessories', t)}
        placeholder="Hộp, cáp sạc, ốp lưng"
        hint="Ngăn cách bằng dấu phẩy."
        error={loi('accessories', `Tối đa ${LIMITS.items} món, mỗi món ${LIMITS.accessoryLength} ký tự.`)}
      />

      <View>
        <Text variant="label" style={styles.fieldLabel}>Đã từng sửa chưa</Text>
        <View style={styles.chipsWrap}>
          {(['no', 'yes'] as const).map((v) => {
            const on = value.repaired === v;
            return (
              <Pressable
                key={v}
                onPress={() => set('repaired', on ? '' : v)}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                style={[styles.chip, on && styles.chipOn]}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>
                  {v === 'yes' ? 'Đã sửa' : 'Chưa sửa'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {value.repaired === 'yes' ? (
        <TextField
          label="Đã sửa gì"
          value={value.repairNote}
          onChangeText={(t) => set('repairNote', t.slice(0, LIMITS.repairNote))}
          placeholder="Thay màn hình ở tiệm, tháng 3/2026"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 16,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
  },
  lead: { marginTop: 4, color: Palette.inkMuted },
  // Hai ô một hàng: ba ô một hàng ở máy 360dp làm nhãn "Bảo hành (tháng)" xuống dòng, ô lệch nhau.
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  col: { flexGrow: 1, flexBasis: '45%' },
  fieldLabel: { marginBottom: 8 },
  multiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 10 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: Radius.control,
    borderWidth: 1,
    borderColor: Palette.lineStrong,
    backgroundColor: Palette.white,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  chipOn: { borderColor: Palette.brand, backgroundColor: Palette.brandTint },
  chipText: { fontFamily: Font.medium, fontSize: 13, color: Palette.ink },
  chipTextOn: { color: Palette.brand, fontFamily: Font.semibold },
});
