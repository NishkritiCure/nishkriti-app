import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Defs, LinearGradient, Mask, Path, Rect, Stop } from 'react-native-svg'

import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  LOGO_ASPECT_RATIO,
  LOGO_GRADIENT,
  LOGO_INLINE_ECG_PATH,
  LOGO_N_PATH,
  LOGO_SHINE_GRADIENT,
  LOGO_VIEWBOX,
  useTheme,
} from '@/theme'

export type LogoSize = 'sm' | 'md' | 'lg' | 'xl'

const SIZE_PX: Record<LogoSize, number> = {
  sm: 24,
  md: 40,
  lg: 64,
  xl: 120,
}

export interface NishkritiLogoProps {
  readonly size?: LogoSize | number
  readonly showPulse?: boolean
  readonly pulseColor?: string
  readonly accessibilityLabel?: string
  readonly testID?: string
}

export function NishkritiLogo({
  size = 'md',
  showPulse = true,
  pulseColor,
  accessibilityLabel = 'Nishkriti logo',
  testID,
}: NishkritiLogoProps) {
  const theme = useTheme()
  const reducedMotion = useReducedMotion()
  const width = typeof size === 'number' ? size : SIZE_PX[size]
  const height = width * LOGO_ASPECT_RATIO
  const scale = useSharedValue(1)
  const effectivePulseColor = pulseColor ?? theme.palette.teal

  const shouldAnimate = showPulse && !reducedMotion

  useEffect(() => {
    if (!shouldAnimate) {
      scale.value = 1
      return
    }
    scale.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 1200 }), withTiming(1, { duration: 1200 })),
      -1,
      false
    )
    return () => {
      cancelAnimation(scale)
    }
  }, [shouldAnimate, scale])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={styles.wrapper}
    >
      <Animated.View style={[{ width, height }, animatedStyle]}>
        <Svg width={width} height={height} viewBox={LOGO_VIEWBOX}>
          <Defs>
            <LinearGradient
              id="nishkriti-mg"
              x1="0"
              y1="0"
              x2="180"
              y2="214"
              gradientUnits="userSpaceOnUse"
            >
              {LOGO_GRADIENT.map((stop) => (
                <Stop key={stop.offset} offset={stop.offset} stopColor={stop.stopColor} />
              ))}
            </LinearGradient>
            <LinearGradient
              id="nishkriti-shine"
              x1="0"
              y1="0"
              x2="164"
              y2="0"
              gradientUnits="userSpaceOnUse"
            >
              {LOGO_SHINE_GRADIENT.map((stop) => (
                <Stop
                  key={stop.offset}
                  offset={stop.offset}
                  stopColor={stop.stopColor}
                  stopOpacity={stop.stopOpacity}
                />
              ))}
            </LinearGradient>
            <Mask id="nishkriti-cx">
              <Rect x="0" y="0" width="180" height="214" fill="white" />
              <Rect x="81" y="80" width="18" height="68" rx="9" fill="black" />
              <Rect x="56" y="105" width="68" height="18" rx="9" fill="black" />
            </Mask>
          </Defs>

          {/* Shine bar at top of the mark */}
          <Rect x="8" y="4" width="164" height="7" rx="3.5" fill="url(#nishkriti-shine)" />

          {/* The N itself, masked by the crosshair cutout */}
          <Path d={LOGO_N_PATH} fill="url(#nishkriti-mg)" mask="url(#nishkriti-cx)" />

          {/* Decorative inline ECG pulse line (only shown with showPulse). */}
          {showPulse ? (
            <Path
              d={LOGO_INLINE_ECG_PATH}
              fill="none"
              stroke={effectivePulseColor}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.9}
            />
          ) : null}
        </Svg>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
  },
})
