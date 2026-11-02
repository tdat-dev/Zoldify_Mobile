import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SelectField, type SelectOption } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { useDistricts, useProvinces, useWards } from '@/features/shop/ghn-api';
import { sortByNameVi } from '@/lib/text';

export interface GhnAddressSelection {
  receiver_name: string;
  receiver_phone: string;
  shipping_address: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  ghn_province_id: number;
  ghn_district_id: number;
  ghn_ward_code: string;
}

/** Giá trị điền sẵn khi SỬA một địa chỉ đã lưu (form thêm mới thì bỏ trống). */
export interface GhnAddressInitial {
  receiver_name?: string;
  receiver_phone?: string;
  street?: string;
  ghn_province_id?: number;
  ghn_district_id?: number;
  ghn_ward_code?: string;
  /** Tên đã lưu: dùng khi mã đã lưu không còn trong danh sách GHN hiện tại. */
  province?: string;
  district?: string;
  ward?: string;
}

/**
 * Chọn địa chỉ NHẬN theo danh mục GHN (ProvinceID/DistrictID/WardCode) — bắt
 * buộc để tính phí ship + tạo vận đơn. Mirror GhnAddressPicker của web: cascade
 * tỉnh→quận→phường (đổi cấp trên reset cấp dưới), phát địa chỉ ghép về cha.
 * Nhận `initial` để dùng lại cho màn SỬA địa chỉ đã lưu.
 */
export function GhnAddressForm({
  initial,
  onChange,
  phoneError,
}: {
  initial?: GhnAddressInitial;
  onChange: (a: GhnAddressSelection) => void;
  /** Lỗi của ô số điện thoại (nơi gọi kiểm lúc lưu). */
  phoneError?: string;
}) {
  const [name, setName] = useState(initial?.receiver_name ?? '');
  const [phone, setPhone] = useState(initial?.receiver_phone ?? '');
  const [street, setStreet] = useState(initial?.street ?? '');
  const [provinceId, setProvinceId] = useState(initial?.ghn_province_id ?? 0);
  const [districtId, setDistrictId] = useState(initial?.ghn_district_id ?? 0);
  const [wardCode, setWardCode] = useState(initial?.ghn_ward_code ?? '');

  const { data: provinces = [] } = useProvinces();
  const { data: districts = [], isFetching: dLoading } = useDistricts(provinceId || null);
  const { data: wards = [], isFetching: wLoading } = useWards(districtId || null);

  // Sửa địa chỉ: mã quận đã lưu có thể không còn trong danh sách GHN hiện tại
  // (GHN đổi mã sau sáp nhập, VD quận 2045), trong khi danh sách phường theo mã
  // cũ vẫn tải được. Trước đây ô Quận trống không lời nào mà phường vẫn còn,
  // bấm Cập nhật là gửi thiếu quận (D-07, E2E 02/11). Mã cũ đó GHN cũng không
  // tính phí được, nên KHÔNG giữ lại: bỏ quận + phường đã lưu và nhắc chọn lại.
  const [staleDistrict, setStaleDistrict] = useState<string | null>(null);
  if (
    districtId > 0 &&
    districtId === initial?.ghn_district_id &&
    !dLoading &&
    districts.length > 0 &&
    !districts.some((d) => Number(d.DistrictID) === districtId)
  ) {
    setStaleDistrict(initial?.district || 'quận/huyện cũ');
    setDistrictId(0);
    setWardCode('');
  }

  const keepSaved = <T,>(current: T, saved: T | undefined, savedName: string | undefined) =>
    saved != null && current === saved && savedName ? savedName : '';

  const provinceName =
    provinces.find((p) => Number(p.ProvinceID) === provinceId)?.ProvinceName ??
    keepSaved(provinceId, initial?.ghn_province_id, initial?.province);
  const districtName =
    districts.find((d) => Number(d.DistrictID) === districtId)?.DistrictName ??
    keepSaved(districtId, initial?.ghn_district_id, initial?.district);
  const wardName =
    wards.find((w) => String(w.WardCode) === wardCode)?.WardName ??
    keepSaved(wardCode, initial?.ghn_ward_code, initial?.ward);

  /** Danh sách đã sắp A-Z, cộng thêm dòng đang chọn nếu GHN không còn trả nó. */
  const withSelected = (opts: SelectOption[], id: string | number, name: string) => {
    const sorted = sortByNameVi(opts, (o) => o.name);
    if (!id || !name || sorted.some((o) => o.id === id)) return sorted;
    return [{ id, name }, ...sorted];
  };

  // Giữ onChange trong ref để effect không phụ thuộc identity của nó (tránh loop).
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const shipping_address = [street, wardName, districtName, provinceName].filter(Boolean).join(', ');
    onChangeRef.current({
      receiver_name: name.trim(),
      receiver_phone: phone.trim(),
      shipping_address,
      province: provinceName,
      district: districtName,
      ward: wardName,
      street: street.trim(),
      ghn_province_id: provinceId,
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
        error={phoneError}
      />
      <SelectField
        label="Tỉnh / Thành phố"
        placeholder="Chọn tỉnh/thành"
        value={provinceId || null}
        options={withSelected(provinces.map((p) => ({ id: Number(p.ProvinceID), name: p.ProvinceName })), provinceId, provinceName)}
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
        options={withSelected(districts.map((d) => ({ id: Number(d.DistrictID), name: d.DistrictName })), districtId, districtName)}
        onSelect={(id) => {
          setDistrictId(Number(id));
          setWardCode('');
          setStaleDistrict(null);
        }}
        error={
          staleDistrict && !districtId
            ? `"${staleDistrict}" không còn trong danh sách của GHN. Chọn lại quận/huyện và phường/xã nhé.`
            : undefined
        }
        disabled={!provinceId}
        loading={dLoading}
      />
      <SelectField
        label="Phường / Xã"
        placeholder="Chọn phường/xã"
        value={wardCode || null}
        options={withSelected(wards.map((w) => ({ id: String(w.WardCode), name: w.WardName })), wardCode, wardName)}
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
