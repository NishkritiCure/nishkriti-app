import { type ViewStyle } from 'react-native'
import { SafeAreaView, type Edge } from 'react-native-safe-area-context'

import { createStyles } from '@/theme'

import { Screen, type ScreenProps } from './Screen'

export interface SafeScreenProps extends ScreenProps {
  readonly edges?: readonly Edge[]
}

/**
 * Safe-area aware screen. Wraps the Screen in SafeAreaView so content
 * dodges notches and home indicators. Use at the route root.
 */
export function SafeScreen({
  edges = ['top', 'left', 'right'] as const,
  children,
  testID,
  style,
  ...rest
}: SafeScreenProps) {
  const styles = useStyles()
  return (
    <SafeAreaView edges={edges} style={styles.safe} testID={testID}>
      <Screen {...rest} style={style}>
        {children}
      </Screen>
    </SafeAreaView>
  )
}

const useStyles = createStyles((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.palette.bg,
  } satisfies ViewStyle,
}))
