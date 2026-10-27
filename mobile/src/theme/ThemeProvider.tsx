import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { colors, darkColors, ColorPalette } from './colors';
import { typography, TypographyScale } from './typography';
import { spacing, radii, shadows, iconSizes, layout } from './spacing';

export interface Theme {
  colors: ColorPalette;
  typography: TypographyScale;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  iconSizes: typeof iconSizes;
  layout: typeof layout;
  isDark: boolean;
}

const lightTheme: Theme = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  iconSizes,
  layout,
  isDark: false,
};

const darkTheme: Theme = {
  colors: darkColors as unknown as ColorPalette,
  typography,
  spacing,
  radii,
  shadows,
  iconSizes,
  layout,
  isDark: true,
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  const value = useMemo(
    () => ({
      theme: isDark ? darkTheme : lightTheme,
      isDark,
      toggleTheme: () => setIsDark((prev) => !prev),
    }),
    [isDark]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const { theme } = useContext(ThemeContext);
  return theme;
}

export function useThemeContext(): ThemeContextType {
  return useContext(ThemeContext);
}

export { lightTheme, darkTheme };
