import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Palette } from '@/components/ui/theme';
import { useMyShop, useSaveShop } from '@/features/shop/api';
import { useDistricts, useProvinces, useWards } from '@/features/shop/ghn-api';
import { SelectField, type SelectOption } from '@/components/ui/select-field';
import { useAuthStore } from '@/features/auth/store';
import { compareVi, sortByNameVi } from '@/lib/text';
import { normalizeVnPhone, vnPhoneError } from '@/lib/validators';

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
  const districts = useDistricts(province?.id ? Number(province.id) : null);
  const wards = useWards(district ? Number(district.id) : null);

  // Điền sẵn từ shop hiện có, kể cả tỉnh/quận/phường lấy hàng đã lưu. Trước
  // đây ba ô này để trống dù /shop/me có đủ, người bán sửa tên shop rồi Lưu là
  // bị bắt chọn lại địa chỉ lấy hàng (D-23, E2E 02/11). Quận/phường có sẵn
  // mã + tên; tỉnh chỉ lưu tên nên dò theo tên trong danh sách GHN (khối dưới).
  // Điền lúc render khi nguồn đổi (mẫu "chỉnh state khi prop đổi"), không
  // setState trong effect.
  const prefillSrc = shop ?? user ?? null;
  const [prefilled, setPrefilled] = useState<unknown>(null);
  if (prefillSrc && prefillSrc !== prefilled) {
    setPrefilled(prefillSrc);
    if (shop) {
      setName(shop.name ?? '');
      setPickupName(shop.pickup_name ?? '');
      setPhone(shop.pickup_phone ?? '');
      setAddress(shop.pickup_address ?? '');
      if (shop.pickup_district_id && shop.pickup_district_name) {
        setDistrict({ id: Number(shop.pickup_district_id), name: shop.pickup_district_name });
      }
      if (shop.pickup_ward_code && shop.pickup_ward_name) {
        setWard({ id: String(shop.pickup_ward_code), name: shop.pickup_ward_name });
      }
    } else if (user) {
      setPickupName(user.full_name ?? '');
    }
  }

  const savedProvince = shop?.pickup_province_name;
  if (!province && savedProvince && provinces.data) {
    // So không dấu, bỏ tiền tố "Thành phố"/"Tỉnh": GHN và dữ liệu lưu có thể lệch nhau.
    const found = provinces.data.find((p) => compareVi(p.ProvinceName, savedProvince) === 0);
    setProvince(found ? { id: Number(found.ProvinceID), name: found.ProvinceName } : { id: 0, name: savedProvince });
  }

  const toOptions = (
    items: { [k: string]: any }[] | undefined,
    idKey: string,
    nameKey: string,
    current: Sel | null,
  ): SelectOption[] => {
    const opts = sortByNameVi(
      (items ?? []).map((it) => ({ id: it[idKey] as string | number, name: String(it[nameKey]) })),
      (o) => o.name,
    );
    // Giá trị đã lưu mà GHN không còn trả (đổi mã) vẫn hiện được, không mất khi Lưu.
    if (current && current.id && !opts.some((o) => o.id === current.id)) {
      return [{ id: current.id, name: current.name }, ...opts];
    }
    return opts;
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = 'Nhập tên shop.';
    if (pickupName.trim().length < 2) e.pickupName = 'Nhập tên người lấy hàng.';
    const phoneErr = vnPhoneError(phone);
    if (phoneErr) e.phone = phoneErr;
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
        pickup_phone: normalizeVnPhone(phone),
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

        <SelectField
          label="Tỉnh / Thành"
          placeholder="Chọn tỉnh/thành"
          value={province?.id || null}
          options={toOptions(provinces.data, 'ProvinceID', 'ProvinceName', province)}
          loading={provinces.isPending}
          error={errors.province}
          onSelect={(id) => {
            const p = provinces.data?.find((x) => Number(x.ProvinceID) === Number(id));
            if (!p) return;
            setProvince({ id: Number(p.ProvinceID), name: p.ProvinceName });
            setDistrict(null);
            setWard(null);
          }}
        />
        <SelectField
          label="Quận / Huyện"
          placeholder={province ? 'Chọn quận/huyện' : 'Chọn tỉnh trước'}
          value={district?.id ?? null}
          disabled={!province}
          options={toOptions(districts.data, 'DistrictID', 'DistrictName', district)}
          loading={districts.isFetching}
          error={errors.district}
          onSelect={(id) => {
            const d = districts.data?.find((x) => Number(x.DistrictID) === Number(id));
            if (!d) return;
            setDistrict({ id: Number(d.DistrictID), name: d.DistrictName });
            setWard(null);
          }}
        />
        <SelectField
          label="Phường / Xã"
          placeholder={district ? 'Chọn phường/xã' : 'Chọn quận trước'}
          value={ward?.id ?? null}
          disabled={!district}
          options={toOptions(wards.data, 'WardCode', 'WardName', ward)}
          loading={wards.isFetching}
          error={errors.ward}
          onSelect={(id) => {
            const w = wards.data?.find((x) => String(x.WardCode) === String(id));
            if (!w) return;
            setWard({ id: String(w.WardCode), name: w.WardName });
          }}
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
