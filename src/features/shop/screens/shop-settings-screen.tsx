import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Palette } from '@/components/ui/theme';
import { useMyShop, useSaveShop } from '@/features/shop/api';
import { useDistricts, useProvinces, useWards } from '@/features/shop/ghn-api';
import { PickerField, type Option } from '@/features/shop/components/picker-field';
import { useAuthStore } from '@/features/auth/store';

interface Sel {
  id: number | string;
  name: string;
}

/**
 * Cài đặt shop → địa chỉ lấy hàng (GHN). Bắt buộc trước khi đăng bán.
 * Tạo shop nếu chưa có, hoặc cập nhật. Chọn tỉnh → quận → phường theo GHN.
 */
export default function ShopSettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const { data: shop, isPending: loadingShop } = useMyShop();
  const save = useSaveShop();

  const [name, setName] = useState('');
  const [pickupName, setPickupName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState<Sel | null>(null);
  const [district, setDistrict] = useState<Sel | null>(null);
  const [ward, setWard] = useState<Sel | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const provinces = useProvinces();
  const districts = useDistricts(province ? Number(province.id) : null);
  const wards = useWards(district ? Number(district.id) : null);

  // Điền sẵn phần text từ shop hiện có (địa chỉ GHN chọn lại để có id/code).
  useEffect(() => {
    if (shop) {
      setName(shop.name ?? '');
      setPickupName(shop.pickup_name ?? '');
      setPhone(shop.pickup_phone ?? '');
      setAddress(shop.pickup_address ?? '');
    } else if (user) {
      setPickupName(user.full_name ?? '');
    }
  }, [shop, user]);

  const toOptions = (
    items: { [k: string]: any }[] | undefined,
    idKey: string,
    nameKey: string,
  ): Option[] => (items ?? []).map((it) => ({ key: it[idKey], label: it[nameKey] }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = 'Nhập tên shop.';
    if (pickupName.trim().length < 2) e.pickupName = 'Nhập tên người lấy hàng.';
    if (phone.trim().length < 8) e.phone = 'Nhập số điện thoại.';
    if (!province) e.province = 'Chọn tỉnh/thành.';
    if (!district) e.district = 'Chọn quận/huyện.';
    if (!ward) e.ward = 'Chọn phường/xã.';
    if (address.trim().length < 4) e.address = 'Nhập địa chỉ chi tiết.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async () => {
    setErrorMsg(null);
    if (!validate()) return;
    try {
      await save.mutateAsync({
        hasShop: !!shop,
        name: name.trim(),
        pickup_name: pickupName.trim(),
        pickup_phone: phone.trim(),
        pickup_address: address.trim(),
        pickup_province_name: province!.name,
        pickup_district_id: Number(district!.id),
        pickup_district_name: district!.name,
        pickup_ward_code: String(ward!.id),
        pickup_ward_name: ward!.name,
      });
      router.back();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
      setErrorMsg(typeof msg === 'string' ? msg : 'Lưu chưa được. Thử lại nhé.');
    }
  };

  if (loadingShop) {
    return (
      <Screen onBack={() => router.back()} title="Cài đặt shop">
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Palette.brand} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      onBack={() => router.back()}
      title="Cài đặt shop"
      scroll
      footer={
        <Button
          title="Lưu"
          onPress={onSave}
          loading={save.isPending}
          disabled={save.isPending}
        />
      }>
      <Text variant="bodyMuted" style={styles.intro}>
        Khai địa chỉ lấy hàng để được đăng bán và tạo vận đơn.
      </Text>

      <View style={styles.form}>
        <TextField label="Tên shop" value={name} onChangeText={setName} placeholder="Shop của bạn" error={errors.name} />
        <TextField label="Tên người lấy hàng" value={pickupName} onChangeText={setPickupName} placeholder="Nguyễn Văn A" error={errors.pickupName} />
        <TextField label="Số điện thoại" value={phone} onChangeText={setPhone} placeholder="09xxxxxxxx" keyboardType="phone-pad" error={errors.phone} />

        <PickerField
          label="Tỉnh / Thành"
          placeholder="Chọn tỉnh/thành"
          value={province?.name}
          options={toOptions(provinces.data, 'ProvinceID', 'ProvinceName')}
          loading={provinces.isPending}
          error={errors.province}
          onSelect={(o) => {
            setProvince({ id: o.key, name: o.label });
            setDistrict(null);
            setWard(null);
          }}
        />
        <PickerField
          label="Quận / Huyện"
          placeholder={province ? 'Chọn quận/huyện' : 'Chọn tỉnh trước'}
          value={district?.name}
          disabled={!province}
          options={toOptions(districts.data, 'DistrictID', 'DistrictName')}
          loading={districts.isFetching}
          error={errors.district}
          onSelect={(o) => {
            setDistrict({ id: o.key, name: o.label });
            setWard(null);
          }}
        />
        <PickerField
          label="Phường / Xã"
          placeholder={district ? 'Chọn phường/xã' : 'Chọn quận trước'}
          value={ward?.name}
          disabled={!district}
          options={toOptions(wards.data, 'WardCode', 'WardName')}
          loading={wards.isFetching}
          error={errors.ward}
          onSelect={(o) => setWard({ id: o.key, name: o.label })}
        />

        <TextField label="Địa chỉ chi tiết" value={address} onChangeText={setAddress} placeholder="Số nhà, tên đường…" error={errors.address} />

        {errorMsg ? <Text variant="caption" style={styles.err}>{errorMsg}</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  intro: { marginTop: 8, marginBottom: 16 },
  form: { gap: 16, paddingBottom: 16 },
  err: { color: Palette.dangerFg },
});
