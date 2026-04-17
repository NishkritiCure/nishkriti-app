import { Pressable, View } from 'react-native'

import { createStyles, useTheme } from '@/theme'

import { Text } from './Text'

export interface StepperProps {
  readonly value: number
  readonly onChange: (next: number) => void
  readonly min?: number
  readonly max?: number
  readonly step?: number
  readonly unit?: string
  readonly disabled?: boolean
  readonly accessibilityLabel: string
  readonly testID?: string
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  unit,
  disabled = false,
  accessibilityLabel,
  testID,
}: StepperProps) {
  const theme = useTheme()
  const styles = useStyles()
  const canDecrement = !disabled && value > min
  const canIncrement = !disabled && value < max

  const decrement = () => {
    if (canDecrement) onChange(Math.max(min, value - step))
  }
  const increment = () => {
    if (canIncrement) onChange(Math.min(max, value + step))
  }

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value }}
      accessibilityState={{ disabled }}
      testID={testID}
      style={[styles.row, { borderColor: theme.palette.border }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${accessibilityLabel}`}
        onPress={decrement}
        disabled={!canDecrement}
        hitSlop={8}
        style={[styles.button, !canDecrement && styles.disabled]}
        testID={testID ? `${testID}-decrement` : undefined}
      >
        <Text variant="h3" color={theme.palette.ink}>
          −
        </Text>
      </Pressable>
      <View style={styles.valueWrapper}>
        <Text variant="h4" color={theme.palette.spring}>
          {value}
          {unit ? <Text variant="bodyS" color={theme.palette.ink2}>{` ${unit}`}</Text> : null}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Increase ${accessibilityLabel}`}
        onPress={increment}
        disabled={!canIncrement}
        hitSlop={8}
        style={[styles.button, !canIncrement && styles.disabled]}
        testID={testID ? `${testID}-increment` : undefined}
      >
        <Text variant="h3" color={theme.palette.ink}>
          +
        </Text>
      </Pressable>
    </View>
  )
}

const useStyles = createStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: theme.radius.md,
    backgroundColor: theme.palette.card,
    alignSelf: 'flex-start',
  },
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  valueWrapper: {
    minWidth: 60,
    paddingHorizontal: theme.spacing[12],
    alignItems: 'center',
  },
}))
