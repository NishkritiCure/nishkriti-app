import { useCallback, useMemo, useState } from 'react'
import {
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  View,
  type GestureResponderEvent,
} from 'react-native'

import { Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export interface NSliderProps {
  readonly min: number
  readonly max: number
  readonly value: number
  readonly step?: number
  readonly unit?: string
  readonly onValueChange: (next: number) => void
  readonly disabled?: boolean
  readonly accessibilityLabel: string
  readonly testID?: string
}

/**
 * Tappable + draggable numeric slider with full accessibility. The pan
 * gesture is PanResponder-based (RN-core, no gesture-handler dependency).
 * VoiceOver flags it as role "adjustable" with accessibilityValue so the
 * rotor can increment/decrement in standard steps.
 */
export function NSlider({
  min,
  max,
  value,
  step = 1,
  unit,
  onValueChange,
  disabled = false,
  accessibilityLabel,
  testID,
}: NSliderProps) {
  const theme = useTheme()
  const styles = useStyles()
  const [trackWidth, setTrackWidth] = useState(0)

  const clamp = useCallback(
    (raw: number) => {
      const rounded = Math.round(raw / step) * step
      return Math.max(min, Math.min(max, rounded))
    },
    [min, max, step]
  )

  const percent = trackWidth > 0 ? ((value - min) / (max - min)) * 100 : 0

  const pointerToValue = useCallback(
    (locationX: number) => {
      if (trackWidth <= 0) return value
      const pct = Math.max(0, Math.min(1, locationX / trackWidth))
      return clamp(min + pct * (max - min))
    },
    [trackWidth, min, max, clamp, value]
  )

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderMove: (event: GestureResponderEvent) => {
          onValueChange(pointerToValue(event.nativeEvent.locationX))
        },
        onPanResponderGrant: (event: GestureResponderEvent) => {
          onValueChange(pointerToValue(event.nativeEvent.locationX))
        },
      }),
    [disabled, onValueChange, pointerToValue]
  )

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width)
  }, [])

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value, text: `${value}${unit ? ` ${unit}` : ''}` }}
      accessibilityState={{ disabled }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (disabled) return
        const delta = e.nativeEvent.actionName === 'increment' ? step : -step
        onValueChange(clamp(value + delta))
      }}
      testID={testID}
      style={[styles.root, disabled && styles.disabled]}
    >
      <View style={styles.labelRow}>
        <Text variant="labelM" color={theme.palette.ink3} uppercase>
          {accessibilityLabel}
        </Text>
        <Text variant="h3" color={theme.palette.spring}>
          {value}
          {unit ? (
            <Text variant="bodyS" color={theme.palette.ink2}>
              {` ${unit}`}
            </Text>
          ) : null}
        </Text>
      </View>
      <Pressable
        onLayout={onLayout}
        {...panResponder.panHandlers}
        style={[
          styles.track,
          { backgroundColor: theme.palette.card2, borderColor: theme.palette.border },
        ]}
        testID={testID ? `${testID}-track` : undefined}
      >
        <View
          style={[styles.fill, { width: `${percent}%`, backgroundColor: theme.palette.teal }]}
        />
        <View
          style={[
            styles.thumb,
            {
              left: `${Math.max(0, Math.min(100, percent))}%`,
              backgroundColor: theme.palette.teal,
              borderColor: theme.isDark ? theme.palette.bg : theme.palette.deep,
            },
          ]}
        />
      </Pressable>
    </View>
  )
}

const useStyles = createStyles((theme) => ({
  root: {
    gap: theme.spacing[8],
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: theme.spacing[8],
  },
  track: {
    height: 44,
    borderWidth: 1,
    borderRadius: theme.radius.pill,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  thumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: theme.radius.pill,
    borderWidth: 3,
    marginLeft: -14,
    top: 8,
  },
  disabled: {
    opacity: 0.5,
  },
}))
