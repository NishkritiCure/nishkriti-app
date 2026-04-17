import { View } from 'react-native'

import { Card, Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export interface PhaseCardProps {
  readonly phaseName: string
  readonly phaseNumber: number
  readonly totalPhases: number
  readonly dayInPhase: number
  readonly totalDaysInPhase: number
  readonly description?: string
  readonly accessibilityLabel?: string
  readonly testID?: string
}

export function PhaseCard({
  phaseName,
  phaseNumber,
  totalPhases,
  dayInPhase,
  totalDaysInPhase,
  description,
  accessibilityLabel,
  testID,
}: PhaseCardProps) {
  const theme = useTheme()
  const styles = useStyles()
  const percent = Math.max(
    0,
    Math.min(100, Math.round((dayInPhase / Math.max(totalDaysInPhase, 1)) * 100))
  )
  const composed =
    accessibilityLabel ??
    `${phaseName}, phase ${phaseNumber} of ${totalPhases}, day ${dayInPhase} of ${totalDaysInPhase}, ${percent}% complete`

  return (
    <Card surface="card2" accessibilityLabel={composed} testID={testID}>
      <View style={styles.header}>
        <Text variant="labelM" color={theme.palette.ink3} uppercase>
          {`Phase ${phaseNumber} / ${totalPhases}`}
        </Text>
        <Text variant="h2" color={theme.palette.ink}>
          {phaseName}
        </Text>
      </View>
      {description ? (
        <Text variant="bodyS" color={theme.palette.ink2}>
          {description}
        </Text>
      ) : null}
      <View style={styles.progressRow}>
        <Text variant="labelM" color={theme.palette.ink3} uppercase>
          {`Day ${dayInPhase} / ${totalDaysInPhase}`}
        </Text>
        <Text variant="labelM" color={theme.palette.teal} uppercase>
          {`${percent}%`}
        </Text>
      </View>
      <View style={[styles.bar, { backgroundColor: theme.palette.card3 }]}>
        <View
          style={[styles.fill, { width: `${percent}%`, backgroundColor: theme.palette.teal }]}
        />
      </View>
    </Card>
  )
}

const useStyles = createStyles((theme) => ({
  header: {
    gap: theme.spacing[4],
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing[12],
  },
  bar: {
    height: 8,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
    marginTop: theme.spacing[4],
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius.pill,
  },
}))
