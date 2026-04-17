import { useEffect } from 'react'
import { View, type ViewStyle } from 'react-native'
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { useReducedMotion } from '@/hooks/useReducedMotion'
import { createStyles, useTheme } from '@/theme'

export interface SkeletonProps {
  readonly width?: number | string
  readonly height?: number
  readonly radius?: number
  readonly style?: ViewStyle
  readonly accessibilityLabel?: string
  readonly testID?: string
}

/**
 * Shimmer placeholder. Respects useReducedMotion — in reduced-motion mode
 * the shimmer is static (a flat surface of the subtler shimmer tone).
 */
export function Skeleton({
  width = '100%',
  height = 16,
  radius,
  style,
  accessibilityLabel = 'Loading',
  testID,
}: SkeletonProps) {
  const theme = useTheme()
  const styles = useStyles()
  const reducedMotion = useReducedMotion()
  const opacity = useSharedValue(reducedMotion ? 0.6 : 0.4)

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 0.6
      return
    }
    opacity.value = withRepeat(withTiming(0.9, { duration: 900 }), -1, true)
    return () => cancelAnimation(opacity)
  }, [reducedMotion, opacity])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[
        styles.base,
        {
          width: width as ViewStyle['width'],
          height,
          borderRadius: radius ?? theme.radius.sm,
        },
        animatedStyle,
        style,
      ]}
    />
  )
}

/** Helper used by screen skeletons for a row of fixed-height lines. */
export function SkeletonLines({
  count,
  spacing = 12,
  lineHeight = 14,
  testID,
}: {
  readonly count: number
  readonly spacing?: number
  readonly lineHeight?: number
  readonly testID?: string
}) {
  return (
    <View style={{ gap: spacing }} testID={testID}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} height={lineHeight} width={i === count - 1 ? '70%' : '100%'} />
      ))}
    </View>
  )
}

const useStyles = createStyles((theme) => ({
  base: {
    backgroundColor: theme.palette.card2,
  } satisfies ViewStyle,
}))
