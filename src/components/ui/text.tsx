import { Text as RNText, StyleSheet, type TextProps } from 'react-native';

import { Font, Palette } from './theme';

/**
 * Chữ của Zoldify. Mọi text đi qua đây để chắc chắn dùng Be Vietnam Pro
 * (dấu tiếng Việt đẹp) và tôn ti cỡ chữ nhất quán. Hierarchy bằng cỡ + độ
 * đậm của font, không phụ thuộc fontWeight (RN + font tuỳ biến hay lệch).
 */
export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'bodyMuted'
  | 'label'
  | 'caption'
  | 'link';

export function Text({
  variant = 'body',
  style,
  ...rest
}: TextProps & { variant?: TextVariant }) {
  return <RNText style={[styles[variant], style]} {...rest} />;
}

const styles = StyleSheet.create({
  display: {
    fontFamily: Font.extrabold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
    color: Palette.ink,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.3,
    color: Palette.ink,
  },
  heading: {
    fontFamily: Font.bold,
    fontSize: 19,
    lineHeight: 26,
    color: Palette.ink,
  },
  body: {
    fontFamily: Font.regular,
    fontSize: 16,
    lineHeight: 24,
    color: Palette.ink,
  },
  bodyMuted: {
    fontFamily: Font.regular,
    fontSize: 15,
    lineHeight: 23,
    color: Palette.muted,
  },
  label: {
    fontFamily: Font.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: Palette.ink,
  },
  caption: {
    fontFamily: Font.regular,
    fontSize: 13,
    lineHeight: 18,
    color: Palette.muted,
  },
  link: {
    fontFamily: Font.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: Palette.brand,
  },
});
