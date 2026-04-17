import { Pressable, View } from 'react-native'

import { createStyles, useTheme } from '@/theme'

export interface SwitchProps {
  readonly value: boolean
  readonly onValueChange: (next: boolean) => void
  readonly disabled?: boolean
  readonly accessibilityLabel: string
  readonly accessibilityHint?: string
  readonly testID?: string
}

export function Switch({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: SwitchProps) {
  const theme = useTheme()
  const styles = useStyles()

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      testID={testID}
      disabled={disabled}
      hitSlop={10}
      onPress={() => onValueChange(!value)}
      style={[
        styles.track,
        {
          backgroundColor: value ? theme.palette.teal : theme.palette.card2,
          borderColor: value ? theme.palette.teal : theme.palette.border,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.thumb,
          {
            backgroundColor: theme.isDark ? theme.palette.bg : theme.palette.deep,
            transform: [{ translateX: value ? 22 : 2 }],
          },
        ]}
      />
    </Pressable>
  )
}

const useStyles = createStyles((theme) => ({
  track: {
    width: 48,
    height: 28,
    minWidth: 48,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.pill,
  },
}))
