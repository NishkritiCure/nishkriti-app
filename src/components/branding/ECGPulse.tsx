import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'

import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useTheme } from '@/theme'

// 6-step cycle per APP-DESIGN-REFERENCE §7.4 on a 2800ms timeline:
//   0 → 200ms    opacity 0 → 1 (enter)
//   0 → 1600ms   translateX −width → 0 (sweep)
//   1600ms hold
//   1600 → 1900  opacity 1 → 0 (fade)
//   1900 → 2400  delay (0 opacity)
//   2400 → 2800  reset (tx back to −width, held opacity 0)
// These phases as fractions of the 2800ms timeline:
const PHASES = {
  enterEnd: 200 / 2800, //   0.0714
  sweepEnd: 1600 / 2800, //  0.5714
  fadeEnd: 1900 / 2800, //   0.6786
  delayEnd: 2400 / 2800, //  0.8571
  // cycleEnd = 1.0
} as const

const TOTAL_MS = 2800

export interface ECGPulseProps {
  readonly width?: number
  readonly height?: number
  readonly color?: string
  readonly strokeWidth?: number
  readonly accessibilityLabel?: string
  readonly testID?: string
}

export function ECGPulse({
  width = 200,
  height = 40,
  color,
  strokeWidth = 1.5,
  accessibilityLabel = 'ECG pulse animation',
  testID,
}: ECGPulseProps) {
  const theme = useTheme()
  const reducedMotion = useReducedMotion()
  const progress = useSharedValue(0)
  const effectiveColor = color ?? theme.palette.teal

  useEffect(() => {
    if (reducedMotion) {
      progress.value = PHASES.enterEnd
      return
    }
    progress.value = 0
    progress.value = withRepeat(
      withTiming(1, { duration: TOTAL_MS, easing: Easing.linear }),
      -1,
      false
    )
    return () => {
      cancelAnimation(progress)
    }
  }, [reducedMotion, progress])

  const animatedStyle = useAnimatedStyle(() => {
    'worklet'
    const t = progress.value

    let opacity: number
    if (t < PHASES.enterEnd) {
      opacity = t / PHASES.enterEnd
    } else if (t < PHASES.sweepEnd) {
      opacity = 1
    } else if (t < PHASES.fadeEnd) {
      opacity = 1 - (t - PHASES.sweepEnd) / (PHASES.fadeEnd - PHASES.sweepEnd)
    } else {
      opacity = 0
    }

    let translate: number
    if (t < PHASES.sweepEnd) {
      translate = -width + (t / PHASES.sweepEnd) * width
    } else {
      translate = 0
    }

    return {
      opacity,
      transform: [{ translateX: translate }],
    }
  })

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[styles.container, { width, height }]}
    >
      <Animated.View style={[styles.inner, animatedStyle]}>
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Path
            d={`M0,${height / 2} L${width * 0.2},${height / 2} L${width * 0.28},${
              height * 0.4
            } L${width * 0.3},${height * 0.6} L${width * 0.32},${height / 2} L${
              width * 0.37
            },${height * 0.2} L${width * 0.4},${height * 0.85} L${width * 0.43},${
              height * 0.05
            } L${width * 0.46},${height * 0.9} L${width * 0.49},${height * 0.2} L${
              width * 0.52
            },${height / 2} L${width * 0.7},${height / 2} L${width},${height / 2}`}
            fill="none"
            stroke={effectiveColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  inner: {
    flex: 1,
  },
})
