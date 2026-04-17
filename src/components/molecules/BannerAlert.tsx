import { Pressable, View } from 'react-native'

import { Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export type BannerVariant = 'info' | 'warning' | 'error' | 'success'

export interface BannerAlertProps {
  readonly variant: BannerVariant
  readonly title: string
  readonly description?: string
  readonly action?: { readonly label: string; readonly onPress: () => void }
  readonly onDismiss?: () => void
  readonly accessibilityLabel?: string
  readonly testID?: string
}

export function BannerAlert({
  variant,
  title,
  description,
  action,
  onDismiss,
  accessibilityLabel,
  testID,
}: BannerAlertProps) {
  const theme = useTheme()
  const styles = useStyles()
  const { bg, border, text } = variantStyles(variant, theme)

  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel={
        accessibilityLabel ?? `${variant}: ${title}${description ? `. ${description}` : ''}`
      }
      testID={testID}
      style={[styles.root, { backgroundColor: bg, borderColor: border }]}
    >
      <View style={styles.body}>
        <Text variant="labelM" uppercase color={text}>
          {title}
        </Text>
        {description ? (
          <Text variant="bodyS" color={theme.palette.ink2}>
            {description}
          </Text>
        ) : null}
        {action ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={action.onPress}
            hitSlop={8}
            style={styles.action}
            testID={testID ? `${testID}-action` : undefined}
          >
            <Text variant="labelM" color={text} uppercase>
              {action.label}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {onDismiss ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Dismiss ${title}`}
          onPress={onDismiss}
          hitSlop={10}
          style={styles.dismiss}
          testID={testID ? `${testID}-dismiss` : undefined}
        >
          <Text variant="h3" color={theme.palette.ink2}>
            ×
          </Text>
        </Pressable>
      ) : null}
    </View>
  )
}

function variantStyles(variant: BannerVariant, theme: ReturnType<typeof useTheme>) {
  const p = theme.palette
  switch (variant) {
    case 'warning':
      return { bg: p.amberBgMedium, border: p.borderAmber, text: p.amber }
    case 'error':
      return { bg: p.roseBgMedium, border: p.borderRose, text: p.danger }
    case 'success':
      return { bg: p.tealBgMedium, border: p.tealBorder, text: p.teal }
    case 'info':
    default:
      return { bg: p.blueBgMedium, border: p.blueBorder, text: p.info }
  }
}

const useStyles = createStyles((theme) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing[12],
    padding: theme.spacing[16],
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  body: {
    flex: 1,
    gap: theme.spacing[4],
  },
  action: {
    marginTop: theme.spacing[8],
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  dismiss: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
}))
