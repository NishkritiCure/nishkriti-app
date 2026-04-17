import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'

import { useThemeStore, type ThemeMode } from '@/stores/useThemeStore'

import { dark, light, type Colors } from './colors'
import { motion } from './motion'
import { radius } from './radius'
import { shadows } from './shadows'
import { spacing } from './spacing'
import { typography } from './typography'

export interface Theme {
  readonly palette: Colors
  readonly spacing: typeof spacing
  readonly radius: typeof radius
  readonly shadows: typeof shadows
  readonly motion: typeof motion
  readonly typography: typeof typography
  readonly isDark: boolean
  readonly mode: ThemeMode
  readonly setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<Theme | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useThemeStore((state) => state.mode)
  const setMode = useThemeStore((state) => state.setMode)
  const system = useColorScheme()
  const effective = mode === 'system' ? (system ?? 'light') : mode
  const isDark = effective === 'dark'

  const theme = useMemo<Theme>(
    () => ({
      palette: isDark ? dark : light,
      spacing,
      radius,
      shadows,
      motion,
      typography,
      isDark,
      mode,
      setMode,
    }),
    [isDark, mode, setMode]
  )

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
