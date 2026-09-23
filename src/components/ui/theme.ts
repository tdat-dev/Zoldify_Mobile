/**
 * Token thiết kế Zoldify — PORT nguyên từ web frontend (tailwind.config.ts +
 * globals.css) để mobile và web là một ngôn ngữ. Màu web viết bằng OKLCH đã
 * quy đổi sang hex khớp pixel.
 *
 * Doctrine "sổ kê": phẳng, góc gần vuông (4px), hairline (ink 8-12%), KHÔNG
 * bo tròn/pill/glow. Giá màu ĐỎ (quy ước sàn TMĐT Việt).
 */

/** Be Vietnam Pro — thiết kế cho tiếng Việt (giống web). */
export const Font = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
  extrabold: 'BeVietnamPro_800ExtraBold',
} as const;

export const Palette = {
  // Thương hiệu
  brand: '#2C67C8',
  brandDark: '#22539F',
  brandAccent: '#14708A',
  brandTint: '#EDF4FF',

  // Bề mặt: nền trang XÁM NHẠT, khối trắng nổi lên (quy ước Shopee/Lazada)
  surfacePage: '#F2F4F7',
  surfaceCard: '#FFFFFF',
  surfaceSunken: '#E9EDF3',
  white: '#FFFFFF',

  // Chrome tối (header/thanh trên) — xanh đậm cùng hue brand
  chrome: '#043574',
  chromeSoft: '#174A92',

  // Chữ
  ink: '#192029',
  inkMuted: '#5E6570',
  inkFaint: '#666D78',

  // Giá: ĐỎ (quy ước TMĐT Việt)
  price: '#CE1D21',
  priceBg: '#FFE7E3',

  // Viền hairline = ink ở 8% / 12%
  line: 'rgba(25,32,41,0.08)',
  lineStrong: 'rgba(25,32,41,0.12)',
  // Viền hairline sáng (trên nền chrome tối)
  lineOnDark: 'rgba(255,255,255,0.16)',

  // Trạng thái (fg/bg) — dùng cho badge
  successFg: '#00713E',
  successBg: '#E3F8E9',
  neutralFg: '#5E646C',
  neutralBg: '#EDF0F6',
  dangerFg: '#B32322',
  dangerBg: '#FFE7E3',
  pendingFg: '#8A5700',
  pendingBg: '#FEEFDC',
  progressFg: '#295CA5',
  progressBg: '#E8F3FF',
} as const;

/** Ba mức bo theo VAI TRÒ, gần vuông. */
export const Radius = {
  control: 4,
  card: 4,
  modal: 8,
} as const;

/** Bóng: chỉ hai mức, rất nhẹ (mức 0 = chỉ viền). */
export const Shadow = {
  raise: {
    shadowColor: '#141E3C',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
} as const;
