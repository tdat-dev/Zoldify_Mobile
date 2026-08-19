/**
 * Định dạng tiền VND. Tự chèn dấu chấm hàng nghìn vì Hermes (RN) không có
 * Intl đầy đủ nên toLocaleString hay trả số trơn không nhóm.
 */
export function formatVnd(value: number): string {
  const n = Math.round(value || 0);
  const grouped = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${grouped}đ`;
}
