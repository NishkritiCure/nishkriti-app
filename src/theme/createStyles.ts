import { useMemo } from 'react'
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native'

import { useTheme, type Theme } from './ThemeContext'

export type NamedStyles<T> = {
  readonly [P in keyof T]: ViewStyle | TextStyle | ImageStyle
}

/**
 * Binds a style factory to the live theme. Returns a hook that components
 * call once per render; the factory only re-runs when the theme identity
 * changes (i.e. when the user toggles light/dark), so downstream StyleSheet
 * objects stay stable across unrelated renders.
 *
 * ```ts
 * const useStyles = createStyles((theme) => ({
 *   root: { backgroundColor: theme.palette.bg, padding: theme.spacing[16] },
 * }))
 *
 * function MyCard() {
 *   const styles = useStyles()
 *   return <View style={styles.root} />
 * }
 * ```
 */
export function createStyles<T extends NamedStyles<T>>(factory: (theme: Theme) => T): () => T {
  return function useStyles(): T {
    const theme = useTheme()
    return useMemo(() => factory(theme), [theme])
  }
}
