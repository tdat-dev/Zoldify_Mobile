# BA — Trang chủ Zoldify Mobile theo tư duy "CHỢ ĐỒ CŨ"

> Tài liệu phân tích nghiệp vụ (Business Analysis) cho việc dựng lại trang chủ +
> các mục của app mobile. Học **cách sắp xếp component của Shopee**, nhưng suy
> nghĩ theo **chợ đồ cũ C2C của sinh viên**, giữ nguyên ngôn ngữ thị giác Zoldify.
> Ngày: 2026-08-19. Trạng thái: chờ chốt scope để build.

---

## 1. Một câu chốt vấn đề

Shopee là **siêu thị hàng mới sản xuất hàng loạt**: nhiều kho, nhiều size/màu, sale
theo hãng, mua số lượng. Zoldify là **cái chợ trời của sinh viên**: mỗi món là
**một cái duy nhất**, người bán là bạn cùng trường, thứ khiến người ta bấm mua
không phải "giảm 50%" mà là **"món này còn tốt không, người bán có thật không,
lấy hàng có tiện không"**.

Vì vậy: **bê layout/nhịp khối của Shopee thì được, nhưng nội dung từng khối phải
đổi bản chất.** Copy y hệt Shopee (Flash Sale, Voucher, Mall) vào đồ cũ sẽ là AI-slop
đội lốt: đẹp mà vô nghĩa.

## 2. Người dùng & việc cần làm (JTBD)

| Persona | Việc cần làm | Điều họ sợ |
|---|---|---|
| **Người mua (SV)** | Lượn xem có món hời/hợp túi tiền; kiếm nhanh 1 món cụ thể (giáo trình, quạt, xe đạp) | Hàng dỏm, người bán ảo, ship đắt hơn món |
| **Người bán (SV)** | Đăng nhanh món không dùng nữa, bán được sớm | Ngại đăng phức tạp, sợ không ai xem |
| **Cả hai** | Nhắn hỏi, chốt giá, hẹn lấy hàng | Mất thời gian, bị lơ |

Hệ quả: trang chủ phải phục vụ **cả duyệt-lượn (khám phá)** lẫn **bán-nhanh**, và
mọi chỗ đều phải **hạ rào cản niềm tin**.

## 3. Bảy sự thật của chợ đồ cũ → hệ quả thiết kế

1. **Mỗi món là DUY NHẤT (1 cái).** `Product.status` có `sold`; không có kho thật.
   → Không chọn size/màu, không stepper số lượng lớn (giỏ 1/món). Thêm nhãn
   **"Còn 1"**, khi bán rồi hiện **"Đã bán"** mờ đi. Tạo cảm giác *nhanh tay*.
2. **Không có sale của hãng.** Product **không có** field giảm giá (đã kiểm schema:
   `discount_amount` chỉ ở `Order`). → **Bỏ Flash Sale kiểu Shopee.** Thay bằng
   **"Mới về"** (theo `created_at`) — đúng động lực chợ đồ cũ: *ai nhanh người đó được*.
3. **Niềm tin là rào cản #1.** → Đẩy lên bề mặt: **tình trạng** (`condition`),
   **ảnh thật nhiều góc** (`images[]`), **đã bán** (`sold_count`) / **lượt xem**
   (`view_count`), **uy tín người bán** (`Shop.rating`/`Review`). Đây là "voucher"
   của đồ cũ.
4. **Tính địa phương / cùng trường.** SV mua gần nhau cho rẻ ship. → Về lâu dài:
   "Gần bạn / cùng trường". *Hiện chưa có toạ độ trong schema → để sau, không bịa.*
5. **Người bán = người dùng thường (C2C).** Ai cũng vừa mua vừa bán. → **"Đăng bán"
   phải nổi** (đã làm — nút tròn giữa nav). Thêm khối nhắc **"Bán nhanh món của bạn"**.
