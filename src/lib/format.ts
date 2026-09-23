/**
 * Định dạng tiền VND. Tự chèn dấu chấm hàng nghìn vì Hermes (RN) không có
 * Intl đầy đủ nên toLocaleString hay trả số trơn không nhóm.
 */
export function formatVnd(value: number): string {
  const n = Math.round(value || 0);
  const grouped = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${grouped}đ`;
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
