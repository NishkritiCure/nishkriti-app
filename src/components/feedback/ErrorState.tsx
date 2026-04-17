import { View } from 'react-native'

import { Button, Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export interface ErrorStateProps {
  readonly title?: string
  readonly description?: string
  readonly onRetry?: () => void
  readonly accessibilityLabel?: string
  readonly testID?: string
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again in a moment.',
  onRetry,
  accessibilityLabel,
  testID,
}: ErrorStateProps) {
  const theme = useTheme()
  const styles = useStyles()
  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLabel={accessibilityLabel ?? `${title}. ${description}`}
      testID={testID}
      style={styles.root}
    >
      <Text variant="h3" color={theme.palette.danger} align="center">
        {title}
      </Text>
      <Text variant="bodyM" color={theme.palette.ink2} align="center">
        {description}
      </Text>
      {onRetry ? <Button label="Try again" onPress={onRetry} variant="secondary" /> : null}
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
