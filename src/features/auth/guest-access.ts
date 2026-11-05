/**
 * Route nào khách (chưa đăng nhập) được vào, MỘT chỗ duy nhất cho cả app.
 * Tên route là tên navigator thấy: 'orders/[id]', 'sales/index', tab 'orders'.
 *
 * Khai theo hướng CHO PHÉP: route mới quên khai thì khách thấy lời mời đăng
 * nhập, không lọt vào màn cần phiên rồi quay vòng mãi.
 */
const GUEST_ROUTES = new Set([
  '(tabs)',
  'index',
  'account',
  'products/[id]',
  'shop/[id]',
  'search',
  'browse',
  'category/[id]',
  'reviews/[id]',
  // Đã lưu nằm ở máy, khách cũng có danh sách riêng (xem wishlist/store).
  'saved',
]);

export interface LoginPrompt {
  title: string;
  note: string;
}

const MEMBER_ROUTES: Record<string, LoginPrompt> = {
  orders: { title: 'Đơn mua', note: 'Đăng nhập để xem đơn hàng của bạn.' },
  sell: { title: 'Đăng bán', note: 'Đăng nhập để đăng bán món của bạn.' },
  notifications: { title: 'Thông báo', note: 'Đăng nhập để nhận thông báo đơn hàng, tin nhắn.' },
  'orders/[id]': { title: 'Chi tiết đơn', note: 'Đăng nhập để xem đơn hàng của bạn.' },
  'sales/index': { title: 'Đơn bán', note: 'Đăng nhập để xem đơn người mua đặt ở shop bạn.' },
  'sales/[id]': { title: 'Đơn bán', note: 'Đăng nhập để xem đơn người mua đặt ở shop bạn.' },
  cart: { title: 'Giỏ hàng', note: 'Đăng nhập để lưu giỏ hàng và thanh toán.' },
  checkout: { title: 'Thanh toán', note: 'Đăng nhập để đặt đơn. Giỏ hàng vẫn được giữ.' },
  messages: { title: 'Tin nhắn', note: 'Đăng nhập để nhắn với người bán.' },
  'chat/[id]': { title: 'Tin nhắn', note: 'Đăng nhập để nhắn với người bán.' },
  following: { title: 'Đang theo dõi', note: 'Đăng nhập để theo dõi người bán và xem hàng mới của họ.' },
  wallet: { title: 'Ví của tôi', note: 'Đăng nhập để xem số dư, nạp và rút tiền.' },
  'addresses/index': { title: 'Địa chỉ của tôi', note: 'Đăng nhập để xem địa chỉ giao hàng của bạn.' },
  'addresses/new': { title: 'Thêm địa chỉ', note: 'Đăng nhập để lưu địa chỉ giao hàng.' },
  'addresses/[id]': { title: 'Sửa địa chỉ', note: 'Đăng nhập để sửa địa chỉ giao hàng.' },
  'profile/edit': { title: 'Sửa hồ sơ', note: 'Đăng nhập để sửa hồ sơ của bạn.' },
  'change-password': { title: 'Đổi mật khẩu', note: 'Đăng nhập để đổi mật khẩu.' },
  'delete-account': { title: 'Xoá tài khoản', note: 'Đăng nhập để xoá tài khoản của bạn.' },
  'shop/settings': { title: 'Cài đặt shop', note: 'Đăng nhập để mở shop và bán hàng.' },
  'edit-product/[id]': { title: 'Sửa món', note: 'Đăng nhập để sửa món của bạn.' },
  'write-review/[id]': { title: 'Viết đánh giá', note: 'Đăng nhập để đánh giá món đã mua.' },
};

const DEFAULT_PROMPT: LoginPrompt = { title: 'Zoldify', note: 'Đăng nhập để xem mục này nhé.' };

/** Lời mời đăng nhập cho route, hoặc null nếu khách được vào thẳng. */
export function loginPromptFor(routeName: string): LoginPrompt | null {
  if (GUEST_ROUTES.has(routeName)) return null;
  return MEMBER_ROUTES[routeName] ?? DEFAULT_PROMPT;
}
