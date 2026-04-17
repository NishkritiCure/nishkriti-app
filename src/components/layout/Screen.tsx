import { ScrollView, View, type ViewStyle } from 'react-native'

import { createStyles } from '@/theme'

export interface ScreenProps {
  readonly children: React.ReactNode
  readonly scrollable?: boolean | undefined
  readonly padding?: number | undefined
  readonly accessibilityLabel?: string | undefined
  readonly testID?: string | undefined
  readonly style?: ViewStyle | undefined
}

/**
 * Basic screen shell — fills the viewport with the theme's root background.
 * Use `SafeScreen` when the screen sits at a route boundary and needs
 * safe-area insets.
 */
export function Screen({
  children,
  scrollable = false,
  padding,
  accessibilityLabel,
  testID,
  style,
}: ScreenProps) {
  const styles = useStyles()
  const rootStyle: ViewStyle = {
    ...styles.root,
    ...(padding !== undefined ? { padding } : {}),
  }
  if (scrollable) {
    return (
      <ScrollView
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={rootStyle}
        contentContainerStyle={[styles.scrollContent, style]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    )
  }
  return (
    <View accessibilityLabel={accessibilityLabel} testID={testID} style={[rootStyle, style]}>
      {children}
    </View>
  )
}

const useStyles = createStyles((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.palette.bg,
  },
  scrollContent: {
    flexGrow: 1,
  },
}))
