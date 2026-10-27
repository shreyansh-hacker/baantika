// Baantika Design System — Color Palette
// A contemporary Indian fintech palette

export const colors = {
  // Primary — Deep ink/navy
  primary: {
    50: '#E8EAF0',
    100: '#C5CAD9',
    200: '#9FA8C0',
    300: '#7986A7',
    400: '#5C6D94',
    500: '#3F5482',
    600: '#374C77',
    700: '#2D4168',
    800: '#24365A',
    900: '#152340',
  },

  // Accent — Warm saffron/coral
  accent: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    500: '#F4891F',
    600: '#E67E22',
    700: '#D35400',
    800: '#BF4500',
    900: '#A33A00',
  },

  // Success — Muted green (positive balances)
  success: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#2E7D32',
    600: '#2E7D32',
    700: '#1B5E20',
    800: '#145214',
    900: '#0D3B0D',
  },

  // Error — Red (amounts owed, errors) — used carefully
  error: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#EF5350',
    500: '#D32F2F',
    600: '#C62828',
    700: '#B71C1C',
    800: '#8E0000',
    900: '#6B0000',
  },

  // Warning
  warning: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#FFA000',
    600: '#FF8F00',
    700: '#FF6F00',
    800: '#E65100',
    900: '#BF360C',
  },

  // Neutral — Warm ivory and grays
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAF8',
    100: '#F5F4F0',
    200: '#EEEDE8',
    300: '#E0DED8',
    400: '#C8C5BC',
    500: '#9E9A90',
    600: '#757168',
    700: '#5A5750',
    800: '#3D3B37',
    900: '#1E1D1B',
  },

  // Semantic
  background: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F4F0',
  text: {
    primary: '#1E1D1B',
    secondary: '#5A5750',
    tertiary: '#9E9A90',
    inverse: '#FFFFFF',
    link: '#3F5482',
  },
  border: '#E0DED8',
  divider: '#EEEDE8',
  overlay: 'rgba(30, 29, 27, 0.5)',
  skeleton: '#EEEDE8',

  // Balance semantic colors
  balancePositive: '#2E7D32',
  balanceNegative: '#D32F2F',
  balanceZero: '#5A5750',
} as const;

// Dark theme colors
export const darkColors = {
  ...colors,
  background: '#121212',
  surface: '#1E1E1E',
  surfaceVariant: '#2A2A2A',
  text: {
    primary: '#FAFAF8',
    secondary: '#C8C5BC',
    tertiary: '#757168',
    inverse: '#1E1D1B',
    link: '#7986A7',
  },
  border: '#3D3B37',
  divider: '#2A2A2A',
  overlay: 'rgba(0, 0, 0, 0.7)',
  skeleton: '#2A2A2A',
} as const;

export type ColorPalette = typeof colors;
