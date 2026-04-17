import { Modal, Pressable, ScrollView, View } from 'react-native'

import { Button, Card, Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export interface MealOption {
  readonly id: string
  readonly name: string
  readonly calories?: number
  readonly subtitle?: string
}

export interface MealSwapPickerProps {
  readonly visible: boolean
  readonly options: ReadonlyArray<MealOption>
  readonly currentId?: string
  readonly onPick: (id: string) => void
  readonly onCancel: () => void
  readonly title?: string
  readonly accessibilityLabel?: string
  readonly testID?: string
}

/**
 * Modal list of swap candidates. Caller is responsible for pre-filtering
 * to compatible meals (slot / diet / allergens). We just render the list.
 */
export function MealSwapPicker({
  visible,
  options,
  currentId,
  onPick,
  onCancel,
  title = 'Swap meal',
  accessibilityLabel,
  testID,
}: MealSwapPickerProps) {
  const theme = useTheme()
  const styles = useStyles()
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
        accessibilityLabel="Cancel swap"
        style={[styles.backdrop, { backgroundColor: theme.palette.modalBackdrop }]}
        onPress={onCancel}
      />
      <View
        accessibilityLabel={accessibilityLabel ?? `${title}. ${options.length} options.`}
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
            {options.length} options
          </Text>
        </View>
        <ScrollView contentContainerStyle={styles.list}>
          {options.map((option) => {
            const isCurrent = option.id === currentId
            return (
              <Card
                key={option.id}
                onPress={() => onPick(option.id)}
                accessibilityLabel={`${option.name}${option.calories ? `, ${option.calories} calories` : ''}${
                  isCurrent ? ', current selection' : ''
                }`}
                accessibilityHint="Double tap to swap to this meal"
                testID={testID ? `${testID}-${option.id}` : undefined}
                surface={isCurrent ? 'card2' : 'card'}
              >
                <View style={styles.row}>
                  <View style={styles.info}>
                    <Text variant="h4" color={theme.palette.ink}>
                      {option.name}
                    </Text>
                    {option.subtitle ? (
                      <Text variant="bodyS" color={theme.palette.ink2}>
                        {option.subtitle}
                      </Text>
                    ) : null}
                  </View>
                  {option.calories !== undefined ? (
                    <Text variant="h2" color={theme.palette.spring}>
                      {option.calories}
                    </Text>
                  ) : null}
                </View>
              </Card>
            )
          })}
        </ScrollView>
        <Button label="Cancel" variant="ghost" onPress={onCancel} fullWidth />
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
    gap: theme.spacing[12],
    paddingBottom: theme.spacing[8],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing[12],
  },
  info: {
    flex: 1,
    gap: theme.spacing[2],
  },
}))
