import { View } from 'react-native'

import { Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export type MessageBubbleVariant = 'sent' | 'received'
export type MessageBubbleStatus = 'sent' | 'delivered' | 'read'

export interface MessageBubbleProps {
  readonly variant: MessageBubbleVariant
  readonly body: string
  readonly timestamp: string
  readonly status?: MessageBubbleStatus
  readonly accessibilityLabel?: string
  readonly testID?: string
}

export function MessageBubble({
  variant,
  body,
  timestamp,
  status,
  accessibilityLabel,
  testID,
}: MessageBubbleProps) {
  const theme = useTheme()
  const styles = useStyles()
  const isSent = variant === 'sent'
  const bg = isSent ? theme.palette.tealBgStrong : theme.palette.card
  const border = isSent ? theme.palette.tealBorder : theme.palette.border
  const textColor = theme.palette.ink
  const composed =
    accessibilityLabel ??
    `${isSent ? 'Sent' : 'Received'}: ${body}. ${timestamp}${status ? `, ${status}` : ''}.`

  return (
    <View
      accessible
      accessibilityLabel={composed}
      testID={testID}
      style={[styles.wrap, { alignSelf: isSent ? 'flex-end' : 'flex-start' }]}
    >
      <View style={[styles.bubble, { backgroundColor: bg, borderColor: border }]}>
        <Text variant="bodyM" color={textColor}>
          {body}
        </Text>
      </View>
      <View style={styles.meta}>
        <Text variant="labelS" color={theme.palette.ink3} uppercase>
          {timestamp}
        </Text>
        {status ? (
          <Text variant="labelS" color={theme.palette.ink3} uppercase>
            {status}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

const useStyles = createStyles((theme) => ({
  wrap: {
    maxWidth: '85%',
    gap: theme.spacing[4],
  },
  bubble: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    paddingHorizontal: theme.spacing[12],
    paddingVertical: theme.spacing[8],
    minHeight: 44,
    justifyContent: 'center',
  },
  meta: {
    flexDirection: 'row',
    gap: theme.spacing[8],
  },
}))
