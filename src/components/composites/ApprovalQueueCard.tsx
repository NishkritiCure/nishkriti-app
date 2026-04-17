import { View } from 'react-native'

import { Avatar, Card, Text } from '@/components/primitives'
import { OriginBadge, type PlanOrigin } from '@/components/primitives/OriginBadge'
import { createStyles, useTheme } from '@/theme'

export interface TodayVitals {
  readonly fbs?: number | undefined
  readonly weight?: number | undefined
  readonly energy?: string | undefined
}

export interface ApprovalQueuePatient {
  readonly id: string
  readonly name: string
  readonly condition: string
  readonly daysInProgramme: number
  readonly avatarInitials: string
}

export interface ApprovalQueueCardProps {
  readonly patient: ApprovalQueuePatient
  readonly todayVitals: TodayVitals
  readonly aiReasoningPreview: string
  readonly generatedBy: PlanOrigin
  readonly fallbackBadge?: boolean
  readonly onPress: () => void
  readonly accessibilityLabel?: string
  readonly testID?: string
}

export function ApprovalQueueCard({
  patient,
  todayVitals,
  aiReasoningPreview,
  generatedBy,
  fallbackBadge = false,
  onPress,
  accessibilityLabel,
  testID,
}: ApprovalQueueCardProps) {
  const theme = useTheme()
  const styles = useStyles()
  const vitalsString = [
    todayVitals.fbs !== undefined ? `FBS ${todayVitals.fbs}` : null,
    todayVitals.weight !== undefined ? `${todayVitals.weight} kg` : null,
    todayVitals.energy ? `energy ${todayVitals.energy}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  // Default a11y label is deliberately PHI-free. Screens in phase-d/e that
  // render this card must pass an explicit `accessibilityLabel` scrubbed
  // per SECURITY-SPEC.md §3 (e.g. first initial + "patient N of M").
  // The composed visible content is kept (the card *shows* PHI) but we do
  // not echo it into the accessibility tree by default, because the tree
  // is the most common vector for PHI reaching crash reports.
  return (
    <Card
      surface="card"
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? 'Approval queue item'}
      accessibilityHint="Double tap to review and approve"
      testID={testID}
    >
      <View style={styles.header}>
        <Avatar initials={patient.avatarInitials} size="md" />
        <View style={styles.head}>
          <Text variant="h4" color={theme.palette.ink}>
            {patient.name}
          </Text>
          <Text variant="bodyS" color={theme.palette.ink2}>
            {patient.condition} · Day {patient.daysInProgramme}
          </Text>
        </View>
        <OriginBadge origin={generatedBy} />
      </View>

      {vitalsString ? (
        <Text variant="labelM" color={theme.palette.ink3} uppercase style={styles.vitals}>
          {vitalsString}
        </Text>
      ) : null}

      <Text variant="bodyS" color={theme.palette.ink} numberOfLines={2} style={styles.preview}>
        {aiReasoningPreview}
      </Text>

      {fallbackBadge ? (
        <Text variant="labelM" color={theme.palette.amber} uppercase style={styles.fallback}>
          Fallback
        </Text>
      ) : null}
    </Card>
  )
}

const useStyles = createStyles((theme) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[12],
  },
  head: {
    flex: 1,
    gap: theme.spacing[2],
  },
  vitals: {
    marginTop: theme.spacing[12],
  },
  preview: {
    marginTop: theme.spacing[4],
  },
  fallback: {
    marginTop: theme.spacing[8],
    letterSpacing: 2,
  },
}))