6. **Duyệt kiểu lượn chợ** (vào không có mục tiêu rõ). → Feed **"Dạo chợ / Gợi ý"**
   2 cột cuộn vô hạn là **khối chính** — hợp đồ cũ hơn cả Shopee (mỗi lần lượn thấy
   món khác vì hàng độc nhất).
7. **Giá do người bán tự đặt, dải rộng.** → Bộ lọc **tầm tiền** ("Mọi giá" đã có) là
   bộ lọc chính, không phải lọc theo hãng.

## 4. Bản đồ khối: slot của Shopee → phiên bản đồ cũ Zoldify

| Slot Shopee (mobile) | Bản đồ cũ Zoldify | Dữ liệu | Giữ? |
|---|---|---|---|
| Search + camera + giỏ | Search + Tin nhắn + Giỏ (đã có) | — | ✅ có |
| Banner khuyến mãi | Banner **cam kết/hướng dẫn** (an toàn, cách bán) — KHÔNG "sập sàn" | tĩnh | 🟡 placeholder |
| Hàng icon dịch vụ | **QuickLinks** (đã có): Đăng bán · Mới đăng · Dưới 100k · Đơn mua · Ví · Tin nhắn | route thật | ✅ có |
| **Flash Sale** đếm ngược | **"Mới về"** — sản phẩm mới đăng, cuộn ngang | `/products?sort=newest` | ✅ thật |
| Danh mục (grid) | **Chip danh mục** cuộn ngang (đã bỏ grid) | `/categories` | 🟢 làm |
| Voucher / Mall | **"Người bán uy tín"** hoặc **"Món được săn"** (`sold_count`/`view_count`) | cần xác minh endpoint | 🟡 xác minh |
| Daily Discover (feed) | **"Dạo chợ / Gợi ý cho bạn"** — grid 2 cột vô hạn | `/products` phân trang | 🟢 làm (khối chính) |

## 5. Kiến trúc thông tin trang chủ (đề xuất, thứ tự khối)

```
┌ Header (dính): [Mọi giá ▾ | tìm kiếm 🔍]  ✉  🛒
├ Banner an toàn/hướng dẫn  (1 khối mảnh, tĩnh — hoặc bỏ ở MVP)
├ QuickLinks (icon lối tắt)              ← đã có
├ Chip danh mục (cuộn ngang)            ← thay lưới đã bỏ
├ "Mới về"  (cuộn ngang, cờ Còn 1 / tình trạng)
├ [Người bán uy tín / Món được săn]      ← nếu có data, không thì bỏ
└ "Dạo chợ" — grid 2 cột cuộn vô hạn     ← khối chính
```

## 6. Đặc tả từng khối (mô tả · dữ liệu · ưu tiên · nghiệm thu)

- **B1. Chip danh mục (cuộn ngang)** — P1
  - Chip nhỏ (icon/chữ), bấm → `/category/[id]`. Phẳng 4px, hairline, không pill tròn.
  - Data: `/categories` (có `product_count`). Ảnh danh mục không tồn tại → dùng chữ/không icon.
  - Xong khi: cuộn mượt, bấm lọc đúng danh mục.

- **B2. "Mới về" (cuộn ngang)** — P1
  - Tiêu đề + "Xem tất cả". Card nhỏ: ảnh vuông, **chip tình trạng**, giá đỏ, nhãn **"Còn 1"**.
  - Data: `/products?sort=newest` (hoặc `current/pageSize` mặc định đã là mới nhất).
  - Xong khi: hiện 8–10 món mới nhất, bấm vào ra chi tiết.

- **B3. Card sản phẩm "kiểu đồ cũ"** (dùng chung feed + Mới về) — P1
  - Nâng cấp `ProductCard`: thêm **chip tình trạng** góc ảnh, dòng phụ **"Đã bán N · N xem"**
    khi có; **freeship** nếu `is_freeship`; giá đỏ; khi `status==='sold'` → phủ mờ "Đã bán".
  - Data: field thật (`condition`, `sold_count`, `view_count`, `is_freeship`, `status`).

