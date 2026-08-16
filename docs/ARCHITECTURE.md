# Kiến trúc app Zoldify Mobile — đánh giá & cấu trúc mục tiêu

> Tài liệu này rà soát scaffold hiện tại và đề xuất cấu trúc để dự án **scale** được
> (sàn TMĐT nhiều nghiệp vụ: product, cart, order, payment/escrow, wallet, chat, review,
> notification, auth). Xếp việc theo ưu tiên **P0 → P2**. Nguồn dẫn ở cuối file.

## 1. Kết luận nhanh

**Hạ tầng đang tốt, nhưng cách *tổ chức thư mục* sẽ gãy khi scale.**

- ✅ Đã tốt: `strict` TS + path alias `@/*`; `typedRoutes` + `reactCompiler` (SDK 57);
  `http.ts` tách khỏi router; token cất bằng SecureStore (Keychain/Keystore); type sinh từ
  `openapi.json`; TanStack Query đã tinh chỉnh cho mạng di động.
- ⚠️ Vấn đề gốc: cấu trúc **layer-based** (`api/ components/ services/ lib/ hooks/`). Với ~10
  nghiệp vụ, `services/` và `components/` sẽ thành bãi rác, các feature dính chặt vào nhau qua
  file dùng chung. Chuẩn ngành 2025–2026 cho app lớn là **feature-first**.

→ **Việc lớn nhất: chuyển sang feature-first.** Làm sớm khi mới có 3 màn hình thì gần như miễn
phí; để sau 30 màn hình thì rất đau.

## 2. Cấu trúc mục tiêu (feature-first)

Mô phỏng theo template Obytes (production, cùng stack: Expo Router + TanStack Query + Zustand +
NativeWind + axios + react-hook-form). Nguyên tắc: **route file chỉ re-export màn hình; logic
sống trong `features/`; hạ tầng dùng chung ở `lib/` và `components/ui/`.**

```
src/
  app/                          # Expo Router — CHỈ định tuyến, mỗi file re-export 1 screen
    _layout.tsx                 #   root: providers + ErrorBoundary + auth gate
    (auth)/
      _layout.tsx
      login.tsx                 #   export { default } from '@/features/auth/screens/login-screen'
      register.tsx
      forgot-password.tsx
    (app)/
      _layout.tsx               #   stack cho vùng đã đăng nhập
      (tabs)/
        _layout.tsx             #   Tabs của Expo Router
        index.tsx               #   Trang chủ  (products/screens/home-screen)
        search.tsx
        cart.tsx
        orders.tsx
        chat.tsx
        profile.tsx
      products/[id].tsx         #   chi tiết sản phẩm
      products/new.tsx          #   đăng bán
      checkout/index.tsx
      checkout/payment.tsx
      orders/[id].tsx
      chat/[threadId].tsx
      wallet/index.tsx
      wallet/withdraw.tsx
    +not-found.tsx

  features/                     # ★ TRÁI TIM — mỗi nghiệp vụ 1 thư mục, tự chứa
    auth/
      screens/                  #   login-screen.tsx, register-screen.tsx …
      components/               #   login-form.tsx …
      api.ts                    #   query/mutation hooks + query-key factory của auth
      store.ts                  #   Zustand: phiên đăng nhập (user hiện tại, cờ đã-login)
      types.ts
    products/
      screens/                  #   home-screen, product-detail-screen, create-product-screen
      components/               #   product-card, product-grid, price-tag …
      api.ts                    #   useProducts(), useProduct(id), productKeys
      hooks.ts
      types.ts
    cart/
    orders/
    payments/                   #   luồng escrow — mutation KHÔNG optimistic (tiền bạc)
    wallet/
    chat/                       #   hook subscribe socket → ghi vào cache TanStack Query
    notifications/
    reviews/
    shop/
    addresses/

  components/
    ui/                         # Design system: button, input, text, sheet, colors.ts, icons/
    (bỏ dần các component lẻ hiện tại vào ui/ hoặc feature tương ứng)

  lib/
    api/
      client.ts                #   axios instance + interceptor (token, refresh-queue, chuẩn hoá lỗi)
      query-client.ts          #   cấu hình + (tuỳ chọn) persister offline
      query-provider.tsx
    auth/
      token-store.ts           #   SecureStore (đang có, chuyển vào đây)
      refresh.ts               #   single-flight refresh token
    socket.ts                  #   khởi tạo Socket.IO, tái kết nối, gắn token
    env.ts                     #   ★ validate process.env bằng zod, fail-fast
    config.ts                  #   suy ra API_URL / SOCKET_URL từ env đã validate
    i18n/                      #   (khi cần đa ngôn ngữ)
    flags.ts                   #   feature flags (nếu dùng)
    hooks/                     #   hook generic dùng nhiều feature
    utils/

  api/                          # GIỮ: type sinh từ openapi (schema.d.ts + index.ts)

  translations/                 # vi.json, en.json (khi cần)

.maestro/                       # E2E flow (YAML) — chạy được với Expo Go/dev build trong CI
eas.json                        # profiles: development / preview / production
```

