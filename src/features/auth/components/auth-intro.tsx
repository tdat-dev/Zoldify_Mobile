import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Palette } from '@/components/ui/theme';

// Logo Zoldify thật (wordmark gradient), port từ web public/images/logo.webp.
const LOGO = require('../../../../assets/images/zoldify-logo.webp');

/**
 * Đầu màn xác thực: neo thương hiệu Zoldify + tiêu đề + phụ đề, và (tuỳ chọn)
 * ba điểm tin cậy — bản mobile của AuthShell web. Có mặt để màn đăng nhập/
 * đăng ký không còn là "form trắng vô hồn": khách nhập mật khẩu ngay lúc cần
 * thấy mình đang ở đúng Zoldify, và ba dòng tin cậy lấp khoảng trống dọc.
 */

const TRUST = [
  { icon: 'shield', text: 'Giữ tiền an toàn tới khi bạn nhận hàng' },
  { icon: 'users', text: 'Gặp mặt trao tay ngay tại trường' },
  { icon: 'tag', text: 'Đăng tin bán miễn phí' },
] as const;

export function AuthIntro({
  title,
  lead,
  trust = false,
}: {
  title: string;
  lead?: string;
  /** Hiện 3 điểm tin cậy (dùng cho login/register để tạo niềm tin + lấp trống). */
  trust?: boolean;
}) {
  return (
    <View style={styles.root}>
      <Image
        source={LOGO}
        style={styles.logo}
        contentFit="contain"
        accessibilityLabel="Zoldify"
      />

      <View style={styles.head}>
        <Text variant="title" style={styles.title}>
          {title}
        </Text>
        {lead ? (
          <Text variant="bodyMuted" style={styles.lead}>
            {lead}
          </Text>
        ) : null}
      </View>

      {trust ? (
        <View style={styles.trust}>
          {TRUST.map((t) => (
            <View key={t.icon} style={styles.trustRow}>
              <Feather name={t.icon} size={16} color={Palette.brand} />
              <Text variant="bodyMuted">{t.text}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Căn giữa cả khối đầu màn: logo + tiêu đề + phụ đề + điểm tin cậy.
  root: { marginTop: 4, marginBottom: 24, alignItems: 'center' },
  // 480×147 → tỉ lệ ~3.27; cao 42 ⇒ rộng ~137. To hơn cho nổi thương hiệu.
  logo: { width: 137, height: 42 },
  head: { marginTop: 16, alignItems: 'center' },
  title: { textAlign: 'center' },
  lead: { marginTop: 8, textAlign: 'center' },
  // Nhóm điểm tin cậy căn giữa, các dòng canh trái đều nhau cho gọn.
  trust: { marginTop: 20, gap: 10, alignSelf: 'center' },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
