/** Tiền tệ không có phần lẻ (ISO 4217 minor unit = 0). */
const ZERO_DECIMAL = new Set(['VND', 'JPY', 'KRW']);

/**
 * Định dạng tiền. Tự chèn dấu nhóm hàng nghìn vì Hermes (RN) không có Intl
 * đầy đủ nên toLocaleString hay trả số trơn không nhóm.
 *
 * `currency` là mã ISO 4217 của sản phẩm/đơn (`product.currency`,
 * `order.currency`). Không truyền hoặc 'VND' thì giữ dạng cũ "1.890.000đ";
 * tiền khác in kèm mã ("12.50 USD") thay vì gắn nhầm chữ "đ".
 */
export function formatVnd(value: number, currency?: string | null): string {
  const code = (currency || 'VND').toUpperCase();
  if (code === 'VND') {
    const n = Math.round(value || 0);
    const grouped = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${grouped}đ`;
  }
  const fixed = (Number(value) || 0).toFixed(ZERO_DECIMAL.has(code) ? 0 : 2);
  const [int, frac] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${frac ? `${grouped}.${frac}` : grouped} ${code}`;
}

/**
 * Thời gian tương đối tiếng Việt ("vừa xong", "5 phút", "2 giờ", "3 ngày"),
 * quá 7 ngày thì hiện ngày/tháng. Dùng cho thông báo, tin nhắn.
 */
export function timeAgo(iso?: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const sec = Math.floor((Date.now() - then) / 1000);
  if (sec < 45) return 'vừa xong';
  if (sec < 3600) return `${Math.floor(sec / 60)} phút`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} giờ`;
  if (sec < 7 * 86400) return `${Math.floor(sec / 86400)} ngày`;
  const d = new Date(then);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}
