import { Modal, Pressable, View } from 'react-native'

import { Button, Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export interface ConfirmSheetProps {
  readonly visible: boolean
  readonly onConfirm: () => void
  readonly onCancel: () => void
  readonly title: string
  readonly description?: string
  readonly confirmLabel?: string
  readonly cancelLabel?: string
  readonly destructive?: boolean
  readonly accessibilityLabel?: string
  readonly testID?: string
}

export function ConfirmSheet({
  visible,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  accessibilityLabel,
  testID,
}: ConfirmSheetProps) {
  const theme = useTheme()
  const styles = useStyles()
  return (
    <Modal
      visible={visible}
      onRequestClose={onCancel}
      animationType="fade"
      transparent
      accessibilityViewIsModal
      testID={testID}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cancel"
        style={[styles.backdrop, { backgroundColor: theme.palette.modalBackdrop }]}
        onPress={onCancel}
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
          {description ? (
            <Text variant="bodyM" color={theme.palette.ink2}>
              {description}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Button label={cancelLabel} variant="ghost" onPress={onCancel} fullWidth />
            <Button
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              fullWidth
            />
          </View>
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
    justifyContent: 'flex-end',
    padding: theme.spacing[16],
  },
  card: {
    width: '100%',
    padding: theme.spacing[24],
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    gap: theme.spacing[12],
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing[12],
    marginTop: theme.spacing[12],
  },
}))
