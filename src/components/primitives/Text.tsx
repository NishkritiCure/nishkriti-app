import { Text as RNText, type TextProps as RNTextProps } from 'react-native'

import { scaleFont, type TypographyKey, useTheme } from '@/theme'

export interface TextProps extends Omit<RNTextProps, 'style'> {
  readonly variant?: TypographyKey
  readonly color?: string
  readonly align?: 'left' | 'center' | 'right' | 'justify'
  readonly numberOfLines?: number
  readonly uppercase?: boolean
  readonly style?: RNTextProps['style']
}

/**
 * Themed text primitive.
 *
 * Always reads its styling from `theme.typography[variant]` and the palette.
 * Font size is wrapped in `scaleFont` so user dynamic-type settings propagate
 * without the component forgetting to respect them.
 */
export function Text({
  variant = 'bodyM',
  color,
  align,
  uppercase,
  numberOfLines,
  style,
  children,
  ...rest
}: TextProps) {
  const theme = useTheme()
  const token = theme.typography[variant]
  const effectiveColor = color ?? theme.palette.ink

  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[
        {
          color: effectiveColor,
          fontFamily: token.fontFamily,
          fontSize: scaleFont(token.fontSize),
          lineHeight: scaleFont(token.lineHeight),
          fontWeight: token.fontWeight,
          letterSpacing: token.letterSpacing,
          textAlign: align,
          textTransform: uppercase ? 'uppercase' : undefined,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  )
}
