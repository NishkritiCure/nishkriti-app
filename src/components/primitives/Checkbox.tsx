import { Pressable, View } from 'react-native'

import { createStyles, useTheme } from '@/theme'

import { Text } from './Text'

export interface CheckboxProps {
  readonly checked: boolean
  readonly onChange: (next: boolean) => void
  readonly label?: string
  readonly disabled?: boolean
  readonly accessibilityLabel?: string
  readonly testID?: string
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  accessibilityLabel,
  testID,
}: CheckboxProps) {
  const theme = useTheme()
  const styles = useStyles()

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
      disabled={disabled}
      hitSlop={10}
      onPress={() => onChange(!checked)}
      style={[styles.row, disabled && styles.disabled]}
    >
      <View
        style={[
          styles.box,
          {
            backgroundColor: checked ? theme.palette.teal : 'transparent',
            borderColor: checked ? theme.palette.teal : theme.palette.border2,
          },
        ]}
      >
        {checked ? (
          <CheckMark color={theme.isDark ? theme.palette.bg : theme.palette.deep} />
        ) : null}
      </View>
      {label ? (
        <Text variant="bodyM" color={theme.palette.ink} style={styles.label}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  )
}

function CheckMark({ color }: { color: string }) {
  // Simple check glyph using a triangle of borders — avoids pulling in an SVG
  // dependency for a single-point decoration. Rotates a 10×6 L shape.
  return (
    <View
      style={{
        width: 12,
        height: 6,
        borderLeftWidth: 2,
        borderBottomWidth: 2,
        borderColor: color,
        transform: [{ rotate: '-45deg' }],
        marginTop: -2,
      }}
    />
  )
}

const useStyles = createStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[12],
    minHeight: 44,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
  },
  disabled: {
    opacity: 0.5,
  },
}))
