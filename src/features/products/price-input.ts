/**
 * Ô giá của form đăng bán / sửa món: lọc lúc gõ và kiểm lúc lưu.
 *
 * VÌ SAO CÓ FILE NÀY. Báo cáo V2: ô giá màn đăng bán nhận "1.5", "1e3" (app
 * hiểu là 1000 vì `Number("1e3") === 1000`) và "99999999999999999" mà không
 * báo lỗi, trong khi ô số lượng bên cạnh chỉ cho gõ chữ số. Lý do: ô giá không
 * lọc gì, và chỗ kiểm chỉ hỏi `Number(price) > 0` — câu đó đúng với cả ba.
 * `keyboardType="number-pad"` không chặn được: dán chữ vào, hoặc bàn phím
 * Android có dấu chấm, là lọt.
 *
 * Màn sửa món đã lọc chữ số nhưng cũng chưa có trần. Gom về một chỗ để hai
 * màn không lệch nhau lần nữa.
 */


/**
 * Giá trần một món: 10 tỷ đồng. Cùng số với `MAX_PRICE` của trợ lý tìm đồ ở
 * backend (src/catalog/assistant/assistant-filters.ts) — con số duy nhất về
 * giá trần đang có trong hệ. Cột `price` là DECIMAL(15,2) nên chứa được
 * tới ~10¹³; trần ở đây chặn số gõ nhầm thừa chữ số trước khi tới đó.
 */
export const GIA_TOI_DA = 10_000_000_000;

const SO_CHU_SO_TOI_DA = String(GIA_TOI_DA).length;

// Nhóm hàng nghìn bằng tay, cùng biểu thức với `formatVnd` (src/lib/format.ts),
// chứ không `toLocaleString`: Hermes không có Intl đầy đủ, trên máy thật nó có
// thể ra số trơn. Không import `formatVnd` vì `npm test` chạy file này bằng
// node, mà node không hiểu đường dẫn `@/`.
const GIA_TOI_DA_HIEN_THI = `${String(GIA_TOI_DA).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}đ`;

/** Dùng trong `onChangeText`: chỉ giữ chữ số, cắt ở số chữ số của giá trần. */
export function locGia(text: string): string {
  return text.replace(/\D/g, '').slice(0, SO_CHU_SO_TOI_DA);
}

/**
 * Dùng lúc bấm lưu: trả câu lỗi, hoặc `undefined` khi giá dùng được.
 *
 * Kiểm CHUỖI chứ không kiểm `Number(...)`: `Number` nhận "1e3", "0x10",
 * " 12 " và "Infinity". Chỉ chuỗi toàn chữ số mới là một giá.
 */
export function loiGia(text: string): string | undefined {
  if (!/^\d+$/.test(text)) return 'Nhập giá hợp lệ (chỉ gồm chữ số).';
  const gia = Number(text);
  if (gia < 1) return 'Giá phải lớn hơn 0.';
  if (gia > GIA_TOI_DA) return `Giá tối đa ${GIA_TOI_DA_HIEN_THI}.`;
  return undefined;
}
