import { Pressable, type PressableProps, type ViewStyle } from 'react-native'

import { createStyles, useTheme } from '@/theme'

export type IconButtonSize = 'sm' | 'md' | 'lg'
export type IconButtonVariant = 'ghost' | 'filled' | 'tonal'

const SIZES: Record<IconButtonSize, number> = { sm: 36, md: 44, lg: 52 }

export interface IconButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  readonly icon: React.ReactNode
  readonly accessibilityLabel: string
  readonly accessibilityHint?: string
  readonly size?: IconButtonSize
  readonly variant?: IconButtonVariant
  readonly disabled?: boolean
  readonly style?: ViewStyle
  readonly testID?: string
}

export function IconButton({
  icon,
  accessibilityLabel,
  accessibilityHint,
  size = 'md',
  variant = 'ghost',
  disabled = false,
  onPress,
  style,
  testID,
  ...rest
}: IconButtonProps) {
  const theme = useTheme()
  const styles = useStyles()
  const dim = SIZES[size]

  const { bg, borderColor, borderWidth } = getVariantStyle(variant, theme)

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.root,
        {
          width: dim,
          height: dim,
          borderRadius: theme.radius.pill,
          backgroundColor: bg,
          borderColor,
          borderWidth,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {icon}
    </Pressable>
  )
}

function getVariantStyle(variant: IconButtonVariant, theme: ReturnType<typeof useTheme>) {
  const p = theme.palette
  switch (variant) {
    case 'filled':
      return { bg: p.teal, borderColor: 'transparent', borderWidth: 0 }
    case 'tonal':
      return { bg: p.tealBgStrong, borderColor: p.tealBorder, borderWidth: 1 }
    case 'ghost':
    default:
      return { bg: 'transparent', borderColor: p.border, borderWidth: 1 }
  }
}

const useStyles = createStyles(() => ({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
}))
