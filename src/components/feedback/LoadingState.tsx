import { ActivityIndicator, View } from 'react-native'

import { Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export interface LoadingStateProps {
  readonly label?: string
  readonly accessibilityLabel?: string
  readonly testID?: string
}

export function LoadingState({
  label = 'Loading…',
  accessibilityLabel,
  testID,
}: LoadingStateProps) {
  const theme = useTheme()
  const styles = useStyles()
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
      style={styles.root}
    >
      <ActivityIndicator color={theme.palette.teal} />
      {label ? (
        <Text variant="bodyS" color={theme.palette.ink2}>
          {label}
        </Text>
      ) : null}
    </View>
  )
}

const useStyles = createStyles((theme) => ({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[12],
    padding: theme.spacing[32],
  },
}))
