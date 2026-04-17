import { View, type ViewStyle } from 'react-native'

import { Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export interface SectionProps {
  readonly title?: string
  readonly subtitle?: string
  readonly action?: React.ReactNode
  readonly children: React.ReactNode
  readonly accessibilityLabel?: string
  readonly testID?: string
  readonly style?: ViewStyle
}

/**
 * Titled section with optional trailing action (e.g. a "See all" link).
 * Composes with `Screen` — one Screen can hold many Sections.
 */
export function Section({
  title,
  subtitle,
  action,
  children,
  accessibilityLabel,
  testID,
  style,
}: SectionProps) {
  const theme = useTheme()
  const styles = useStyles()
  return (
    <View
      accessibilityLabel={accessibilityLabel ?? title}
      testID={testID}
      style={[styles.root, style]}
    >
      {(title || action) && (
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            {title ? (
              <Text variant="h3" color={theme.palette.ink}>
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text variant="bodyS" color={theme.palette.ink2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {action}
        </View>
      )}
      <View style={styles.body}>{children}</View>
    </View>
  )
}

const useStyles = createStyles((theme) => ({
  root: {
    paddingVertical: theme.spacing[16],
    gap: theme.spacing[12],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing[12],
    paddingHorizontal: theme.spacing[16],
  },
  titleBlock: {
    flex: 1,
    gap: theme.spacing[2],
  },
  body: {
    gap: theme.spacing[12],
  },
}))
