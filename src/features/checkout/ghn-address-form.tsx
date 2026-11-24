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

  const { data: provinces = [], isFetching: pLoading } = useProvinces();
  const {
    data: districts = [],
    isFetching: dLoading,
    isError: dError,
  } = useDistricts(provinceId || null);
  const {
    data: wards = [],
    isFetching: wLoading,
    isError: wError,
  } = useWards(districtId || null);

  /**
   * Mã địa chỉ cũ không còn trong danh mục GHN (sáp nhập 7/2025: bỏ cấp huyện,
   * gộp phường/xã, đổi mã hàng loạt). Giữ mã cũ thì GHN không tính được phí
   * ("không có tuyến giao") và người dùng bị chặn ở checkout mà không hiểu vì
   * sao — ô chọn vẫn hiện tên cũ nên tưởng đã đúng.
   *
   * Mỗi cấp tự kiểm khi danh sách của cấp đó đã tải xong: mã đã lưu mà không có
   * trong danh sách thì BỎ và nhắc chọn lại. Lỗi mạng thì KHÔNG kết luận (đợi
   * lần tải sau), tránh xoá oan địa chỉ đang đúng.
   */
  const [stale, setStale] = useState<{ level: 'province' | 'district' | 'ward'; name: string } | null>(
    null,
  );
  if (
    provinceId > 0 &&
    provinceId === initial?.ghn_province_id &&
    !pLoading &&
    provinces.length > 0 &&
    !provinces.some((p) => Number(p.ProvinceID) === provinceId)
  ) {
    setStale({ level: 'province', name: initial?.province || 'tỉnh/thành cũ' });
    setProvinceId(0);
    setDistrictId(0);
    setWardCode('');
  } else if (
    districtId > 0 &&
    districtId === initial?.ghn_district_id &&
    !dLoading &&
    !dError &&
    districts.length > 0 &&
    !districts.some((d) => Number(d.DistrictID) === districtId)
  ) {
    setStale({ level: 'district', name: initial?.district || 'quận/huyện cũ' });
    setDistrictId(0);
    setWardCode('');
  } else if (
    wardCode &&
    wardCode === initial?.ghn_ward_code &&
    !wLoading &&
    !wError &&
    wards.length > 0 &&
    !wards.some((w) => String(w.WardCode) === wardCode)
  ) {
    setStale({ level: 'ward', name: initial?.ward || 'phường/xã cũ' });
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
          setStale(null);
        }}
        error={
          stale?.level === 'province' && !provinceId
            ? `"${stale.name}" không còn trong danh sách của GHN (đã sáp nhập tỉnh/thành). Chọn lại tỉnh/thành, quận/huyện và phường/xã nhé.`
            : undefined
        }
        loading={pLoading}
      />
      <SelectField
        label="Quận / Huyện"
        placeholder="Chọn quận/huyện"
        value={districtId || null}
        options={withSelected(districts.map((d) => ({ id: Number(d.DistrictID), name: d.DistrictName })), districtId, districtName)}
        onSelect={(id) => {
          setDistrictId(Number(id));
          setWardCode('');
          setStale(null);
        }}
        error={
          stale?.level === 'district' && !districtId
            ? `"${stale.name}" không còn trong danh sách của GHN. Chọn lại quận/huyện và phường/xã nhé.`
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
        onSelect={(code) => {
          setWardCode(String(code));
          setStale(null);
        }}
        error={
          stale?.level === 'ward' && !wardCode
            ? `"${stale.name}" không còn trong danh sách của GHN. Chọn lại phường/xã nhé.`
            : undefined
        }
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
