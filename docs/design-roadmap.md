# Zoldify Mobile — Design Audit & Roadmap

> Bản đánh giá thiết kế toàn app + lộ trình nâng cấp, đối chiếu benchmark thật từ Mobbin
> (Vinted, Depop, Grailed, Shopee, Vestiaire, Etsy…). Ngày: 2026-08-24.
> **Chưa đụng code** — đây là bản đồ để quyết định làm gì, theo thứ tự nào.

## 0. Phương pháp

1. **Research benchmark** trên Mobbin (iOS) cho 7 surface: auth, home/discovery, product detail, sell/create-listing, cart/checkout, orders/tracking, seller profile.
2. **Xem app thật** trên máy ảo Android (home, product detail, login) + **đọc & chấm điểm 15+ màn** trong code.
3. Chấm theo chuẩn một sàn đồ cũ hàng đầu, giữ nguyên **doctrine "sổ kê" phẳng** của Zoldify (góc 4px, hairline, không pill/glow, brand xanh `#2C67C8`, giá đỏ `#CE1D21`). Không đề xuất phá bản sắc này.

**Kết luận 1 dòng:** phần *khung* (nav, auth, design tokens, home feed) đã tốt và nhất quán. Khoảng cách lớn nhất so với sàn đồ cũ hàng đầu nằm ở **niềm tin C2C** (ảnh nhiều góc + hồ sơ người bán) và **phễu mua bán** (đăng bán nhiều ảnh, checkout thật, theo dõi đơn). Đây mới là thứ quyết định người dùng có mua/bán hay không.

---

## 1. Design System — giữ gì, thêm gì

Tokens (`components/ui/theme.ts`) và primitives (`button`, `text-field`, `text`, `screen`) **chắc, đúng doctrine — giữ nguyên**. Nhưng còn **thiếu 7 primitive dùng chung** mà cả app đang phải chế lẻ hoặc bỏ trống:

| Primitive | Vì sao cần | Hiện trạng |
|---|---|---|
| `Skeleton` (khối trắng hairline) | Mọi màn đang dùng spinner giữa màn → cảm giác chậm, giật layout | Chưa có |
| `Avatar` + `RatingStars` / `TrustRow` | Sàn C2C sống nhờ uy tín người bán (sao, số giao dịch, tỉ lệ phản hồi) | Chưa có |
| `Wishlist` store + nút `HeartButton` | Lưu món là hành vi lõi của mua đồ cũ; hiện KHÔNG có ở đâu | Chưa có |
| `ImageGallery` (carousel + dots + zoom) | Đồ cũ = phải soi ảnh nhiều góc | Chưa có |
| `PhotoUploadGrid` (cover + reorder) | Đăng bán cần 5–10 ảnh | Chưa có |
| `BackChevron` | Chevron back đang tự vẽ lặp ở nhiều màn | Lặp code |
| Token màu lỗi (`Palette.dangerFg`) áp dụng đồng bộ | `#B32322` hard-code ở ≥3 file auth | Lệch |

> Làm nhóm primitive này **trước** sẽ mở khóa hầu hết các hạng mục P0/P1 bên dưới mà không phải sửa đi sửa lại.

---

## 2. Audit từng màn (đối chiếu benchmark)

Mức độ: **P0** = chặn trải nghiệm/niềm tin · **P1** = ảnh hưởng rõ · **P2** = polish.

