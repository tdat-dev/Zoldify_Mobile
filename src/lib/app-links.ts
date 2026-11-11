/**
 * Đổi link web zoldify.com thành màn trong app (Android App Links).
 *
 * Người tìm trên Google hoặc bấm link được chia sẻ mà đã cài app thì Android mở
 * thẳng app với nguyên URL web. URL web và route app khác nhau: web là
 * `/{tên}-i{mã}`, app là `/products/{mã}`, nên phải đổi ở đây, trước khi
 * expo-router tìm route (xem src/app/+native-intent.tsx).
 *
 * Mẫu đường dẫn phải khớp `public-urls.ts` của web. Web đổi mẫu thì sửa cả ở đây,
 * không thì link rơi vào màn mở web chứ không vào màn món hàng.
 */

const WEB_HOSTS = new Set(['zoldify.com', 'www.zoldify.com']);

// Cùng mẫu với isProductSegment / parseShopId của web. Mã bắt đầu bằng 0 không
// phải mã thật, để rơi về màn mở web như web trả 404.
const MON_HANG = /^[a-z0-9-]*-i([1-9]\d*)$/;
const MA_SO = /^[1-9]\d*$/;
const SHOP = /^(?:[a-z0-9-]*-)?([1-9]\d*)$/;

// Hàm này chạy trước khi app dựng xong, ném lỗi ở đây là app sập ngay lúc mở
// link. `%` sai định dạng làm decodeURIComponent ném lỗi, nên giữ nguyên đoạn đó.
function giaiMa(doan: string): string {
  try {
    return decodeURIComponent(doan).toLowerCase();
  } catch {
    return doan.toLowerCase();
  }
}

function manTuDuongWeb(doan: string[]): string | null {
  if (doan.length === 1) {
    const m = MON_HANG.exec(doan[0]);
    if (m) return `/products/${m[1]}`;
  }
  // Link chia sẻ của app trước bản này có dạng /product/{mã}; web chuyển 308 về
  // URL mới, nhưng người nhận đã cài app thì mở thẳng app luôn.
  if (doan.length === 2 && doan[0] === 'product') {
    if (MA_SO.test(doan[1])) return `/products/${doan[1]}`;
    const m = MON_HANG.exec(doan[1]);
    if (m) return `/products/${m[1]}`;
  }
  // Trang riêng của người bán trên web cũng nằm dưới /product/ và /shop/, nên
  // App Links bắt cả chúng; app có màn tương ứng thì mở màn đó.
  if (doan.length === 2 && doan[0] === 'product' && doan[1] === 'create') return '/sell';
  if (doan.length === 3 && doan[0] === 'product' && doan[2] === 'edit' && MA_SO.test(doan[1])) {
    return `/edit-product/${doan[1]}`;
  }
  if (doan.length === 2 && doan[0] === 'shop') {
    if (doan[1] === 'orders') return '/sales';
    if (doan[1] === 'settings') return '/shop/settings';
    const m = SHOP.exec(doan[1]);
    if (m) return `/shop/${m[1]}`;
  }
  return null;
}

/**
 * Đường dẫn trong app cho một URL hệ điều hành đưa vào. Không phải link web
 * zoldify.com thì trả nguyên văn (scheme `zoldify://`, thông báo đẩy, route app).
 *
 * Link web không có màn tương ứng thì về Trang chủ, KHÔNG mở lại trình duyệt.
 * Máy ảo 08/11: bản đầu mở link lạ bằng expo-web-browser; không có tab Chrome thì
 * nó bắn intent VIEW, Android giao lại cho app (đã xác minh cho zoldify.com) và
 * app mở web lần nữa, quay vòng không dừng.
 */
export function duongDanTrongApp(path: string): string {
  let url: URL;
  try {
    url = new URL(path);
  } catch {
    return path;
  }
  if (url.protocol !== 'https:' || !WEB_HOSTS.has(url.hostname)) return path;
  const doan = url.pathname.split('/').filter(Boolean).map(giaiMa);
  return manTuDuongWeb(doan) ?? '/';
}
