# Zoldify Mobile — Onboarding & Auth (spec)

Ngày: 2026-08-17 · Nhánh: `refactor/feature-first-structure`

Tham chiếu (chỉ để học flow, KHÔNG copy): Amazon Shopping iOS onboarding.
Chất riêng Zoldify: **tối giản / đáng tin** (xanh brand + xám trung tính, nhiều
whitespace, motion kiệm). Sàn đồ cũ cho sinh viên — "đồ cũ, vẫn chất".

## Phạm vi

8 màn, thứ tự: Splash động → Welcome (carousel) → Nhập email → Nhánh mới/cũ →
Đăng nhập / Tạo tài khoản → OTP → Passkey → vào app.

Chốt (user duyệt 2026-08-17):
- **KHÔNG làm guest home** — giữ auth-gate đã dựng; Welcome gánh vai trò khoe giá trị.
- **Email-first**: 1 ô email → người dùng tự chọn [Đăng nhập] / [Tạo tài khoản]
  (email điền sẵn). Không cần API lookup "email tồn tại chưa".

## Backend alignment (đã soát schema)

| Bước | Endpoint | Thật? |
|------|----------|-------|
| Đăng nhập | `POST /auth/login` `{email,password}` → `{access_token,refresh_token,user}` | ✅ thật |
| Gửi OTP đăng ký | `POST /auth/register/send-otp` `{email,full_name}` | ✅ thật |
| Xác thực OTP | `POST /auth/register/verify-otp` `{email,otp,password}` | ✅ thật |
| (Đăng ký trực tiếp) | `POST /auth/register` `{full_name,email,password,phone_number?,role?}` | dự phòng |
| Passkey (Face ID) | — (backend chưa có webauthn) | ⚠️ mockup UI |

Luồng đăng ký nối API: form (full_name+email+password) → `send-otp` → màn OTP nhập
mã → `verify-otp {email,otp,password}` → **rồi gọi `login {email,password}`** để lấy
token → `signIn()`. (An toàn bất kể verify-otp có trả token hay không — xác nhận
response khi wiring; nếu verify-otp đã trả token thì bỏ bước login.)

Ngoài phạm vi (có endpoint, để sau): `/auth/forgot-password/*`, `/auth/firebase`
(social login). Sẽ để link "Quên mật khẩu?" trỏ tới flow thật ở bước sau.

## Ngôn ngữ thị giác

- Màu: brand `#2C67C8` / dark `#1F4C99` / light `#EFF6FF`; slate (text `#0F172A`,
  phụ `#64748B`, viền `#E2E8F0`, nền `#FFFFFF`); success `#16A34A` cho tín hiệu
  "An toàn / ký quỹ". Không gradient loè loẹt.
- Font: heading = **Space Grotesk** (`@expo-google-fonts/space-grotesk`), body =
  system. Không dùng Inter/Roboto làm mặc định cho mọi thứ.
- Bo góc 12–16px; nút cao 52px bo tròn chữ đậm; motion chỉ trượt/opacity nhẹ.
- Copy giọng sinh viên đời thường, tiếng Việt, không giọng AI.

## Cấu trúc (feature-first)

```
src/components/ui/       button.tsx, text-field.tsx, screen.tsx, brand-mark.tsx
src/features/onboarding/
  screens/  welcome-screen.tsx, email-entry-screen.tsx, branch-screen.tsx
  components/ welcome-slide.tsx, pager-dots.tsx, otp-input.tsx
  data/ slides.ts
src/features/auth/
  screens/ login-screen.tsx (redesign), register-screen.tsx, otp-screen.tsx,
           passkey-screen.tsx
  api.ts (thêm sendRegisterOtp, verifyRegisterOtp, hooks)
  store.ts (đã có)
```

Route (nhóm `(auth)/`, auth-gate + splash đã có):
`welcome` (initial), `email-entry`, `branch`, `login`, `register`, `otp`, `passkey`.
Truyền dữ liệu giữa các bước qua params (email, full_name) hoặc 1 store nhỏ
`onboarding` nếu params rườm rà.

## Trạng thái phải xử lý mỗi màn
loading / lỗi API / rỗng / bàn phím (KeyboardAvoiding) / disabled nút khi thiếu input.

## Ngoài phạm vi đợt này
Guest home, social login, forgot-password UI, đa ngôn ngữ. Passkey chỉ UI (TODO nối
biometric bằng expo-local-authentication sau).
