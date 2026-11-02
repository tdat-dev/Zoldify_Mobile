/**
 * Kiểm tra dữ liệu người dùng nhập, dùng chung cho hồ sơ, địa chỉ giao hàng,
 * cài đặt shop và rút tiền. Trước đây mỗi màn chỉ kiểm "có nhập chưa" nên số
 * điện thoại "123" và số tài khoản "abc" lưu được (D-06, D-15, D-20, E2E 02/11).
 */

/**
 * Đưa số điện thoại về dạng 0xxxxxxxxx: bỏ khoảng trắng, dấu chấm, gạch, ngoặc;
 * "+84"/"84" đầu số đổi thành "0". Không kiểm hợp lệ, chỉ chuẩn hoá.
 */
export function normalizeVnPhone(input: string): string {
  let s = input.replace(/[\s.\-()]/g, '');
  if (s.startsWith('+84')) s = `0${s.slice(3)}`;
  else if (/^84\d{9,10}$/.test(s)) s = `0${s.slice(2)}`;
  return s;
}

/**
 * Số điện thoại Việt Nam hợp lệ: di động 10 số đầu 03/05/07/08/09, hoặc cố định
 * 11 số đầu 02. GHN gọi người nhận theo số này nên số sai là giao hỏng.
 */
export function isValidVnPhone(input: string): boolean {
  const s = normalizeVnPhone(input);
  return /^0[35789]\d{8}$/.test(s) || /^02\d{9}$/.test(s);
}

/** Câu báo lỗi cho ô số điện thoại; null nếu hợp lệ. */
export function vnPhoneError(input: string): string | null {
  if (!input.trim()) return 'Nhập số điện thoại.';
  if (!isValidVnPhone(input)) return 'Số điện thoại chưa đúng (VD 0912345678).';
  return null;
}

/** Ngân hàng Việt Nam dùng số tài khoản 6 đến 19 chữ số. */
export const BANK_ACCOUNT_MIN = 6;
export const BANK_ACCOUNT_MAX = 19;

/** Câu báo lỗi cho ô số tài khoản ngân hàng; null nếu hợp lệ. */
export function bankAccountError(input: string): string | null {
  const s = input.replace(/\s/g, '');
  if (!s) return 'Nhập số tài khoản.';
  if (!/^\d+$/.test(s)) return 'Số tài khoản chỉ gồm chữ số.';
  if (s.length < BANK_ACCOUNT_MIN || s.length > BANK_ACCOUNT_MAX) {
    return `Số tài khoản dài từ ${BANK_ACCOUNT_MIN} đến ${BANK_ACCOUNT_MAX} chữ số.`;
  }
  return null;
}
