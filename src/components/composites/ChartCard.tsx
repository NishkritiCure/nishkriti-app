import { View } from 'react-native'

import { Card, Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export interface ChartCardProps {
  readonly title: string
  readonly summary?: string
  readonly children: React.ReactNode
  readonly accessibilityLabel?: string
  readonly testID?: string
}

/**
 * Thin wrapper around Victory Native charts (or any chart primitive).
 * Consumers render their chart as children; this card provides the title,
 * summary caption, surface, and a composed accessibility label so screen
 * readers can announce the chart's meaning without re-describing the axes.
 */
export function ChartCard({
  title,
  summary,
  children,
  accessibilityLabel,
  testID,
}: ChartCardProps) {
  const theme = useTheme()
  const styles = useStyles()
  return (
    <Card
      surface="card"
      accessibilityLabel={accessibilityLabel ?? `${title}${summary ? `. ${summary}` : ''}`}
      testID={testID}
    >
      <View style={styles.header}>
        <Text variant="labelM" color={theme.palette.ink3} uppercase>
          {title}
        </Text>
        {summary ? (
          <Text variant="bodyM" color={theme.palette.ink}>
            {summary}
          </Text>
        ) : null}
      </View>
      <View style={styles.chart}>{children}</View>
    </Card>
  )
}

const useStyles = createStyles((theme) => ({
  header: {
    gap: theme.spacing[2],
  },
  chart: {
    marginTop: theme.spacing[12],
    minHeight: 180,
  },
}))
