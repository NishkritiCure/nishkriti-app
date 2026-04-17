import { Modal, Pressable, ScrollView, View } from 'react-native'

import { IconButton, Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export interface DrillDownModalProps {
  readonly visible: boolean
  readonly onDismiss: () => void
  readonly title: string
  readonly children: React.ReactNode
  readonly accessibilityLabel?: string
  readonly testID?: string
}

/**
 * Full-height modal with a drag-down affordance (visual only) and close
 * button. Content scrolls. Used for "see all history" drill-downs.
 */
export function DrillDownModal({
  visible,
  onDismiss,
  title,
  children,
  accessibilityLabel,
  testID,
}: DrillDownModalProps) {
  const theme = useTheme()
  const styles = useStyles()
  return (
    <Modal
      visible={visible}
      onRequestClose={onDismiss}
      animationType="slide"
      transparent
      presentationStyle="overFullScreen"
      accessibilityViewIsModal
      testID={testID}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        style={[styles.backdrop, { backgroundColor: theme.palette.modalBackdrop }]}
        onPress={onDismiss}
      />
      <View
        accessibilityLabel={accessibilityLabel ?? title}
        style={[
          styles.sheet,
          { backgroundColor: theme.palette.deep, borderColor: theme.palette.border },
        ]}
      >
        <View style={styles.grabber}>
          <View style={[styles.grabberBar, { backgroundColor: theme.palette.border2 }]} />
        </View>
        <View style={styles.header}>
          <Text variant="h2" color={theme.palette.ink}>
            {title}
          </Text>
          <IconButton
            icon={
              <Text variant="h3" color={theme.palette.ink}>
                ×
              </Text>
            }
            accessibilityLabel="Close"
            onPress={onDismiss}
            testID={testID ? `${testID}-close` : undefined}
          />
        </View>
        <ScrollView contentContainerStyle={styles.body}>{children}</ScrollView>
      </View>
    </Modal>
  )
}

const useStyles = createStyles((theme) => ({
  backdrop: {
    ...({ position: 'absolute' } as const),
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sheet: {
    flex: 1,
    marginTop: 72,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  grabber: {
    alignItems: 'center',
    paddingVertical: theme.spacing[8],
  },
  grabberBar: {
    width: 48,
    height: 4,
    borderRadius: theme.radius.pill,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[16],
    paddingBottom: theme.spacing[12],
  },
  body: {
    paddingHorizontal: theme.spacing[16],
    paddingBottom: theme.spacing[32],
    gap: theme.spacing[16],
  },
}))
