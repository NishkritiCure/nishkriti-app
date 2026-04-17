import { Pressable, type PressableProps, View, type ViewProps, type ViewStyle } from 'react-native'

import { createStyles } from '@/theme'

export type CardElevation = 'flat' | 'raised' | 'elevated'
export type CardSurface = 'card' | 'card2' | 'card3'

export interface CardProps extends ViewProps {
  readonly surface?: CardSurface
  readonly elevation?: CardElevation
  readonly padding?: number
  readonly onPress?: PressableProps['onPress']
  readonly accessibilityLabel?: string
  readonly accessibilityHint?: string
  readonly testID?: string
}

export function Card({
  surface = 'card',
  elevation = 'flat',
  padding,
  onPress,
  children,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
  ...rest
}: CardProps) {
  const styles = useStyles()
  const combinedStyle: ViewStyle = {
    ...styles.root,
    backgroundColor: styles[`surface_${surface}`].backgroundColor,
    ...(elevation === 'flat' ? {} : elevation === 'raised' ? styles.raised : styles.elevated),
    ...(padding !== undefined ? { padding } : {}),
  }

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        testID={testID}
        hitSlop={6}
        onPress={onPress}
        style={({ pressed }) => [combinedStyle, { opacity: pressed ? 0.9 : 1 }, style]}
      >
        {children}
      </Pressable>
    )
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[combinedStyle, style]}
      {...rest}
    >
      {children}
    </View>
  )
}

const useStyles = createStyles((theme) => ({
  root: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing[16],
    borderWidth: 1,
    borderColor: theme.palette.border,
  },
  surface_card: { backgroundColor: theme.palette.card },
  surface_card2: { backgroundColor: theme.palette.card2 },
  surface_card3: { backgroundColor: theme.palette.card3 },
  raised: theme.shadows.card,
  elevated: theme.shadows.phone,
}))