**Vì sao route file phải mỏng:** Metro có ràng buộc với file trong `app/` (không barrel export,
fast-refresh). Để logic ra `features/screens` giúp test màn hình không cần router, và đổi điều
hướng không đụng nghiệp vụ.

## 3. Việc cần thêm/sửa — theo ưu tiên

### P0 — làm trước khi code nhiều màn hình (nếu không sẽ phải refactor lớn)

1. **Chuyển sang feature-first** như cây trên. Bây giờ chỉ có 3 route + 2 service → di chuyển
   rẻ. Route dùng `export { default } from '@/features/...'`.
2. **Route groups + auth gate**: tạo `(auth)` và `(app)`, root `_layout.tsx` đọc trạng thái
   đăng nhập để lộ nhóm phù hợp (hoặc `<Stack.Protected>` nếu bản Expo Router đủ mới). Hiện
   `_layout.tsx` đang tự render `<AppTabs>` custom — nên chuyển sang `Tabs` của Expo Router
   trong `(app)/(tabs)/_layout.tsx` để có deep-link + typed routes đúng.
3. **Query-key factory cho mỗi feature** (bỏ key viết tay inline). Mẫu:
   ```ts
   export const productKeys = {
     all: ['products'] as const,
     lists: () => [...productKeys.all, 'list'] as const,
     list: (f: ProductFilters) => [...productKeys.lists(), f] as const,
     details: () => [...productKeys.all, 'detail'] as const,
     detail: (id: number) => [...productKeys.details(), id] as const,
   };
   ```
   Nhờ đó `invalidateQueries` trúng đích (vd webhook thanh toán → invalidate `orderKeys`, socket
   đẩy 1 đơn → chỉ `orderKeys.detail(id)`).
4. **Colocate query hook vào `features/*/api.ts`.** Service hiện trả `AxiosResponse` thô, màn
   hình phải tự bóc `res.data.data` và tự viết `useQuery`. Gom thành `useProducts()` sẵn dùng.
5. **`lib/env.ts` validate bằng zod.** Hiện `config.ts` đọc `process.env` thẳng — sai/thiếu biến
   là lỗi khó hiểu lúc runtime. Parse 1 lần lúc khởi động, fail-fast ở dev.
6. **Refresh token (single-flight).** `http.ts` đang có TODO: 401 hiện chỉ đá về login → user
   bị đăng xuất mỗi ngày. Khi backend có `POST /auth/refresh`, cài interceptor gom mọi request
   401 đồng thời vào **một** lần refresh rồi chạy lại (tránh 20 request bắn 20 lệnh refresh làm
   `token_version` vô hiệu hoá lẫn nhau — đã ghi rõ trong `http.ts`).
7. **Error boundary**: 1 cái ở root `_layout.tsx` (khỏi crash trắng app) + boundary riêng cho
   `checkout/`, `payment/`, `chat/`.

### P1 — cần trước khi lên production

