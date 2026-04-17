import { View, type ViewProps } from 'react-native'

import { createStyles, useTheme } from '@/theme'

import { Text } from './Text'

export type BadgeTone = 'neutral' | 'teal' | 'rose' | 'amber' | 'blue' | 'em'

export interface BadgeProps extends Omit<ViewProps, 'style'> {
  readonly label: string
  readonly tone?: BadgeTone | undefined
  readonly icon?: React.ReactNode | undefined
  readonly accessibilityLabel?: string | undefined
  readonly testID?: string | undefined
}

export function Badge({
  label,
  tone = 'neutral',
  icon,
  accessibilityLabel,
  testID,
  ...rest
}: BadgeProps) {
  const theme = useTheme()
  const styles = useStyles()
  const { bg, border, textColor } = getTone(tone, theme)

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
      style={[styles.root, { backgroundColor: bg, borderColor: border }]}
      {...rest}
    >
      {icon}
      <Text variant="labelS" color={textColor} uppercase style={{ letterSpacing: 0.8 }}>
        {label}
      </Text>
    </View>
  )
}

function getTone(tone: BadgeTone, theme: ReturnType<typeof useTheme>) {
  const p = theme.palette
  switch (tone) {
    case 'teal':
      return { bg: p.tealBgStrong, border: p.tealBorder, textColor: p.teal }
    case 'rose':
      return { bg: p.roseBgStrong, border: p.roseBorder, textColor: p.rose }
    case 'amber':
      return { bg: p.amberBgStrong, border: p.borderAmber, textColor: p.amber }
    case 'blue':
      return { bg: p.blueBgStrong, border: p.blueBorder, textColor: p.blue }
    case 'em':
      return { bg: p.em, border: p.border2, textColor: p.ink }
    case 'neutral':
    default:
      return { bg: p.whiteOverlay, border: p.border, textColor: p.ink2 }
  }
}

const useStyles = createStyles((theme) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[4],
    paddingHorizontal: theme.spacing[8],
    paddingVertical: theme.spacing[4],
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
}))