### Product Detail — `features/products/screens/product-detail-screen.tsx`
Mạnh: hero full-bleed, sticky 2 nút (Thêm giỏ / Mua ngay), giá đỏ cân, có loading/error.
- **P0 — Chỉ 1 ảnh, không gallery.** Đồ cũ phải xem nhiều góc để soi vết. → carousel nhiều ảnh + dots + xem phóng to. *(ref: [Vinted](https://mobbin.com/screens/f15927fc-596e-4d40-8f4f-cd3b8f97df2d), [Depop](https://mobbin.com/screens/5a00d933-237b-46fc-ab14-4bd8128660da))*
- **P0 — Hồ sơ người bán quá yếu:** chỉ 1 dòng tên, không avatar/rating/số giao dịch, **không nút "Nhắn người bán"**. → block seller-trust như [Grailed](https://mobbin.com/screens/f0d9f701-4f21-4eb7-b887-dc9778f9ae3c) (avatar + sao + reviews + Send message/Follow).
- **P1 — Không nút Lưu (heart), không "Sản phẩm tương tự" / "Thêm từ shop này"** → cụt phễu khám phá.
- **P2 —** Tình trạng mới chỉ là badge 1 dòng; thêm mô tả tình trạng/thời gian dùng/lý do bán (đặc trưng đồ cũ).

### Home — `features/products/screens/home-screen.tsx`
Mạnh: cấu trúc chợ tốt (quick-links → trust → chips → rail → feed 2 cột vô hạn), pull-to-refresh.
- **P1 — Skeleton** thay cho spinner toàn màn.
- **P2 — Empty state feed** nghèo (1 dòng chữ) → thêm icon + CTA "Khám phá danh mục / Đăng bán".

### Search — `features/products/screens/search-screen.tsx`
Mạnh: debounce 350ms, chip lọc giá, phân biệt empty vs no-result, đếm kết quả.
- **P0/P1 — Thiếu Sort & Filter đúng nghĩa:** mới lọc mỗi giá. Cần sort (mới nhất/giá) + filter tình trạng/danh mục/thương hiệu/size/vị trí — trụ cột tìm đồ cũ.
- **P1 — Thiếu lịch sử tìm + gợi ý** (recent searches, từ khoá hot, gợi ý danh mục).
- **P2 —** Icon kính lúp tự vẽ bằng `View`, chỗ khác dùng Feather → thống nhất.

### Category — `features/products/screens/category-screen.tsx`
Mạnh: header gọn, grid 2 cột nhất quán với home.
- **P0/P1 — Không phân trang** (cứng trang 1, 20 món) → danh mục nhiều hàng bị cụt. Thêm infinite scroll như home.
- **P1 — Không sort/filter** (vào danh mục là lúc cần lọc nhất).
- **P2 —** Thiếu bộ đếm tổng số món (search có, category không → lệch).

### Sell / Đăng bán — `features/products/screens/sell-screen.tsx`
Mạnh: validation inline theo field, nút Đăng bán sticky, chip chọn tình trạng/danh mục.
- **P0 — Chỉ 1 ảnh.** Cần **grid nhiều ảnh (5–10) + đánh dấu ảnh bìa + kéo sắp xếp**. Ảnh là yếu tố bán hàng số 1. *(ref: [Vinted](https://mobbin.com/screens/5e56c81c-24c7-4675-b1fd-be1dfb730b02), [Depop](https://mobbin.com/screens/222b259f-8468-44b3-b64e-d843216d9a69))*
- **P1 — Thiếu field Size & Brand** (đồ cũ sinh viên chủ yếu là quần áo) + nên chuyển danh mục sang **list-row "Danh mục >"** mở picker thay vì chip cuộn ngang (giấu lựa chọn).
- **P2 —** Đếm ký tự mô tả + gợi ý khoảng giá.

### Cart — `features/cart/screens/cart-screen.tsx`
Mạnh: dòng SP rõ (ảnh/tên/giá/stepper), có empty + guest state, footer sticky tổng tiền.
- **P0 — Checkout mới là placeholder.** Thiếu **chọn địa chỉ + phí ship (GHN đã có ở BE!) + phương thức thanh toán** trước khi ra tổng cuối. *(ref: [Shopee/SHEIN](https://mobbin.com/screens/408215b0-54a3-4bf2-ab44-3c535a50ce02), [Vestiaire](https://mobbin.com/screens/98b5832a-d375-4ca8-bd1a-f84b48821303))*
- **P1 — Tổng tiền chỉ "Tạm tính", thiếu breakdown** (ship, phí dịch vụ, giảm giá). Với **multi-seller GHN đã tách vận đơn**, cart nên **nhóm theo người bán** và tính ship từng seller.
- **P2 —** Checkbox chọn/bỏ từng món + nhãn shop mỗi dòng (mua nhiều seller là bình thường).

### Account — `features/account/screens/account-screen.tsx`
Mạnh: header avatar chữ cái + tên + email, guest state gọn.
- **P0 — Thiếu rating/uy tín + grid "hàng đang bán".** Depop/Vinted lấy profile làm mặt tiền (sao, follower, lưới sản phẩm). Đây là màn nghèo nhất so benchmark. *(ref: [Depop](https://mobbin.com/screens/b95ee887-4855-4252-846f-654ba6f886d3), [Vestiaire](https://mobbin.com/screens/5738fcbf-f215-4f3e-9fca-a2d5369f53ca))*
- **P1 — Thiếu lối tắt** Đơn mua / Đơn bán / Ví-Doanh thu / Đã lưu (mới có mỗi "Cài đặt shop" + "Đăng xuất").
- **P2 —** Nhóm menu settings dạng list-row + cho upload avatar ảnh thật.

### Shop Settings — `features/shop/screens/shop-settings-screen.tsx`
Mạnh: **màn hoàn chỉnh nhất** — form GHN cascade tỉnh→quận→phường reset đúng, validation 7 field, footer Lưu sticky.
- **P1 — Chỉ có địa chỉ lấy hàng, thiếu bản sắc shop** (logo/ảnh bìa, mô tả, chính sách đổi trả) — cần cho niềm tin đồ cũ.
- **P2 —** Cảnh báo khi rời form dở; đưa `errorMsg` lên banner gần footer; phân biệt rõ "tạo mới" vs "cập nhật" shop.

### Orders / Đơn mua — `app/(app)/(tabs)/orders.tsx`
- **P0 — Đang là placeholder 1 dòng.** "Đơn mua" là màn giữ chân quan trọng nhất của sàn: cần **tab trạng thái** (Chờ xác nhận / Đang giao / Đã nhận / Đã huỷ) + **timeline theo dõi GHN** + **card đơn** (ảnh món, tên người bán, giá đỏ, mã vận đơn). *(ref: [Shopee](https://mobbin.com/screens/29e38ecf-4fc7-4ad1-9ebc-20ba74c2bf0a), [Shop](https://mobbin.com/screens/2f9019ad-1886-4bd3-9eb8-8dcde80f0957))*

### Notifications — `app/(app)/(tabs)/notifications.tsx`
- **P0/P1 — Placeholder.** Cần **nhóm theo loại** (đơn hàng / tin nhắn / hệ thống) + trạng thái **đọc/chưa đọc** + empty state. Định hình data shape sớm.

### Messages — `app/(app)/messages.tsx`
Mạnh: header + empty-state phân biệt guest/signedIn, đúng ngôn ngữ phẳng.
- **P1 — Chưa có danh sách hội thoại thật** (row avatar + tên + preview + timestamp + badge chưa đọc).

### Auth (login / register / otp / forgot) — `features/auth/screens/*`
Mạnh: **login đã tốt** (social-first, logo thật, nút Google logo 4 màu, divider chuẩn, disabled rõ). Validation + OTP UX ổn.
- **P0 (nhất quán) — Spacing CTA lệch giữa các màn:** login `marginTop 8`, register `24`, otp `28`, forgot `24` → gom về **1 token chung**.
- **P1 —** Màu lỗi `#B32322` hard-code 3 file → đưa vào token.
- **P2 —** OTP thêm **đếm ngược resend**; forgot bước 2 tự focus ô OTP.

### Onboarding welcome / branch / email-entry — `features/onboarding/screens/*`
- **P0 (nợ kỹ thuật) — Nghi ngờ DEAD SCREEN.** App giờ vào thẳng `/login`; register/forgot điều hướng thẳng `/login` `/otp` `/passkey`, **không đi qua** `/email-entry` `/branch`. → **Xác nhận route entry**; nếu mồ côi thì xoá để giảm nợ điều hướng (`branch-screen` tự nhận tồn tại vì "BE chưa có API tra email").

### Passkey — `features/auth/screens/passkey-screen.tsx`
- **P1 — Vi phạm doctrine phẳng:** `badgeRing`/`badgeCore` dùng `borderRadius: 999`. → xét về vuông 4–8px hoặc coi là ngoại lệ huy hiệu có chủ đích (ghi rõ).
- **P2 —** "Tạo passkey" và "Bỏ qua" hiện làm **y hệt** (đều mock finalize) → rủi ro hiểu nhầm đã bật sinh trắc; cần TODO rõ.

---

## 3. Roadmap ưu tiên (theo phase)

Mỗi phase là một mốc tự đứng được. Làm tuần tự; trong 1 phase các việc có thể chạy song song.

### Phase 0 — Nền design-system *(mở khóa mọi thứ)*
`Skeleton` · `Avatar` + `RatingStars`/`TrustRow` · `Wishlist` store + `HeartButton` · `ImageGallery` · `PhotoUploadGrid` · `BackChevron` · token màu lỗi.
→ Nhỏ, không cần BE, làm 1 lượt để các phase sau không phải chế lẻ.

### Phase 1 — Niềm tin C2C *(khoảng cách lớn nhất)*
1. **Product Detail:** gallery nhiều ảnh + block người bán (avatar/rating/số giao dịch) + nút **Nhắn người bán** + nút Lưu.
2. **Sell:** upload nhiều ảnh (cover + reorder) + field Size/Brand + danh mục dạng list-row.
→ Đây là hai thứ trực tiếp khiến người ta dám mua & dám đăng bán.

### Phase 2 — Phễu mua bán
3. **Cart → Checkout thật:** địa chỉ giao + phí ship GHN (nhóm theo seller) + phương thức thanh toán + breakdown tổng.
4. **Orders:** tab trạng thái + timeline theo dõi GHN + card đơn.

### Phase 3 — Chiều sâu khám phá
5. **Sort & Filter dùng chung** cho Search + Category (tình trạng/danh mục/brand/size/giá) + **phân trang Category**.
6. **Wishlist screen** + "Sản phẩm tương tự" / "Thêm từ shop này" ở detail.

### Phase 4 — Hồ sơ & giữ chân
7. **Account:** rating + grid hàng đang bán + lối tắt (đơn/ví/đã lưu).
8. **Shop identity** (logo/bio/chính sách) · **Notifications** nhóm + đọc/chưa đọc · **Messages** list hội thoại.

### Phase 5 — Polish & nhất quán
9. Đồng bộ spacing/token auth · sửa radius passkey · **skeleton toàn app** · empty states có icon+CTA · **dọn dead onboarding screens**.

---

## 4. Bước tiếp theo cho bạn *(cách tiến hành)*

1. **Duyệt roadmap này** — chọn phase muốn làm trước (khuyến nghị: **Phase 0 → Phase 1**, vì niềm tin C2C là đòn bẩy lớn nhất và Phase 0 mở khóa phần còn lại).
2. Khi chốt phase, mình sẽ **tách thành card trên bảng Maestro** (mỗi card 1 deliverable + checklist) để bạn theo dõi và duyệt trước khi mình code.
3. Mình dựng từng màn theo doctrine phẳng, **verify trực tiếp trên máy ảo** (screenshot) sau mỗi bước, commit checkpoint từng phần.
4. Việc cần bạn/đội BE xác nhận trước khi vào Phase 2: API checkout/ship (GHN đã có multi-seller), data shape orders/notifications.

## Phụ lục — Benchmark tham chiếu (Mobbin, iOS)
- Login social-first: [YNAB](https://mobbin.com/screens/d69a7261-af43-4e82-86dd-7d3e6dd5c8ad) · [Etsy](https://mobbin.com/screens/0fe3b35a-4979-412f-8106-1443cf022e31) · [Tock](https://mobbin.com/screens/dcd968c7-af1d-420e-96de-08da2dd4c8bd)
- Home/discovery: [Depop](https://mobbin.com/screens/e9f88afb-4fae-4358-b397-2761e15ed39a) · [Vinted](https://mobbin.com/screens/4828e059-6470-4fe1-b2c9-dfbf081dc4a8) · [Vestiaire](https://mobbin.com/screens/0fd540ce-5a78-4d39-9132-dfd7df484a4d)
- Product detail: [Vinted](https://mobbin.com/screens/f15927fc-596e-4d40-8f4f-cd3b8f97df2d) · [Grailed](https://mobbin.com/screens/f0d9f701-4f21-4eb7-b887-dc9778f9ae3c) · [Depop](https://mobbin.com/screens/5a00d933-237b-46fc-ab14-4bd8128660da)
- Sell/listing: [Vinted](https://mobbin.com/screens/5e56c81c-24c7-4675-b1fd-be1dfb730b02) · [Depop](https://mobbin.com/screens/222b259f-8468-44b3-b64e-d843216d9a69) · [Grailed](https://mobbin.com/screens/eef532dd-6512-4bff-b2a0-db467170ecdd)
- Cart/checkout: [Shopee/SHEIN](https://mobbin.com/screens/408215b0-54a3-4bf2-ab44-3c535a50ce02) · [Vestiaire](https://mobbin.com/screens/98b5832a-d375-4ca8-bd1a-f84b48821303) · [SSENSE](https://mobbin.com/screens/ed6cef20-18f0-4c37-af10-685ab5e8a2c5)
- Orders/tracking: [Shopee](https://mobbin.com/screens/29e38ecf-4fc7-4ad1-9ebc-20ba74c2bf0a) · [Shop](https://mobbin.com/screens/2f9019ad-1886-4bd3-9eb8-8dcde80f0957) · [Walmart](https://mobbin.com/screens/e75b1beb-b16c-404f-87d0-ed06d05c78dd)
- Seller profile: [Depop](https://mobbin.com/screens/b95ee887-4855-4252-846f-654ba6f886d3) · [Vestiaire](https://mobbin.com/screens/5738fcbf-f215-4f3e-9fca-a2d5369f53ca) · [Grailed](https://mobbin.com/screens/b2e6e673-79ec-4717-aca6-375e69f53f33)
