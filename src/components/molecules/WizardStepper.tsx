import { View } from 'react-native'

import { Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export interface WizardStepperProps {
  readonly currentStep: number
  readonly totalSteps: number
  readonly labels?: ReadonlyArray<string>
  readonly accessibilityLabel?: string
  readonly testID?: string
}

/**
 * Linear step indicator. 1-indexed `currentStep`. `labels` optional; when
 * present they render under the dots on larger breakpoints. A11y label
 * announces "Step 2 of 5: Profile".
 */
export function WizardStepper({
  currentStep,
  totalSteps,
  labels,
  accessibilityLabel,
  testID,
}: WizardStepperProps) {
  const theme = useTheme()
  const styles = useStyles()
  const safeCurrent = Math.max(1, Math.min(currentStep, totalSteps))
  const currentLabel = labels?.[safeCurrent - 1]

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={
        accessibilityLabel ??
        `Step ${safeCurrent} of ${totalSteps}${currentLabel ? `: ${currentLabel}` : ''}`
      }
      accessibilityValue={{ min: 1, max: totalSteps, now: safeCurrent }}
      testID={testID}
      style={styles.row}
    >
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1
        const state: 'done' | 'active' | 'pending' =
          step < safeCurrent ? 'done' : step === safeCurrent ? 'active' : 'pending'
        const color =
          state === 'active'
            ? theme.palette.teal
            : state === 'done'
              ? theme.palette.em
              : theme.palette.border2
        return (
          <View key={step} style={styles.stepItem}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: color,
                  borderColor: state === 'active' ? theme.palette.teal : 'transparent',
                },
              ]}
            >
              <Text variant="labelS" color={theme.palette.ink} uppercase>
                {step}
              </Text>
            </View>
            {i < totalSteps - 1 ? (
              <View
                style={[
                  styles.connector,
                  { backgroundColor: step < safeCurrent ? theme.palette.em : theme.palette.border },
                ]}
              />
            ) : null}
          </View>
        )
      })}
    </View>
  )
}

const useStyles = createStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[4],
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[4],
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  connector: {
    width: 20,
    height: 2,
  },
}))
