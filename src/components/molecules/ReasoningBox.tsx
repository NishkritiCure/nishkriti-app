import { View } from 'react-native'

import { Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export interface ReasoningBoxProps {
  readonly title?: string
  readonly body: string | React.ReactNode
  readonly accent?: 'teal' | 'amber' | 'rose' | 'blue'
  readonly accessibilityLabel?: string
  readonly testID?: string
}

/**
 * Highlighted block with a left accent rail and tinted background. Used
 * for "WHY TODAY IS DIFFERENT" style insights where the engine wants to
 * surface reasoning to the patient or doctor.
 */
export function ReasoningBox({
  title,
  body,
  accent = 'teal',
  accessibilityLabel,
  testID,
}: ReasoningBoxProps) {
  const theme = useTheme()
  const styles = useStyles()
  const { bg, border } = toneStyles(accent, theme)

  return (
    <View
      accessible
      accessibilityLabel={
        accessibilityLabel ?? title ?? (typeof body === 'string' ? body : 'Reasoning')
      }
      testID={testID}
      style={[styles.root, { backgroundColor: bg }]}
    >
      <View style={[styles.rail, { backgroundColor: border }]} />
      <View style={styles.body}>
        {title ? (
          <Text variant="labelM" uppercase color={theme.palette.ink2} style={styles.title}>
            {title}
          </Text>
        ) : null}
        {typeof body === 'string' ? (
          <Text variant="bodyM" color={theme.palette.ink}>
            {body}
          </Text>
        ) : (
          body
        )}
      </View>
    </View>
  )
}

function toneStyles(
  accent: NonNullable<ReasoningBoxProps['accent']>,
  theme: ReturnType<typeof useTheme>
) {
  const p = theme.palette
  switch (accent) {
    case 'amber':
      return { bg: p.amberBgMedium, border: p.borderAmber }
    case 'rose':
      return { bg: p.roseBgMedium, border: p.borderRose }
    case 'blue':
      return { bg: p.blueBgMedium, border: p.blueBorder }
    case 'teal':
    default:
      return { bg: p.heroGlow, border: p.tealBorder }
  }
}

const useStyles = createStyles((theme) => ({
  root: {
    flexDirection: 'row',
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    minHeight: 48,
  },
  rail: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: theme.spacing[16],
    gap: theme.spacing[4],
  },
  title: {
    letterSpacing: 2,
  },
}))
