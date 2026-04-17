import { Modal, Pressable, ScrollView, View } from 'react-native'

import { Button, Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export interface InfoSheetProps {
  readonly visible: boolean
  readonly onDismiss: () => void
  readonly title: string
  readonly body: string | React.ReactNode
  readonly dismissLabel?: string
  readonly accessibilityLabel?: string
  readonly testID?: string
}

export function InfoSheet({
  visible,
  onDismiss,
  title,
  body,
  dismissLabel = 'Got it',
  accessibilityLabel,
  testID,
}: InfoSheetProps) {
  const theme = useTheme()
  const styles = useStyles()
  return (
    <Modal
      visible={visible}
      onRequestClose={onDismiss}
      animationType="fade"
      transparent
      accessibilityViewIsModal
      testID={testID}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        style={[styles.backdrop, { backgroundColor: theme.palette.modalBackdrop }]}
        onPress={onDismiss}
      />
      <View style={styles.wrap} pointerEvents="box-none">
        <View
          accessibilityLabel={accessibilityLabel ?? title}
          style={[
            styles.card,
            { backgroundColor: theme.palette.deep, borderColor: theme.palette.border },
          ]}
        >
          <Text variant="h2" color={theme.palette.ink}>
            {title}
          </Text>
          <ScrollView>
            {typeof body === 'string' ? (
              <Text variant="bodyM" color={theme.palette.ink}>
                {body}
              </Text>
            ) : (
              body
            )}
          </ScrollView>
          <Button label={dismissLabel} onPress={onDismiss} fullWidth />
        </View>
      </View>
    </Modal>
  )
}

const useStyles = createStyles((theme) => ({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[16],
  },
  card: {
    width: '100%',
    maxHeight: '80%',
    padding: theme.spacing[24],
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    gap: theme.spacing[12],
  },
}))
