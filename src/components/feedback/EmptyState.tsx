import { View } from 'react-native'

import { Button, Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export interface EmptyStateProps {
  readonly icon?: React.ReactNode
  readonly title: string
  readonly description?: string
  readonly action?: { readonly label: string; readonly onPress: () => void }
  readonly accessibilityLabel?: string
  readonly testID?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  accessibilityLabel,
  testID,
}: EmptyStateProps) {
  const theme = useTheme()
  const styles = useStyles()
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? `${title}${description ? `. ${description}` : ''}`}
      testID={testID}
      style={styles.root}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text variant="h3" color={theme.palette.ink} align="center">
        {title}
      </Text>
      {description ? (
        <Text variant="bodyM" color={theme.palette.ink2} align="center">
          {description}
        </Text>
      ) : null}
      {action ? <Button label={action.label} onPress={action.onPress} variant="secondary" /> : null}
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
  icon: {
    marginBottom: theme.spacing[8],
  },
}))
