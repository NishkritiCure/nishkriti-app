import { View } from 'react-native'

import { Avatar, Card, Text } from '@/components/primitives'
import { Pill, type PillTone } from '@/components/molecules'
import { createStyles, useTheme } from '@/theme'

export interface PatientRosterRowProps {
  readonly avatarInitials: string
  readonly name: string
  readonly condition: string
  readonly daysInProgramme: number
  readonly statusPillLabel?: string
  readonly statusPillColor?: PillTone
  readonly onPress: () => void
  readonly accessibilityLabel?: string
  readonly testID?: string
}

export function PatientRosterRow({
  avatarInitials,
  name,
  condition,
  daysInProgramme,
  statusPillLabel,
  statusPillColor = 'teal',
  onPress,
  accessibilityLabel,
  testID,
}: PatientRosterRowProps) {
  const theme = useTheme()
  const styles = useStyles()
  const composed =
    accessibilityLabel ??
    `${name}, ${condition}, day ${daysInProgramme}${
      statusPillLabel ? `, status ${statusPillLabel}` : ''
    }`

  return (
    <Card
      surface="card"
      onPress={onPress}
      accessibilityLabel={composed}
      accessibilityHint="Double tap to open patient profile"
      testID={testID}
    >
      <View style={styles.row}>
        <Avatar initials={avatarInitials} size="md" />
        <View style={styles.info}>
          <Text variant="h4" color={theme.palette.ink}>
            {name}
          </Text>
          <Text variant="bodyS" color={theme.palette.ink2}>
            {condition}
          </Text>
        </View>
        <View style={styles.meta}>
          <Text variant="labelM" color={theme.palette.ink3} uppercase>
            Day
          </Text>
          <Text variant="h3" color={theme.palette.spring}>
            {daysInProgramme}
          </Text>
        </View>
        {statusPillLabel ? <Pill label={statusPillLabel} tone={statusPillColor} /> : null}
      </View>
    </Card>
  )
}

const useStyles = createStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[12],
  },
  info: {
    flex: 1,
    gap: theme.spacing[2],
  },
  meta: {
    alignItems: 'center',
  },
}))
