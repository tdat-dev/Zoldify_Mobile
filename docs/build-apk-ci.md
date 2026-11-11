# Build APK trên GitHub Actions

Workflow `.github/workflows/build-apk.yml` build APK Android trên runner của GitHub (miễn phí vì repo public), nên máy dev không cần chạy Gradle nữa. Bước dựng chung (Node, JDK 17, `npm ci`, `expo prebuild`, google-services.json, keystore, cache Gradle) nằm ở `.github/actions/prepare-android/action.yml`.

## Hai loại APK

| Loại | Job | Gradle | Dùng khi |
|---|---|---|---|
| Release | `release` | `assembleRelease` | Cài lên máy thật hoặc máy ảo để test, JS đã nhúng sẵn, không cần Metro |
| Dev client | `dev-client` | `assembleDebug` | Sửa JS và thấy ngay qua Metro, chỉ cần build lại khi đổi native (thêm/bỏ module native, sửa app.json phần native) |

APK release ký bằng `debug.keystore` có SHA-1 `5e8f16062ea3cd2c4a0d547876baa6f38cabf625`, đúng cái đã đăng ký Android OAuth client trong Firebase project `zoldify`, nên Google Sign-In native chạy được. Job release tự kiểm SHA-1 này và kiểm bundle có chứa đúng domain API; sai là job đỏ.

## Cách chạy

**Tự động:** mỗi lần push lên nhánh `fix/**`, `feat/**`, `ci/**`, `staging` sẽ build một APK release **staging** (ABI `arm64-v8a,x86_64`). Push lên `main` thì build APK **prod** và tự phát hành lên GitHub Release (xem mục "Phát hành cho người dùng"). Commit chỉ sửa `docs/**` hoặc file `.md` thì không build. Push mới lên cùng nhánh sẽ huỷ lượt build cũ đang chạy.

**Bấm tay:** tab Actions, chọn "Build APK", "Run workflow", chọn nhánh rồi điền:

- `env`: `staging` (https://api-staging.zoldify.com) hoặc `prod` (https://api.zoldify.com)
- `abi`: `arm64-v8a,x86_64` (mặc định: điện thoại đời mới + máy ảo), đủ 4 ABI cho máy cũ 32-bit, hoặc chỉ một ABI để build nhanh hơn
- `release`: có build APK release không
- `dev_client`: tick để build thêm APK dev client
- `publish`: tạo GitHub Release từ APK vừa build, cần `env` là `prod`. Chạy trên `main` thì thành bản Latest; chạy trên nhánh khác chỉ tạo **bản nháp** để xem trước, không ai tải được qua nút trên web

Nút "Run workflow" chỉ hiện khi file workflow đã có trên nhánh mặc định `main` (tức sau khi PR `ci/build-apk` được merge); trước đó chỉ có build tự động khi push. Sau khi merge, chạy bằng dòng lệnh cũng được:

```
gh workflow run build-apk.yml -R tdat-dev/Zoldify_Mobile --ref <nhánh> -f env=prod -f dev_client=true
```

## Tải APK

Trang của lượt chạy (Actions, bấm vào run) có mục **Artifacts**, tên dạng:

- `zoldify-staging-<7 ký tự sha>.apk`, `zoldify-prod-<sha>.apk`
- `zoldify-devclient-<sha>.apk`

Artifact giữ 14 ngày. Tải bằng dòng lệnh:

```
gh run list -R tdat-dev/Zoldify_Mobile --workflow build-apk.yml --limit 5
gh run download <run-id> -R tdat-dev/Zoldify_Mobile -D D:\Zoldify\apk\ci
adb install -r D:\Zoldify\apk\ci\zoldify-staging-xxxxxxx.apk\zoldify-staging-xxxxxxx.apk
```

Build lần đầu (chưa có cache) mất khoảng 30 đến 40 phút; các lần sau nhanh hơn nhờ cache Gradle.

## Phát hành cho người dùng

Android phát qua GitHub Release của repo này. Nút "Tải app cho Android" ở footer zoldify.com trỏ tới `releases/latest/download/Zoldify.apk`, nên mỗi bản phát hành **phải** có file tên đúng `Zoldify.apk` và phải là bản Latest. Thiếu file là nút tải trả 404.

**Từ 08/11/2026 việc này tự chạy:** merge vào `main` là job `publish` build APK prod rồi tạo Release `android-<yyyy-mm-dd>-<sha>` gồm `Zoldify.apk` và `Zoldify-<yyyy-mm-dd>-<sha>-prod.apk`, đặt làm Latest, rồi tự kiểm Latest đúng là bản vừa tạo và có `Zoldify.apk`. Không ai phải build hay tải tay nữa.

- Ghi chú lấy từ tiêu đề commit kể từ bản Android trước, soạn bằng `scripts/ghi-chu-phat-hanh.mjs`: bỏ tiền tố `feat:`, `fix:`, bỏ commit `ci`, `docs`, `test`, `chore`, `style`, `build`, `refactor`, rồi chia hai mục "Có gì mới" và "Sửa lỗi". Commit không theo tiền tố thì bắt đầu bằng "Sửa" là vào mục Sửa lỗi. Viết tiêu đề commit như câu cho người dùng đọc là ghi chú không cần sửa tay.
- Nếu từ bản trước tới giờ chỉ đổi `.github/`, `docs/` hoặc file `.md` thì không tạo Release, vì app không đổi gì.
- Muốn phát hành lại dù không đổi code: Actions, "Build APK", "Run workflow" trên `main`, chọn `env` là `prod` và tick `publish`.
- Bản nháp tạo từ nhánh khác có đuôi `-nhap`; xem xong thì xoá bằng `gh release delete <tag> -R tdat-dev/Zoldify_Mobile --yes`.

Làm tay (khi CI hỏng):

```
gh release create android-<yyyy-mm-dd> Zoldify.apk Zoldify-<yyyy-mm-dd>-prod.apk -R tdat-dev/Zoldify_Mobile --target <sha trên main> --latest
```

Bản phát hành iOS phải tạo với `--latest=false`, không thì `latest` chuyển sang bản đó và nút tải Android hỏng theo.

## Dùng dev client với staging

1. Tải và cài `zoldify-devclient-<sha>.apk` lên máy (một lần, đến khi native đổi).
2. Trên máy tính, trong thư mục repo, chạy Metro trỏ staging:

```
$env:EXPO_PUBLIC_API_ORIGIN="https://api-staging.zoldify.com"
$env:EXPO_PUBLIC_MEDIA_ORIGIN="https://zoldify.com"
npx expo start --dev-client
```

3. Mở app Zoldify (dev client) trên máy, chọn server Metro hiện trong danh sách hoặc quét mã QR. Máy thật phải cùng mạng LAN với máy tính; khác mạng thì thêm `--tunnel`. Máy ảo Android thì dùng `adb reverse tcp:8081 tcp:8081` rồi mở `http://localhost:8081`.

Biến `EXPO_PUBLIC_*` của dev client lấy từ môi trường lúc chạy Metro, không phải lúc build APK. Đổi sang prod chỉ cần chạy lại Metro với `https://api.zoldify.com`.

## Secret và biến của repo

Xem/sửa ở Settings, Secrets and variables, Actions.

| Tên | Loại | Nội dung |
|---|---|---|
| `ANDROID_KEYSTORE_BASE64` | secret | `debug.keystore` dạng base64 (alias `androiddebugkey`, mật khẩu `android`) |
| `GOOGLE_SERVICES_JSON_BASE64` | secret | `google-services.json` của Firebase project `zoldify` dạng base64 |
| `STAGING_EXPO_PUBLIC_API_ORIGIN` | variable | `https://api-staging.zoldify.com` |
| `STAGING_EXPO_PUBLIC_MEDIA_ORIGIN` | variable | `https://zoldify.com` |
| `PROD_EXPO_PUBLIC_API_ORIGIN` | variable | `https://api.zoldify.com` |
| `PROD_EXPO_PUBLIC_MEDIA_ORIGIN` | variable | `https://zoldify.com` |

Lưu ý: `google-services.json` đang commit trong repo thuộc project `zoldify-d2040`, khác project `zoldify` mà backend dùng để gửi push. CI ghi đè file đó bằng secret nên APK từ CI đăng ký FCM vào đúng project `zoldify`.

### Đổi (rotate) secret

Chạy trong PowerShell, base64 đi thẳng qua pipe nên không in ra màn hình:

```
[Convert]::ToBase64String([IO.File]::ReadAllBytes("D:\duong\dan\google-services.json")) | gh secret set GOOGLE_SERVICES_JSON_BASE64 -R tdat-dev/Zoldify_Mobile
[Convert]::ToBase64String([IO.File]::ReadAllBytes("D:\duong\dan\release.keystore")) | gh secret set ANDROID_KEYSTORE_BASE64 -R tdat-dev/Zoldify_Mobile
gh variable set PROD_EXPO_PUBLIC_API_ORIGIN -R tdat-dev/Zoldify_Mobile --body "https://api.zoldify.com"
```

Đổi sang keystore release riêng (khi lên Google Play):

1. Tạo keystore mới, lấy SHA-1 bằng `keytool -list -v -keystore release.keystore`.
2. Đăng ký SHA-1 đó vào app Android trong Firebase project `zoldify` (`firebase apps:android:sha:create`), tải lại `google-services.json` rồi cập nhật secret `GOOGLE_SERVICES_JSON_BASE64`.
3. Cập nhật `ANDROID_KEYSTORE_BASE64`. Workflow hiện mặc định alias `androiddebugkey` và mật khẩu `android` (theo `build.gradle` do prebuild sinh); keystore khác alias/mật khẩu thì cần thêm secret và bước sửa `signingConfigs` trong `prepare-android`.
4. Sửa `EXPECTED_CERT_SHA1` trong `build-apk.yml` thành SHA-1 mới (chữ thường, không dấu hai chấm).
