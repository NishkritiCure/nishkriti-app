import { Image, View } from 'react-native'

import { createStyles, scaleFont, useTheme } from '@/theme'

import { Text } from './Text'

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

const DIMS: Record<AvatarSize, number> = { sm: 28, md: 40, lg: 56, xl: 72 }

export interface AvatarProps {
  readonly initials?: string
  readonly uri?: string
  readonly size?: AvatarSize | number
  readonly backgroundColor?: string
  readonly accessibilityLabel?: string
  readonly testID?: string
}

export function Avatar({
  initials,
  uri,
  size = 'md',
  backgroundColor,
  accessibilityLabel,
  testID,
}: AvatarProps) {
  const theme = useTheme()
  const styles = useStyles()
  const dim = typeof size === 'number' ? size : DIMS[size]
  const bg = backgroundColor ?? theme.palette.card2

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? `Avatar ${initials ?? ''}`}
      testID={testID}
      style={[
        styles.root,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: bg,
          borderColor: theme.palette.border2,
        },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: dim, height: dim, borderRadius: dim / 2 }}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text
          variant="h4"
          color={theme.palette.ink}
          style={{
            fontSize: scaleFont(dim * 0.38),
            lineHeight: scaleFont(dim * 0.46),
          }}
        >
          {(initials ?? '??').slice(0, 2).toUpperCase()}
        </Text>
      )}
    </View>
  )
}

const useStyles = createStyles(() => ({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
}))
