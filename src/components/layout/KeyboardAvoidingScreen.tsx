import { KeyboardAvoidingView, Platform, type ViewStyle } from 'react-native'

import { createStyles } from '@/theme'

import { Screen, type ScreenProps } from './Screen'

export interface KeyboardAvoidingScreenProps extends ScreenProps {
  readonly offset?: number
}

/**
 * Screen variant that lifts content above the software keyboard on iOS.
 * On Android, edge-to-edge + soft-input adjustResize handles this
 * automatically, so the KAV noops there.
 */
export function KeyboardAvoidingScreen({
  offset = 0,
  children,
  testID,
  style,
  ...rest
}: KeyboardAvoidingScreenProps) {
  const styles = useStyles()
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={offset}
      style={styles.container}
      testID={testID}
    >
      <Screen {...rest} style={style}>
        {children}
      </Screen>
    </KeyboardAvoidingView>
  )
}

const useStyles = createStyles(() => ({
  container: {
    flex: 1,
  } satisfies ViewStyle,
}))
