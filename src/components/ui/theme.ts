/**
 * Token thiết kế Zoldify — phong cách tối giản / đáng tin.
 * Màu dùng chung với tailwind.config; ở đây để dùng trong style (RN thuần).
 */

/** Họ font Be Vietnam Pro — thiết kế riêng cho tiếng Việt, dấu đẹp. */
export const Font = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
  extrabold: 'BeVietnamPro_800ExtraBold',
} as const;

export const Palette = {
  brand: '#2C67C8',
  brandDark: '#1F4C99',
  brandLight: '#EFF6FF',
  ink: '#0F172A',
  muted: '#64748B',
  line: '#E2E8F0',
  surface: '#FBFCFE',
  white: '#FFFFFF',
  success: '#16A34A',
  danger: '#DC2626',
} as const;

export const Radius = {
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;
