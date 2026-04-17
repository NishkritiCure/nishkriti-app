import { View } from 'react-native'

import { Card, Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export type MetricStatus = 'ok' | 'warn' | 'alert' | 'critical'

export interface MetricCardProps {
  readonly label: string
  readonly value: string | number
  readonly unit?: string
  readonly delta?: string
  readonly deltaPositive?: boolean
  readonly status?: MetricStatus
  readonly onPress?: () => void
  readonly accessibilityLabel?: string
  readonly testID?: string
}

/**
 * Headline metric display — label, value, optional unit, optional delta
 * with up/down chevron, optional tappable for drill-down. Status colour
 * tints the value text; a11y label composes everything into one phrase.
 */
export function MetricCard({
  label,
  value,
  unit,
  delta,
  deltaPositive = true,
  status = 'ok',
  onPress,
  accessibilityLabel,
  testID,
}: MetricCardProps) {
  const theme = useTheme()
  const styles = useStyles()

  const valueColor = {
    ok: theme.palette.spring,
    warn: theme.palette.amber,
    alert: theme.palette.amber,
    critical: theme.palette.danger,
  }[status]

  const deltaColor = deltaPositive ? theme.palette.teal : theme.palette.danger
  const fullLabel =
    accessibilityLabel ??
    `${label}: ${value}${unit ? ` ${unit}` : ''}${delta ? ` (${deltaPositive ? 'up' : 'down'} ${delta})` : ''}`

  const composed = (
    <View style={styles.body}>
      <Text variant="labelM" color={theme.palette.ink3} uppercase>
        {label}
      </Text>
      <View style={styles.valueRow}>
        <Text variant="h1" color={valueColor}>
          {value}
        </Text>
        {unit ? (
          <Text variant="bodyM" color={theme.palette.ink2}>
            {unit}
          </Text>
        ) : null}
      </View>
      {delta ? (
        <Text variant="caption" color={deltaColor}>
          {deltaPositive ? '▲' : '▼'} {delta}
        </Text>
      ) : null}
    </View>
  )

  return (
    <Card
      surface="card"
      onPress={onPress}
      accessibilityLabel={fullLabel}
      accessibilityHint={onPress ? 'Double tap to view history' : undefined}
      testID={testID}
    >
      {composed}
    </Card>
  )
}

const useStyles = createStyles((theme) => ({
  body: {
    gap: theme.spacing[4],
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing[4],
  },
}))
