import { Modal, Pressable, ScrollView, View } from 'react-native'

import { Button, Checkbox, Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export interface BatchApproveItem {
  readonly id: string
  readonly label: string
  readonly secondary?: string
}

export interface BatchApproveSheetProps {
  readonly visible: boolean
  readonly items: ReadonlyArray<BatchApproveItem>
  readonly selectedIds: ReadonlyArray<string>
  readonly onToggle: (id: string) => void
  readonly onCancel: () => void
  readonly onConfirm: (ids: ReadonlyArray<string>) => void
  readonly title?: string
  readonly confirmLabel?: string
  readonly accessibilityLabel?: string
  readonly testID?: string
}

export function BatchApproveSheet({
  visible,
  items,
  selectedIds,
  onToggle,
  onCancel,
  onConfirm,
  title = 'Approve selected',
  confirmLabel = 'Approve',
  accessibilityLabel,
  testID,
}: BatchApproveSheetProps) {
  const theme = useTheme()
  const styles = useStyles()
  const selectionCount = selectedIds.length
  return (
    <Modal
      visible={visible}
      onRequestClose={onCancel}
      animationType="slide"
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
      <View
        accessibilityLabel={accessibilityLabel ?? `${title}. ${selectionCount} selected.`}
        style={[
          styles.sheet,
          { backgroundColor: theme.palette.deep, borderColor: theme.palette.border },
        ]}
      >
        <View style={styles.header}>
          <Text variant="h2" color={theme.palette.ink}>
            {title}
          </Text>
          <Text variant="bodyS" color={theme.palette.ink2}>
            {selectionCount} of {items.length} selected
          </Text>
        </View>
        <ScrollView style={styles.list}>
          {items.map((item) => {
            const checked = selectedIds.includes(item.id)
            return (
              <View key={item.id} style={styles.row}>
                <Checkbox
                  checked={checked}
                  onChange={() => onToggle(item.id)}
                  label={item.label}
                  testID={testID ? `${testID}-item-${item.id}` : undefined}
                />
                {item.secondary ? (
                  <Text variant="bodyS" color={theme.palette.ink2} style={styles.secondary}>
                    {item.secondary}
                  </Text>
                ) : null}
              </View>
            )
          })}
        </ScrollView>
        <View style={styles.actions}>
          <Button label="Cancel" variant="ghost" onPress={onCancel} fullWidth />
          <Button
            label={`${confirmLabel}${selectionCount > 0 ? ` (${selectionCount})` : ''}`}
            variant="primary"
            onPress={() => onConfirm(selectedIds)}
            disabled={selectionCount === 0}
            fullWidth
          />
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
  sheet: {
    marginTop: 'auto',
    maxHeight: '85%',
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderTopWidth: 1,
    padding: theme.spacing[16],
    gap: theme.spacing[12],
  },
  header: {
    gap: theme.spacing[4],
  },
  list: {
    maxHeight: 360,
  },
  row: {
    paddingVertical: theme.spacing[8],
    gap: theme.spacing[4],
  },
  secondary: {
    paddingLeft: 34,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing[12],
    paddingTop: theme.spacing[8],
  },
}))