8. **Socket ↔ TanStack Query**: `lib/socket.ts` + hook trong `features/chat`. Không bọc `useQuery`
   quanh socket. Pattern: REST + `useInfiniteQuery` lo lịch sử/pagination; socket event →
   `queryClient.setQueryData` / `invalidateQueries`. Socket là *trigger*, Query là nguồn sự thật.
9. **Design-system layer**: gom primitive vào `components/ui/` + token màu (`ui/colors.ts` khớp
   `tailwind.config`). Tránh rải class Tailwind tuỳ tiện mỗi màn — sàn cần nhất quán thị giác.
10. **Testing**: `jest-expo` + `@testing-library/react-native` (unit/component), **Maestro** cho
    E2E (YAML trong `.maestro/`). Ưu tiên test luồng tiền: checkout, wallet, escrow.
11. **`eas.json`** 3 profile: `development` (dev-client), `preview` (APK nội bộ cho tester),
    `production` (AAB/IPA ký store). Dùng `extends` cho gọn.
12. **Sentry** (`@sentry/react-native` + `expoRouterIntegration`) để bắt crash/perf theo route.
    Cần **dev build** (Expo Go không bắt crash native); upload sourcemap trong CI cho OTA.
13. **Lint/format/hook**: `eslint-config-expo` + Prettier + Husky + lint-staged (pre-commit).

### P2 — khi có nhu cầu

14. **Persist cache offline**: `@tanstack/query-async-storage-persister`. **Chỉ** persist catalog
    /product (rẻ, chịu được cũ). **KHÔNG** persist số dư ví, trạng thái escrow/payment, lịch sử
    chat — persister phát lại data cũ trước khi revalidate, nguy hiểm cho màn hình tiền.
15. **Optimistic update** (`onMutate`) cho cart/wishlist/review. **KHÔNG** optimistic cho
    payment/escrow — hiện trạng thái "pending", chờ server xác nhận.
16. **i18n** (`lib/i18n` + `translations/`) nếu cần EN.
17. **Feature flags** (`lib/flags.ts`) nếu cần bật/tắt tính năng từ xa.
18. **OpenAPI codegen hook** (Orval / Hey API) sinh thẳng typed TanStack Query hook từ
    `openapi.json` — cân nhắc thay cho việc tự viết hook, khi số endpoint nhiều.

## 4. Những gì KHÔNG nên làm (tránh over-engineer)

- **Không** dùng Repository Pattern (interface + impl swappable). App 1 backend, đã có TanStack
  Query làm lớp cache/abstraction → thêm repository chỉ là ceremony thừa. (Chỉ đáng khi có
  multi-backend hoặc offline-first với DB local như SQLite/WatermelonDB.)
- **Không** đổ data server vào Zustand "cho chắc". Server state = TanStack Query; Zustand chỉ giữ
  state client thuần: phiên đăng nhập, cart tạm trước checkout, thread chat đang mở, theme/locale.

## 5. Nguồn tham khảo

- Obytes RN starter (cùng stack): https://starter.obytes.com/getting-started/project-structure/ ·
  https://github.com/obytes/react-native-template-obytes
- Expo — folder structure: https://expo.dev/blog/expo-app-folder-structure-best-practices
- Expo Router — navigation patterns: https://docs.expo.dev/router/basics/common-navigation-patterns/ ·
  error handling: https://docs.expo.dev/router/error-handling/ · linking: https://docs.expo.dev/linking/overview/
- TkDodo — Effective React Query Keys: https://tkdodo.eu/blog/effective-react-query-keys
- TanStack persister (offline caveats): https://github.com/TanStack/query/discussions/8147
- Socket.IO + TanStack Query: https://blog.logrocket.com/tanstack-query-websockets-real-time-react-data-fetching/
- Env + zod: https://starter.obytes.com/getting-started/environment-vars-config/
- Testing (jest-expo): https://docs.expo.dev/develop/unit-testing/ · Maestro: https://docs.maestro.dev/get-started/supported-platform/react-native
- EAS profiles: https://docs.expo.dev/build/eas-json/ · Sentry: https://docs.expo.dev/guides/using-sentry/
- Orval: https://orval.dev/docs/guides/react-query/
