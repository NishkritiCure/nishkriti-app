import { Pressable, View } from 'react-native'

import { createStyles, useTheme } from '@/theme'

import { Text } from './Text'

export interface TagProps {
  readonly label: string
  readonly active?: boolean
  readonly onPress?: () => void
  readonly onRemove?: () => void
  readonly accessibilityLabel?: string
  readonly testID?: string
}

/**
 * Selectable/removable chip. When `onPress` is supplied it becomes a toggle
 * surface; when `onRemove` is supplied a trailing × hit-target appears.
 * A11y role switches accordingly.
 */
export function Tag({
  label,
  active = false,
  onPress,
  onRemove,
  accessibilityLabel,
  testID,
}: TagProps) {
  const theme = useTheme()
  const styles = useStyles()
  const content = (
    <View
      style={[
        styles.root,
        {
          backgroundColor: active ? theme.palette.tealBgStrong : theme.palette.card2,
          borderColor: active ? theme.palette.tealBorder : theme.palette.border,
        },
      ]}
    >
      <Text
        variant="bodyS"
        color={active ? theme.palette.teal : theme.palette.ink}
        style={{ letterSpacing: 0.3 }}
      >
        {label}
      </Text>
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
          onPress={onRemove}
          hitSlop={8}
          testID={testID ? `${testID}-remove` : undefined}
        >
          <Text variant="bodyS" color={theme.palette.ink2}>
            ×
          </Text>
        </Pressable>
      ) : null}
    </View>
  )

  if (!onPress) {
    return content
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      hitSlop={6}
      testID={testID}
    >
      {content}
    </Pressable>
  )
}

const useStyles = createStyles((theme) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
    paddingHorizontal: theme.spacing[12],
    paddingVertical: theme.spacing[8],
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    minHeight: 36,
    alignSelf: 'flex-start',
  },
}))
