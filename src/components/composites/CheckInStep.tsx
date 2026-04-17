import { View } from 'react-native'

import { Button, Card, Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export interface CheckInStepProps {
  readonly stepNumber: number
  readonly totalSteps: number
  readonly title: string
  readonly subtitle?: string
  readonly children: React.ReactNode
  readonly action?: React.ReactNode
  readonly onBack?: () => void
  readonly onNext?: () => void
  readonly nextLabel?: string
  readonly backLabel?: string
  readonly nextDisabled?: boolean
  readonly accessibilityLabel?: string
  readonly testID?: string
}

/**
 * Wizard step surface for the daily check-in. Renders a Card with a step
 * counter header (e.g. "Step 2 of 5"), a title, optional subtitle, body
 * (children), and an optional footer action row — or a pair of back/next
 * buttons. Pure view shell; no data coupling.
 */
export function CheckInStep({
  stepNumber,
  totalSteps,
  title,
  subtitle,
  children,
  action,
  onBack,
  onNext,
  nextLabel = 'Continue',
  backLabel = 'Back',
  nextDisabled = false,
  accessibilityLabel,
  testID,
}: CheckInStepProps) {
  const theme = useTheme()
  const styles = useStyles()

  return (
    <Card
      surface="card"
      accessibilityLabel={accessibilityLabel ?? `${title}. Step ${stepNumber} of ${totalSteps}.`}
      testID={testID}
    >
      <View style={styles.header}>
        <Text variant="labelM" color={theme.palette.ink3} uppercase>
          {`Step ${stepNumber} of ${totalSteps}`}
        </Text>
        <Text variant="h2" color={theme.palette.ink}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodyM" color={theme.palette.ink2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.body}>{children}</View>
      {action ? (
        <View style={styles.actionRow}>{action}</View>
      ) : onBack || onNext ? (
        <View style={styles.actionRow}>
          {onBack ? <Button label={backLabel} variant="ghost" onPress={onBack} /> : <View />}
          {onNext ? (
            <Button label={nextLabel} variant="primary" onPress={onNext} disabled={nextDisabled} />
          ) : null}
        </View>
      ) : null}
    </Card>
  )
}

const useStyles = createStyles((theme) => ({
  header: {
    gap: theme.spacing[4],
  },
  body: {
    paddingVertical: theme.spacing[16],
    gap: theme.spacing[12],
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing[12],
  },
}))
