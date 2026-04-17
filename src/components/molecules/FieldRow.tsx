import { View, type ViewStyle } from 'react-native'

import { Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export interface FieldRowProps {
  readonly label: string
  readonly value?: string | number | React.ReactNode
  readonly accessibilityLabel?: string | undefined
  readonly style?: ViewStyle
  readonly testID?: string
  readonly children?: React.ReactNode
}

/**
 * Label + value pair used in detail screens. Label is mono-uppercase,
 * value is body-text colour. When `children` is provided they render in
 * place of the value — use it for interactive controls (Stepper, Switch).
 */
export function FieldRow({
  label,
  value,
  accessibilityLabel,
  style,
  testID,
  children,
}: FieldRowProps) {
  const theme = useTheme()
  const styles = useStyles()
  return (
    <View
      accessible
      accessibilityLabel={
        accessibilityLabel ?? `${label}: ${typeof value === 'string' ? value : ''}`
      }
      testID={testID}
      style={[styles.root, style]}
    >
      <Text variant="labelM" color={theme.palette.ink3} uppercase>
        {label}
      </Text>
      {children ?? (
        <Text variant="bodyM" color={theme.palette.ink}>
          {value}
        </Text>
      )}
    </View>
  )
}

const useStyles = createStyles((theme) => ({
  root: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing[12],
    gap: theme.spacing[12],
    minHeight: 44,
  },
}))
