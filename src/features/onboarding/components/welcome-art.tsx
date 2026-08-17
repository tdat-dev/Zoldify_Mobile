import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Palette } from '@/components/ui/theme';
import type { SlideKey } from '@/features/onboarding/data/slides';

/**
 * Minh hoạ code-drawn cho mỗi slide — hình khối tối giản theo tông brand,
 * không dùng file ảnh. Giữ nhẹ, có điểm nhấn, không loè loẹt.
 */
export function WelcomeArt({ slide }: { slide: SlideKey }) {
  return (
    <View style={styles.stage}>
      {slide === 'buy' ? <BuyArt /> : slide === 'sell' ? <SellArt /> : <SafeArt />}
    </View>
  );
}

function BuyArt() {
  return (
    <View style={styles.center}>
      {/* card sau, nghiêng nhẹ */}
      <View style={[styles.cardBack]} />
      {/* card trước */}
      <View style={styles.cardFront}>
        <View style={styles.photo} />
        <View style={styles.lineWide} />
        <View style={styles.lineNarrow} />
        <View style={styles.pricePill}>
          <Text style={styles.pricePillText}>150.000đ</Text>
        </View>
        <View style={styles.discount}>
          <Text style={styles.discountText}>-40%</Text>
        </View>
      </View>
    </View>
  );
}

function SellArt() {
  return (
    <View style={styles.center}>
      <View style={styles.sellCard}>
        <View style={styles.uploadBox}>
          <View style={styles.plusV} />
          <View style={styles.plusH} />
        </View>
        <View style={styles.tagPill}>
          <Text style={styles.tagPillText}>Đăng bán</Text>
        </View>
      </View>
    </View>
  );
}

function SafeArt() {
  return (
    <View style={styles.center}>
      <View style={styles.badgeRing}>
        <View style={styles.badgeCore}>
          <View style={styles.check} />
        </View>
      </View>
      <View style={styles.safePill}>
        <Text style={styles.safePillText}>Ký quỹ an toàn</Text>
      </View>
    </View>
  );
}

const CARD_SHADOW = {
  shadowColor: '#1E293B',
  shadowOpacity: 0.1,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 12 },
  elevation: 6,
};

const styles = StyleSheet.create({
  stage: { height: 280, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },

  // BUY
  cardBack: {
    position: 'absolute',
    width: 150,
    height: 196,
    borderRadius: 22,
    backgroundColor: Palette.brandLight,
    transform: [{ rotate: '-8deg' }, { translateX: -46 }, { translateY: 6 }],
  },
  cardFront: {
    width: 168,
    height: 214,
    borderRadius: 22,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.line,
    padding: 14,
    transform: [{ rotate: '4deg' }, { translateX: 20 }],
    ...CARD_SHADOW,
  },
  photo: {
    height: 104,
    borderRadius: 14,
    backgroundColor: Palette.brandLight,
    marginBottom: 14,
  },
  lineWide: {
    height: 10,
    width: '80%',
    borderRadius: 6,
    backgroundColor: '#E9EEF6',
    marginBottom: 8,
  },
  lineNarrow: {
    height: 10,
    width: '52%',
    borderRadius: 6,
    backgroundColor: '#EDF1F7',
  },
  pricePill: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    backgroundColor: Palette.brand,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pricePillText: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 13, color: Palette.white },
  discount: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: Palette.success,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  discountText: { fontFamily: 'BeVietnamPro_700Bold', fontSize: 12, color: Palette.white },

  // SELL
  sellCard: {
    width: 200,
    height: 214,
    borderRadius: 22,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    ...CARD_SHADOW,
  },
  uploadBox: {
    width: 110,
    height: 110,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#9DB6DF',
    backgroundColor: Palette.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusV: { position: 'absolute', width: 4, height: 34, borderRadius: 2, backgroundColor: Palette.brand },
  plusH: { position: 'absolute', width: 34, height: 4, borderRadius: 2, backgroundColor: Palette.brand },
  tagPill: {
    backgroundColor: Palette.brandLight,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tagPillText: { fontFamily: 'BeVietnamPro_600SemiBold', fontSize: 14, color: Palette.brand },

  // SAFE
  badgeRing: {
    width: 168,
    height: 168,
    borderRadius: 999,
    backgroundColor: Palette.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCore: {
    width: 108,
    height: 108,
    borderRadius: 999,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    ...CARD_SHADOW,
  },
  check: {
    width: 40,
    height: 22,
    borderLeftWidth: 6,
    borderBottomWidth: 6,
    borderColor: Palette.success,
    transform: [{ rotate: '-45deg' }],
    marginTop: -6,
  },
  safePill: {
    marginTop: 22,
    backgroundColor: '#E7F6EC',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  safePillText: { fontFamily: 'BeVietnamPro_600SemiBold', fontSize: 14, color: Palette.success },
});
