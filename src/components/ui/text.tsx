import { Text as RNText, StyleSheet, type TextProps } from 'react-native';

import { Font, Palette } from './theme';

/**
 * Chữ Zoldify — thang chữ PORT từ web (display 28 / h1 22 / h2 18 / h3 15 /
 * body 14 / small 13 / caption 11.5). Be Vietnam Pro, dấu tiếng Việt đẹp.
 */
export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
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
  display: { fontFamily: Font.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.4, color: Palette.ink },
  title: { fontFamily: Font.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.2, color: Palette.ink },
  heading: { fontFamily: Font.bold, fontSize: 18, lineHeight: 24, color: Palette.ink },
  subheading: { fontFamily: Font.semibold, fontSize: 15, lineHeight: 20, color: Palette.ink },
  body: { fontFamily: Font.regular, fontSize: 14, lineHeight: 22, color: Palette.ink },
  bodyMuted: { fontFamily: Font.regular, fontSize: 14, lineHeight: 22, color: Palette.inkMuted },
  label: { fontFamily: Font.semibold, fontSize: 13, lineHeight: 18, color: Palette.ink },
  caption: { fontFamily: Font.semibold, fontSize: 11.5, lineHeight: 16, color: Palette.inkMuted },
  link: { fontFamily: Font.semibold, fontSize: 14, lineHeight: 20, color: Palette.brand },
});
