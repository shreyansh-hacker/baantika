// Baantika Design System — Typography Scale

import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  android: 'Roboto',
  default: 'System',
});

// Type scale following Material Design 3 with Indian fintech adjustments
export const typography = {
  // Display — Large impactful text
  displayLarge: {
    fontFamily,
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontFamily,
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  displaySmall: {
    fontFamily,
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },

  // Headline
  headlineLarge: {
    fontFamily,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  headlineMedium: {
    fontFamily,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  headlineSmall: {
    fontFamily,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },

  // Title
  titleLarge: {
    fontFamily,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  titleMedium: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0.1,
  },

  // Body
  bodyLarge: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0.4,
  },

  // Label
  labelLarge: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 0.5,
  },

  // Currency — Special typography for money display
  currencyLarge: {
    fontFamily,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  currencyMedium: {
    fontFamily,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  currencySmall: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
} as const;

export type TypographyScale = typeof typography;
export type TypographyVariant = keyof TypographyScale;
