import { View } from 'react-native'

import { Card, Checkbox, Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export interface ExerciseItem {
  readonly id: string
  readonly name: string
  readonly cue?: string
  readonly setsReps?: string
  readonly duration?: string
}

export interface ExerciseCardProps {
  readonly item: ExerciseItem
  readonly done?: boolean
  readonly onToggleDone?: () => void
  readonly accessibilityLabel?: string
  readonly testID?: string
}

/**
 * Exercise row for the daily plan. Pure view shell — `done` is a passed-in
 * prop and `onToggleDone` is the caller's hook. No AsyncStorage, no
 * service-layer coupling.
 */
export function ExerciseCard({
  item,
  done = false,
  onToggleDone,
  accessibilityLabel,
  testID,
}: ExerciseCardProps) {
  const theme = useTheme()
  const styles = useStyles()
  const composed =
    accessibilityLabel ??
    `${item.name}${item.setsReps ? `, ${item.setsReps}` : ''}${
      item.duration ? `, ${item.duration}` : ''
    }. ${done ? 'Done.' : 'Not done.'}`

  return (
    <Card surface="card" testID={testID} accessibilityLabel={composed}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text variant="h4" color={theme.palette.ink}>
            {item.name}
          </Text>
          {item.cue ? (
            <Text variant="bodyS" color={theme.palette.ink2}>
              {item.cue}
            </Text>
          ) : null}
          {item.setsReps || item.duration ? (
            <Text variant="labelM" color={theme.palette.ink3} uppercase>
              {[item.setsReps, item.duration].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
        </View>
        {onToggleDone ? (
          <Checkbox
            checked={done}
            onChange={onToggleDone}
            accessibilityLabel={`Mark ${item.name} ${done ? 'incomplete' : 'done'}`}
            testID={testID ? `${testID}-checkbox` : undefined}
          />
        ) : null}
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
    gap: theme.spacing[4],
  },
}))
