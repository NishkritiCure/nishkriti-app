import { View } from 'react-native'

import { Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export interface ProgressTimelineRowProps {
  readonly date: string
  readonly title: string
  readonly description?: string
  readonly accentColor?: string
  readonly isLast?: boolean
  readonly accessibilityLabel?: string
  readonly testID?: string
}

/**
 * Left-rail + dot + right-content timeline row. Caller can supply an
 * accentColor to colour the dot; the rail is always palette.border.
 */
export function ProgressTimelineRow({
  date,
  title,
  description,
  accentColor,
  isLast = false,
  accessibilityLabel,
  testID,
}: ProgressTimelineRowProps) {
  const theme = useTheme()
  const styles = useStyles()
  const dotColor = accentColor ?? theme.palette.teal

  return (
    <View
      accessible
      accessibilityLabel={
        accessibilityLabel ?? `${date}: ${title}${description ? `. ${description}` : ''}`
      }
      testID={testID}
      style={styles.row}
    >
      <View style={styles.railColumn}>
        <View
          style={[styles.dot, { backgroundColor: dotColor, borderColor: theme.palette.deep }]}
        />
        {!isLast ? <View style={[styles.rail, { backgroundColor: theme.palette.border }]} /> : null}
      </View>
      <View style={styles.body}>
        <Text variant="labelM" color={theme.palette.ink3} uppercase>
          {date}
        </Text>
        <Text variant="h4" color={theme.palette.ink}>
          {title}
        </Text>
        {description ? (
          <Text variant="bodyS" color={theme.palette.ink2}>
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

const useStyles = createStyles((theme) => ({
  row: {
    flexDirection: 'row',
    gap: theme.spacing[12],
  },
  railColumn: {
    alignItems: 'center',
    width: 16,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    marginTop: 6,
  },
  rail: {
    flex: 1,
    width: 2,
    marginTop: theme.spacing[4],
  },
  body: {
    flex: 1,
    gap: theme.spacing[4],
    paddingBottom: theme.spacing[16],
  },
}))
