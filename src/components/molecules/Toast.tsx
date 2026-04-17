import { useEffect } from 'react'
import { Pressable, View } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

import { Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface ToastProps {
  readonly variant: ToastVariant
  readonly title: string
  readonly description?: string | undefined
  readonly duration?: number
  readonly onDismiss?: () => void
  readonly action?: { readonly label: string; readonly onPress: () => void } | undefined
  readonly accessibilityLabel?: string | undefined
  readonly testID?: string | undefined
}

export function Toast({
  variant,
  title,
  description,
  duration = 3000,
  onDismiss,
  action,
  accessibilityLabel,
  testID,
}: ToastProps) {
  const theme = useTheme()
  const styles = useStyles()
  const { bg, border, text } = variantStyles(variant, theme)

  useEffect(() => {
    if (!onDismiss || duration <= 0) return
    const t = setTimeout(onDismiss, duration)
    return () => clearTimeout(t)
  }, [duration, onDismiss])

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel={
        accessibilityLabel ?? `${variant}: ${title}${description ? `. ${description}` : ''}`
      }
      testID={testID}
      style={[styles.root, { backgroundColor: bg, borderColor: border }]}
    >
      <View style={styles.body}>
        <Text variant="labelM" color={text} uppercase>
          {title}
        </Text>
        {description ? (
          <Text variant="bodyS" color={theme.palette.ink}>
            {description}
          </Text>
        ) : null}
      </View>
      {action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={action.onPress}
          hitSlop={8}
          style={styles.action}
        >
          <Text variant="labelM" color={text} uppercase>
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </Animated.View>
  )
}

function variantStyles(variant: ToastVariant, theme: ReturnType<typeof useTheme>) {
  const p = theme.palette
  switch (variant) {
    case 'success':
      return { bg: p.tealBgMedium, border: p.tealBorder, text: p.teal }
    case 'error':
      return { bg: p.roseBgMedium, border: p.borderRose, text: p.danger }
    case 'warning':
      return { bg: p.amberBgMedium, border: p.borderAmber, text: p.amber }
    case 'info':
    default:
      return { bg: p.blueBgMedium, border: p.blueBorder, text: p.info }
  }
}

const useStyles = createStyles((theme) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[12],
    padding: theme.spacing[16],
    borderRadius: theme.radius.md,
    borderWidth: 1,
    minHeight: 56,
  },
  body: {
    flex: 1,
    gap: theme.spacing[2],
  },
  action: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[8],
  },
}))
