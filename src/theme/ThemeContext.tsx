import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'

import { useThemeStore } from '@/stores/useThemeStore'

import { darkPalette, lightPalette, type ColorPalette } from './colors'
import { motion } from './motion'
import { radius } from './radius'
import { shadows } from './shadows'
import { spacing } from './spacing'
import { typography } from './typography'

export interface Theme {
  colors: ColorPalette
  spacing: typeof spacing
  radius: typeof radius
  shadows: typeof shadows
  motion: typeof motion
  typography: typeof typography
  isDark: boolean
}

const ThemeContext = createContext<Theme | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useThemeStore((state) => state.mode)
  const system = useColorScheme()
  const effective = mode === 'system' ? (system ?? 'light') : mode
  const theme = useMemo<Theme>(
    () => ({
      colors: effective === 'dark' ? darkPalette : lightPalette,
      spacing,
      radius,
      shadows,
      motion,
      typography,
      isDark: effective === 'dark',
    }),
    [effective]
  )
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
