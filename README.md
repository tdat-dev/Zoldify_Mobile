# Zoldify — App di động

App React Native của Zoldify, sàn mua bán đồ cũ dành cho sinh viên.

Backend nằm ở repo `Zoldify_Backend` (NestJS + MySQL). App gọi vào `/api/v1/...` của backend đó, dùng chung hợp đồng API với web.

## Công nghệ

| Thành phần | Dùng gì | Vì sao |
| --- | --- | --- |
| Nền tảng | Expo SDK 57 (managed) | Build được iOS trên cloud, cả nhóm dùng Windows |
| Điều hướng | Expo Router | File-based, tư duy y hệt Next.js App Router bên web |
| Giao diện | NativeWind | Cú pháp Tailwind giống hệt web, khỏi học hệ style mới |
| Dữ liệu server | TanStack Query | Lo cache, retry, refetch — khỏi tự viết `useEffect` |
| Lưu token | expo-secure-store | Mã hoá bằng Keychain/Keystore, không phải file thường |
| Gọi API | axios | Chung cách viết với web |
| Kiểu dữ liệu | sinh từ `openapi.json` | Đổi API bên backend là bên này báo lỗi ngay |

## Chạy lần đầu

Cần Node.js 20 trở lên và app **Expo Go** trên điện thoại.

```bash
npm install
npm start
```

Quét mã QR bằng Expo Go. Nhấn `a` để mở máy ảo Android, `w` để mở trên trình duyệt.

### Trỏ vào backend nào

Mặc định app gọi backend ở máy bạn. Có một cái bẫy hay mất thời gian:

| Chạy trên | Địa chỉ backend |
| --- | --- |
| Máy ảo Android | `http://10.0.2.2:3000` — trong máy ảo, `localhost` là chính nó, không phải máy tính bạn |
| iOS simulator | `http://localhost:3000` |
| **Điện thoại thật** | `http://<IP-LAN-máy-tính>:3000`, ví dụ `http://192.168.1.12:3000` |

App tự chọn đúng cho hai trường hợp đầu. Điện thoại thật thì tạo file `.env.local`:

```
EXPO_PUBLIC_API_ORIGIN=http://192.168.1.12:3000
```

### Chưa có backend thì làm sao

Không phải ngồi chờ. Repo backend có server giả lập trả dữ liệu đúng hình dạng:

```bash
cd ../Zoldify_Backend && npm run mock     # cổng 4200
```

Rồi đặt `EXPO_PUBLIC_API_ORIGIN=http://10.0.2.2:4200` (hoặc IP LAN). Dựng giao diện trước, backend xong endpoint nào thì đổi cổng về 3000, không phải sửa dòng code nào.

## Các lệnh

| Lệnh | Việc |
| --- | --- |
| `npm start` | Chạy Expo dev server |
| `npm run android` / `ios` / `web` | Mở thẳng trên nền tảng đó |
| `npm run typecheck` | Kiểm kiểu, không xuất file |
| `npm run gen:api` | Sinh lại kiểu dữ liệu từ `openapi.json` của backend |
| `npm run lint` | Kiểm lint |

**Chạy `npm run gen:api` mỗi khi backend đổi API.** Nó đọc `../Zoldify_Backend/openapi.json` nên hai repo phải nằm cạnh nhau.

## Cấu trúc

```
src/
├── api/          schema.d.ts sinh tự động + index.ts đặt tên cho gọn
├── app/          Route theo Expo Router
├── components/   Component dùng lại
├── constants/    Màu, theme
├── hooks/
├── lib/          config, http, token-store, query-client
└── services/     Hàm gọi API theo nhóm nghiệp vụ
```

### Vài chỗ nên đọc trước khi sửa

- `src/lib/config.ts` — một biến môi trường, suy ra hai địa chỉ. REST đi qua `/api/v1`, còn Socket.IO nằm ở gốc `/chat` vì Nest không áp prefix cho gateway.
- `src/lib/http.ts` — mọi response backend đều bị bọc trong `{ statusCode, message, data }`, nên phải đọc `res.data.data`. Trong file có ghi rõ chỗ cần sửa khi backend làm xong endpoint refresh token.
- `src/api/index.ts` — đừng sửa `schema.d.ts` bằng tay, nó bị ghi đè mỗi lần `gen:api`.

## Quy ước làm việc

- Không push thẳng vào `main`, tạo nhánh `feature/ten-chuc-nang`
- Commit theo mẫu `Add: Chức năng đăng nhập`
- Mở Pull Request, cần ít nhất một người khác review

## Tài liệu

Thiết kế hệ thống, sơ đồ, kế hoạch bàn giao: repo backend, thư mục `docs/system-design/`.
