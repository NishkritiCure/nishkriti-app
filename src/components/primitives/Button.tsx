import { ActivityIndicator, Pressable, type PressableProps, View } from 'react-native'

import { createStyles, scaleFont, useTheme } from '@/theme'

import { Text } from './Text'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  readonly label: string
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize
  readonly loading?: boolean
  readonly disabled?: boolean
  readonly leftIcon?: React.ReactNode
  readonly rightIcon?: React.ReactNode
  readonly fullWidth?: boolean
  readonly accessibilityLabel?: string
  readonly accessibilityHint?: string
  readonly testID?: string
}

const HEIGHTS: Record<ButtonSize, number> = { sm: 40, md: 48, lg: 56 }

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
  onPress,
  ...rest
}: ButtonProps) {
  const theme = useTheme()
  const styles = useStyles()
  const isDisabled = disabled || loading

  const { bg, textColor, borderColor } = getVariantColors(variant, theme)

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
      disabled={isDisabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.root,
        {
          height: HEIGHTS[size],
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === 'secondary' || variant === 'ghost' ? 1 : 0,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} testID={testID ? `${testID}-spinner` : undefined} />
      ) : (
        <View style={styles.inner}>
          {leftIcon}
          <Text
            variant={size === 'sm' ? 'bodyS' : 'bodyM'}
            color={textColor}
            style={{
              fontFamily: theme.typography.h4.fontFamily,
              fontWeight: '600',
              letterSpacing: 0.3,
              fontSize: scaleFont(size === 'sm' ? 14 : 16),
            }}
          >
            {label}
          </Text>
          {rightIcon}
        </View>
      )}
    </Pressable>
  )
}

function getVariantColors(variant: ButtonVariant, theme: ReturnType<typeof useTheme>) {
  const p = theme.palette
  switch (variant) {
    case 'primary':
      return { bg: p.teal, textColor: theme.isDark ? p.bg : p.deep, borderColor: 'transparent' }
    case 'secondary':
      return { bg: 'transparent', textColor: p.teal, borderColor: p.tealBorder }
    case 'ghost':
      return { bg: 'transparent', textColor: p.ink, borderColor: p.border }
    case 'danger':
      return { bg: p.danger, textColor: theme.isDark ? p.bg : p.deep, borderColor: 'transparent' }
  }
}

const useStyles = createStyles((theme) => ({
  root: {
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing[20],
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[8],
  },
}))
