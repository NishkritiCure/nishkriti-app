/**
 * Shared test helpers for the Phase-C component library.
 *
 * The component library is tested via `@testing-library/react` + the
 * react-native-web alias (see vitest.config.ts). Every component test file
 * must opt into the jsdom environment via a `// @vitest-environment jsdom`
 * directive at the top of the file.
 */
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'

import { useThemeStore } from '@/stores/useThemeStore'
import { ThemeProvider } from '@/theme'

export function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

/**
 * Renders the same tree once in light mode and once in dark mode. Exposes
 * both snapshots for assertions; mode is reset to `system` when done.
 */
export function renderBothThemes(ui: ReactElement): {
  readonly light: ReturnType<typeof render>
  readonly dark: ReturnType<typeof render>
} {
  const restore = useThemeStore.getState().mode
  useThemeStore.getState().setMode('light')
  const lightRender = render(<ThemeProvider>{ui}</ThemeProvider>)

  useThemeStore.getState().setMode('dark')
  const darkRender = render(<ThemeProvider>{ui}</ThemeProvider>)

  // Restore for isolation between tests.
  useThemeStore.getState().setMode(restore)
  return { light: lightRender, dark: darkRender }
}