- **B4. "Dạo chợ" — feed 2 cột vô hạn** — P0 (khối chính)
  - Header dính "Dạo chợ". Grid 2 cột, **infinite scroll** (`useInfiniteQuery`).
  - Data: `/products` phân trang (`current/pageSize`, đọc `meta` để biết còn trang).
  - Xong khi: cuộn tới đáy tự tải trang sau; hết thì dừng gọn.

- **B5. Banner an toàn/hướng dẫn** — P2 (placeholder)
  - 1 dải mảnh, nội dung *thật của Zoldify*: "Kiểm hàng khi nhận · Giữ tiền qua Zoldify
    (escrow) · Cách đăng bán 30 giây". KHÔNG hình sale giả.
  - Data: tĩnh. Ghi rõ là tĩnh, không giả số liệu.

- **B6. "Người bán uy tín / Món được săn"** — P2 (cần xác minh)
  - Cần endpoint xếp theo `rating`/`sold_count`/`view_count`. Nếu chưa có → **bỏ ở MVP**.

## 7. Của Shopee — CHỦ ĐỘNG BỎ (không hợp đồ cũ)

- Flash Sale đếm ngược theo hãng · Voucher/mã giảm · "Mall/chính hãng" · chọn
  size/màu (variant) · mua số lượng nhiều · "sản phẩm tương tự nhiều kho" · nền cam
  sặc sỡ / bo tròn / gradient. → Tất cả trái bản chất "1 món độc nhất, người bán là bạn".

## 8. Chất riêng Zoldify (để không phải bản photocopy)

- **Ngôn ngữ "chợ"**: "Mới về", "Dạo chợ", "Còn 1", "Bán nhanh món của bạn" — giọng
  người bán thật, không giọng quảng cáo AI.
- **Tình trạng là ngôi sao**: chip Như mới/Tốt… hiện ngay trên card (thứ Shopee không cần).
- **Thị giác sổ kê**: phẳng, góc 4px, hairline, giá đỏ, xanh brand `#2C67C8`, Be Vietnam
  Pro — nhìn là biết Zoldify chứ không phải Shopee nhuộm xanh.
- **An toàn là điểm bán**: nhắc escrow/kiểm hàng thay cho "flash sale".

## 9. Dữ liệu sẵn có (map field backend — đã kiểm schema)

- `Product`: `name, price, image, images[], condition, is_freeship, sold_count,
  view_count, status(draft|pending|active|sold|rejected), brand, spec, category, seller`.
- `/products` nhận: `current, pageSize, q, price_min, price_max, category_id, seller_id, sort`.
- `/categories`: có `product_count`. `Shop`/`Review`: có `rating` (uy tín người bán).
- **KHÔNG có**: giảm giá theo sản phẩm, banner khuyến mãi, toạ độ/vị trí. → 3 thứ này
  là placeholder hoặc để sau, **không bịa**.

## 10. Ưu tiên & lộ trình

- **MVP (làm ngay)**: B4 Dạo chợ (infinite) · B3 Card đồ cũ (tình trạng + social proof)
  · B2 Mới về · B1 Chip danh mục.
- **Sau**: B5 Banner an toàn (tĩnh) → B6 Người bán uy tín (khi có endpoint) → Gần bạn/cùng
  trường (khi có vị trí) → theo dõi người bán (`/follow` có trong schema).

## 11. Giả định & câu hỏi mở

1. "Mới về" = mới nhất theo `created_at`. Backend có nhận `sort=newest` không, hay
   mặc định `/products` đã trả mới nhất? (kiểm lúc build)
2. Có ẩn `status !== 'active'` khỏi feed không? (mặc định nên chỉ hiện `active`).
3. Banner an toàn: làm placeholder tĩnh hay bỏ hẳn ở MVP?
4. "Người bán uy tín": có endpoint xếp theo rating chưa, hay bỏ ở MVP?
