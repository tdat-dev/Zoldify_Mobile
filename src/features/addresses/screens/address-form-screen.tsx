import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackChevron } from '@/components/ui/back-chevron';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Palette } from '@/components/ui/theme';
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  type AddressInput,
} from '@/features/addresses/api';
import { GhnAddressForm, type GhnAddressSelection } from '@/features/checkout/ghn-address-form';

/** Thêm/sửa một địa chỉ. Có `id` = sửa (điền sẵn từ cache danh sách). */
export default function AddressFormScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id ? Number(id) : null;

  const { data: list } = useAddresses();
  const existing = editingId ? list?.find((a) => a.id === editingId) : undefined;

  const create = useCreateAddress();
  const update = useUpdateAddress();
  const saving = create.isPending || update.isPending;

  const [label, setLabel] = useState(existing?.label ?? '');
  const [isDefault, setIsDefault] = useState(existing?.is_default ?? false);
  const [sel, setSel] = useState<GhnAddressSelection | null>(null);
  const [err, setErr] = useState('');

  const back = () => (router.canGoBack() ? router.back() : router.replace('/addresses' as never));

  const valid =
    sel &&
    sel.receiver_name &&
    sel.receiver_phone &&
    sel.ghn_district_id > 0 &&
    sel.ghn_ward_code &&
    sel.street;

  const onSave = () => {
    if (!sel) return;
    if (!valid) {
      setErr('Vui lòng điền đủ người nhận, SĐT, tỉnh/quận/phường và địa chỉ cụ thể.');
      return;
    }
    setErr('');
    const input: AddressInput = {
      recipient_name: sel.receiver_name,
      phone_number: sel.receiver_phone,
      label: label.trim() || undefined,
      province: sel.province,
      district: sel.district,
      ward: sel.ward || undefined,
      street: sel.street,
      ghn_province_id: sel.ghn_province_id || undefined,
      ghn_district_id: sel.ghn_district_id || undefined,
      ghn_ward_code: sel.ghn_ward_code || undefined,
      is_default: isDefault,
    };
    const onDone = { onSuccess: () => back() };
    if (editingId) update.mutate({ id: editingId, input }, onDone);
    else create.mutate(input, onDone);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <BackChevron onPress={back} />
        <Text variant="title">{editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <GhnAddressForm
          initial={
            existing
              ? {
                  receiver_name: existing.recipient_name,
                  receiver_phone: existing.phone_number,
                  street: existing.street,
                  ghn_province_id: existing.ghn_province_id ?? undefined,
                  ghn_district_id: existing.ghn_district_id ?? undefined,
                  ghn_ward_code: existing.ghn_ward_code ?? undefined,
                }
              : undefined
          }
          onChange={setSel}
        />

        <TextField
          label="Nhãn (tuỳ chọn)"
          value={label}
          onChangeText={setLabel}
          placeholder="Nhà riêng, Cơ quan…"
        />

        <View style={styles.switchRow}>
          <Text variant="body">Đặt làm địa chỉ mặc định</Text>
          <Switch
            value={isDefault}
            onValueChange={setIsDefault}
            trackColor={{ true: Palette.brand, false: Palette.lineStrong }}
            thumbColor={Palette.white}
          />
        </View>

        {err ? (
          <View style={styles.errBanner}><Text style={styles.errText}>{err}</Text></View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          title={saving ? 'Đang lưu…' : editingId ? 'Cập nhật' : 'Lưu địa chỉ'}
          onPress={onSave}
          loading={saving}
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
  body: { padding: 16, gap: 14 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  errBanner: {
    backgroundColor: Palette.dangerBg,
    borderRadius: 4,
    padding: 12,
  },
  errText: { color: Palette.dangerFg, fontSize: 13 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.lineStrong,
    backgroundColor: Palette.white,
  },
});
