import { Pressable, View, type ViewStyle } from 'react-native'

import { Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export type PillTone = 'teal' | 'amber' | 'rose' | 'blue' | 'dim' | 'em'

export interface PillProps {
  readonly label: string
  readonly tone?: PillTone
  readonly onPress?: () => void
  readonly style?: ViewStyle
  readonly accessibilityLabel?: string | undefined
  readonly testID?: string | undefined
}

export function Pill({
  label,
  tone = 'teal',
  onPress,
  style,
  accessibilityLabel,
  testID,
}: PillProps) {
  const theme = useTheme()
  const styles = useStyles()
  const { bg, border, text } = tonePalette(tone, theme)

  const content = (
    <View
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
      style={[styles.root, { backgroundColor: bg, borderColor: border }, style]}
    >
      <Text variant="labelS" color={text} uppercase style={{ letterSpacing: 0.8 }}>
        {label}
      </Text>
    </View>
  )

  if (!onPress) return content
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      {content}
    </Pressable>
  )
}

function tonePalette(tone: PillTone, theme: ReturnType<typeof useTheme>) {
  const p = theme.palette
  switch (tone) {
    case 'teal':
      return { bg: p.tealBgStrong, border: p.tealBorder, text: p.teal }
    case 'amber':
      return { bg: p.amberBgStrong, border: p.borderAmber, text: p.amber }
    case 'rose':
      return { bg: p.roseBgStrong, border: p.roseBorder, text: p.rose }
    case 'blue':
      return { bg: p.blueBgStrong, border: p.blueBorder, text: p.blue }
    case 'em':
      return { bg: p.em, border: p.border2, text: p.ink }
    case 'dim':
    default:
      return { bg: p.whiteOverlay, border: p.border, text: p.ink2 }
  }
}

const useStyles = createStyles((theme) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[12],
    minHeight: 44,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
}))
