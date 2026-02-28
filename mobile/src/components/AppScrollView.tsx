/**
 * AppScrollView – Parmakla kaydırmanın her zaman çalıştığı ScrollView.
 * Tüm dikey liste ekranlarında bu bileşeni kullanın.
 *
 * Varsayılanlar:
 * - style: flex: 1 (sınırlı yükseklik → kaydırma aktif)
 * - contentContainerStyle: flexGrow: 1, paddingBottom: 100
 * - nestedScrollEnabled, bounces, showsVerticalScrollIndicator
 */

import React from 'react';
import { ScrollView, ScrollViewProps, ViewStyle } from 'react-native';

const DEFAULT_PADDING_BOTTOM = 100;

export type AppScrollViewProps = ScrollViewProps & {
  /** Alt boşluk (varsayılan 100) */
  contentPaddingBottom?: number;
};

export default function AppScrollView({
  style,
  contentContainerStyle,
  contentPaddingBottom = DEFAULT_PADDING_BOTTOM,
  horizontal = false,
  nestedScrollEnabled = true,
  bounces = true,
  showsVerticalScrollIndicator = true,
  ...rest
}: AppScrollViewProps) {
  const contentStyle: ViewStyle = horizontal
    ? (contentContainerStyle as ViewStyle) ?? {}
    : {
        flexGrow: 1,
        paddingBottom: contentPaddingBottom,
        ...(contentContainerStyle as ViewStyle),
      };

  return (
    <ScrollView
      style={[{ flex: 1, minHeight: 0 }, style]}
      contentContainerStyle={contentStyle}
      horizontal={horizontal}
      nestedScrollEnabled={nestedScrollEnabled}
      bounces={bounces}
      showsVerticalScrollIndicator={horizontal ? false : showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      {...rest}
    />
  );
}
