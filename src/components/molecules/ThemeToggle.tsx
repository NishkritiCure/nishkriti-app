import { Pressable, View } from 'react-native'

import { Text } from '@/components/primitives'
import { createStyles, type ThemeMode, useTheme } from '@/theme'

const OPTIONS: ReadonlyArray<{ readonly value: ThemeMode; readonly label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'Auto' },
  { value: 'dark', label: 'Dark' },
]

export interface ThemeToggleProps {
  readonly accessibilityLabel?: string
  readonly testID?: string
}

export function ThemeToggle({ accessibilityLabel = 'Appearance', testID }: ThemeToggleProps) {
  const theme = useTheme()
  const styles = useStyles()

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[styles.group, { borderColor: theme.palette.border }]}
    >
      {OPTIONS.map((opt) => {
        const active = theme.mode === opt.value
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={opt.label}
            onPress={() => theme.setMode(opt.value)}
            hitSlop={6}
            style={[
              styles.segment,
              {
                backgroundColor: active ? theme.palette.em : 'transparent',
              },
            ]}
            testID={testID ? `${testID}-${opt.value}` : undefined}
          >
            <Text
              variant="labelM"
              color={active ? theme.palette.ink : theme.palette.ink2}
              uppercase
            >
              {opt.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const useStyles = createStyles((theme) => ({
  group: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: theme.radius.pill,
    alignSelf: 'flex-start',
    padding: theme.spacing[2],
  },
  segment: {
    minHeight: 40,
    minWidth: 64,
    paddingHorizontal: theme.spacing[12],
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
}))
