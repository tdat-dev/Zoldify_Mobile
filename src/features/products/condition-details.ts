/**
 * Thẻ "Độ bền" của tin đăng. Cùng dạng với backend
 * (`Zoldify_Backend/src/catalog/products/do-ben.ts`, cùng bản với web `src/lib/condition-details.ts`).
 *
 * Form giữ mọi ô dạng chuỗi (ô số trống phải là "", không phải 0), rồi
 * `fromForm` đổi sang đúng dạng API nhận. Trần số ở đây trùng DTO: chặn ở form
 * để người bán thấy lỗi cạnh ô, không phải nhận câu 400 chung chung.
 */
export interface ConditionDetails {
  battery_health?: number;
  used_months?: number;
  warranty_months?: number;
  defects?: string[];
  accessories?: string[];
  repaired?: boolean;
  repair_note?: string;
}

/**
 * Slug danh mục có pin, chép từ backend (`DANH_MUC_CO_PIN`). Danh mục khác thì
 * ẩn ô pin, vì server trả 400 khi áo hay chảo khai pin.
 */
export const BATTERY_CATEGORY_SLUGS = [
  'dien-thoai',
  'laptop',
  'may-tinh-bang',
  'tai-nghe',
  'dong-ho',
];

export function hasBattery(categorySlug: string | null | undefined): boolean {
  return !!categorySlug && BATTERY_CATEGORY_SLUGS.includes(categorySlug);
}

export interface DurabilityForm {
  battery: string;
  usedMonths: string;
  warrantyMonths: string;
  /** Mỗi dòng một khuyết điểm. */
  defects: string;
  /** Ngăn bằng dấu phẩy hoặc xuống dòng. */
  accessories: string;
  /** '' là chưa trả lời, khác với "chưa sửa". */
  repaired: '' | 'no' | 'yes';
  repairNote: string;
}

export const EMPTY_DURABILITY: DurabilityForm = {
  battery: '',
  usedMonths: '',
  warrantyMonths: '',
  defects: '',
  accessories: '',
  repaired: '',
  repairNote: '',
};

export function toForm(d: ConditionDetails | null | undefined): DurabilityForm {
  if (!d) return EMPTY_DURABILITY;
  return {
    battery: d.battery_health?.toString() ?? '',
    usedMonths: d.used_months?.toString() ?? '',
    warrantyMonths: d.warranty_months?.toString() ?? '',
    defects: (d.defects ?? []).join('\n'),
    accessories: (d.accessories ?? []).join(', '),
    repaired: d.repaired === undefined ? '' : d.repaired ? 'yes' : 'no',
    repairNote: d.repair_note ?? '',
  };
}

/** Trần trùng `ConditionDetailsDto`. */
export const LIMITS = {
  battery: 100,
  usedMonths: 600,
  warrantyMonths: 120,
  items: 10,
  defectLength: 100,
  accessoryLength: 60,
  repairNote: 200,
} as const;

export type DurabilityError =
  | 'battery'
  | 'usedMonths'
  | 'warrantyMonths'
  | 'defects'
  | 'accessories';

function soNguyen(v: string, max: number): number | undefined | 'bad' {
  const t = v.trim();
  if (!t) return undefined;
  if (!/^\d+$/.test(t)) return 'bad';
  const n = Number(t);
  return n > max ? 'bad' : n;
}

function dong(v: string, tach: RegExp): string[] {
  return v
    .split(tach)
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * Đổi form sang payload. Trả `details: null` khi người bán không khai gì: trang
 * sửa gửi `null` để xoá thẻ, trang đăng bỏ trường.
 */
export function fromForm(
  f: DurabilityForm,
  withBattery: boolean,
): { details: ConditionDetails | null; errors: DurabilityError[] } {
  const errors: DurabilityError[] = [];
  const d: ConditionDetails = {};

  if (withBattery) {
    const pin = soNguyen(f.battery, LIMITS.battery);
    if (pin === 'bad') errors.push('battery');
    else if (pin !== undefined) d.battery_health = pin;
  }
  const dung = soNguyen(f.usedMonths, LIMITS.usedMonths);
  if (dung === 'bad') errors.push('usedMonths');
  else if (dung !== undefined) d.used_months = dung;
  const bh = soNguyen(f.warrantyMonths, LIMITS.warrantyMonths);
  if (bh === 'bad') errors.push('warrantyMonths');
  else if (bh !== undefined) d.warranty_months = bh;

  const defects = dong(f.defects, /\n/);
  if (
    defects.length > LIMITS.items ||
    defects.some((x) => x.length > LIMITS.defectLength)
  ) {
    errors.push('defects');
  } else if (defects.length) d.defects = defects;

  const accessories = dong(f.accessories, /[,\n]/);
  if (
    accessories.length > LIMITS.items ||
    accessories.some((x) => x.length > LIMITS.accessoryLength)
  ) {
    errors.push('accessories');
  } else if (accessories.length) d.accessories = accessories;

  if (f.repaired) d.repaired = f.repaired === 'yes';
  const note = f.repairNote.trim();
  if (f.repaired === 'yes' && note) d.repair_note = note.slice(0, LIMITS.repairNote);

  return { details: Object.keys(d).length ? d : null, errors };
}

/**
 * Các dòng của thẻ Độ bền ở màn chi tiết, cùng nội dung với bảng trên web
 * (`DurabilityTable`). Chỉ dòng người bán đã khai: "Pin: –" đọc như người bán
 * giấu, trong khi phần lớn chỉ là họ chưa điền.
 */
export function durabilityRows(
  d: ConditionDetails | null | undefined,
): { label: string; value: string }[] {
  if (!d) return [];
  const rows: { label: string; value: string }[] = [];
  if (d.battery_health !== undefined) rows.push({ label: 'Pin còn', value: `${d.battery_health}%` });
  if (d.used_months !== undefined) {
    rows.push({ label: 'Đã dùng', value: d.used_months === 0 ? 'Chưa dùng' : `${d.used_months} tháng` });
  }
  if (d.warranty_months !== undefined) {
    rows.push({
      label: 'Bảo hành',
      value: d.warranty_months === 0 ? 'Hết bảo hành' : `Còn ${d.warranty_months} tháng`,
    });
  }
  if (d.defects?.length) rows.push({ label: 'Khuyết điểm', value: d.defects.join('\n') });
  if (d.accessories?.length) rows.push({ label: 'Phụ kiện', value: d.accessories.join(', ') });
  if (d.repaired !== undefined) {
    rows.push({ label: 'Sửa chữa', value: d.repaired ? d.repair_note || 'Đã sửa' : 'Chưa sửa' });
  }
  return rows;
}
