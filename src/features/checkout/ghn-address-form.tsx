import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { useDistricts, useProvinces, useWards } from '@/features/shop/ghn-api';

export interface GhnAddressSelection {
  receiver_name: string;
  receiver_phone: string;
  shipping_address: string;
  province: string;
  district: string;
  ghn_district_id: number;
  ghn_ward_code: string;
}

/**
 * Chọn địa chỉ NHẬN theo danh mục GHN (ProvinceID/DistrictID/WardCode) — bắt
 * buộc để tính phí ship + tạo vận đơn. Mirror GhnAddressPicker của web: cascade
 * tỉnh→quận→phường (đổi cấp trên reset cấp dưới), phát địa chỉ ghép về cha.
 */
export function GhnAddressForm({ onChange }: { onChange: (a: GhnAddressSelection) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [provinceId, setProvinceId] = useState(0);
  const [districtId, setDistrictId] = useState(0);
  const [wardCode, setWardCode] = useState('');

  const { data: provinces = [] } = useProvinces();
  const { data: districts = [], isFetching: dLoading } = useDistricts(provinceId || null);
  const { data: wards = [], isFetching: wLoading } = useWards(districtId || null);

  const provinceName = provinces.find((p) => p.ProvinceID === provinceId)?.ProvinceName ?? '';
  const districtName = districts.find((d) => d.DistrictID === districtId)?.DistrictName ?? '';
  const wardName = wards.find((w) => w.WardCode === wardCode)?.WardName ?? '';

  // Giữ onChange trong ref để effect không phụ thuộc identity của nó (tránh loop).
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const shipping_address = [street, wardName, districtName, provinceName].filter(Boolean).join(', ');
    onChangeRef.current({
      receiver_name: name.trim(),
      receiver_phone: phone.trim(),
      shipping_address,
      province: provinceName,
      district: districtName,
      ghn_district_id: districtId,
      ghn_ward_code: wardCode,
    });
  }, [name, phone, street, provinceId, districtId, wardCode, provinceName, districtName, wardName]);

  return (
    <View style={styles.root}>
      <TextField
        label="Người nhận"
        value={name}
        onChangeText={setName}
        placeholder="Họ và tên người nhận"
        autoComplete="name"
      />
      <TextField
        label="Số điện thoại"
        value={phone}
        onChangeText={setPhone}
        placeholder="090…"
        keyboardType="phone-pad"
        autoComplete="tel"
      />
      <SelectField
        label="Tỉnh / Thành phố"
        placeholder="Chọn tỉnh/thành"
        value={provinceId || null}
        options={provinces.map((p) => ({ id: p.ProvinceID, name: p.ProvinceName }))}
        onSelect={(id) => {
          setProvinceId(Number(id));
          setDistrictId(0);
          setWardCode('');
        }}
      />
      <SelectField
        label="Quận / Huyện"
        placeholder="Chọn quận/huyện"
        value={districtId || null}
        options={districts.map((d) => ({ id: d.DistrictID, name: d.DistrictName }))}
        onSelect={(id) => {
          setDistrictId(Number(id));
          setWardCode('');
        }}
        disabled={!provinceId}
        loading={dLoading}
      />
      <SelectField
        label="Phường / Xã"
        placeholder="Chọn phường/xã"
        value={wardCode || null}
        options={wards.map((w) => ({ id: w.WardCode, name: w.WardName }))}
        onSelect={(code) => setWardCode(String(code))}
        disabled={!districtId}
        loading={wLoading}
      />
      <TextField
        label="Địa chỉ cụ thể"
        value={street}
        onChangeText={setStreet}
        placeholder="Số nhà, tên đường…"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14 },
});
