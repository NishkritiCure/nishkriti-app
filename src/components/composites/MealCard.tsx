import { useState } from 'react'
import { Pressable, View } from 'react-native'

import { Card, Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export type MealSlot = 'breakfast' | 'mid-morning' | 'lunch' | 'snack' | 'dinner' | 'evening'

export interface MealMacros {
  readonly calories: number
  readonly carbs?: number
  readonly protein?: number
  readonly fat?: number
  readonly fiber?: number
}

export interface MealIngredient {
  readonly name: string
  readonly quantity: string
}

export interface MealItem {
  readonly id: string
  readonly name: string
  readonly macros: MealMacros
  readonly ingredients?: ReadonlyArray<MealIngredient>
  readonly prepNote?: string
}

export interface MealCardProps {
  readonly slot: MealSlot
  readonly item: MealItem
  readonly isActive?: boolean
  readonly adjustment?: string
  readonly expanded?: boolean
  readonly defaultExpanded?: boolean
  readonly onToggleExpand?: () => void
  readonly accessibilityLabel?: string
  readonly testID?: string
}

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  'mid-morning': 'Mid-morning',
  lunch: 'Lunch',
  snack: 'Snack',
  dinner: 'Dinner',
  evening: 'Evening',
}

export function MealCard({
  slot,
  item,
  isActive = false,
  adjustment,
  expanded,
  defaultExpanded = false,
  onToggleExpand,
  accessibilityLabel,
  testID,
}: MealCardProps) {
  const theme = useTheme()
  const styles = useStyles()
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
  const isExpanded = expanded ?? internalExpanded
  const handleToggle = () => {
    if (onToggleExpand) {
      onToggleExpand()
    } else {
      setInternalExpanded((v) => !v)
    }
  }
  const m = item.macros
  const macrosLabel = `${m.calories} calories${m.carbs !== undefined ? `, ${m.carbs}g carbs` : ''}${
    m.protein !== undefined ? `, ${m.protein}g protein` : ''
  }${m.fat !== undefined ? `, ${m.fat}g fat` : ''}`

  return (
    <Card
      surface={isActive ? 'card2' : 'card'}
      testID={testID}
      accessibilityLabel={
        accessibilityLabel ?? `${SLOT_LABEL[slot]}: ${item.name}. ${macrosLabel}.`
      }
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Toggle ${item.name} details`}
        accessibilityState={{ expanded: isExpanded }}
        onPress={handleToggle}
        hitSlop={6}
        style={styles.header}
        testID={testID ? `${testID}-toggle` : undefined}
      >
        <View style={styles.headerInfo}>
          <Text variant="labelM" color={theme.palette.ink3} uppercase>
            {SLOT_LABEL[slot]}
          </Text>
          <Text variant="h3" color={theme.palette.ink}>
            {item.name}
          </Text>
        </View>
        <Text variant="h2" color={theme.palette.spring}>
          {isExpanded ? '−' : '+'}
        </Text>
      </Pressable>

      <View style={styles.macrosRow}>
        <MacroChip label="kcal" value={m.calories} color={theme.palette.ink} />
        {m.carbs !== undefined ? (
          <MacroChip label="C" value={`${m.carbs}g`} color={theme.palette.amber} />
        ) : null}
        {m.protein !== undefined ? (
          <MacroChip label="P" value={`${m.protein}g`} color={theme.palette.teal} />
        ) : null}
        {m.fat !== undefined ? (
          <MacroChip label="F" value={`${m.fat}g`} color={theme.palette.blue} />
        ) : null}
      </View>

      {isExpanded ? (
        <View style={styles.detail}>
          {item.ingredients?.length ? (
            <View style={styles.section}>
              <Text variant="labelM" color={theme.palette.ink3} uppercase>
                Ingredients
              </Text>
              {item.ingredients.map((ing) => (
                <Text key={ing.name} variant="bodyS" color={theme.palette.ink}>
                  {ing.name} — {ing.quantity}
                </Text>
              ))}
            </View>
          ) : null}
          {item.prepNote ? (
            <View style={styles.section}>
              <Text variant="labelM" color={theme.palette.ink3} uppercase>
                Prep
              </Text>
              <Text variant="bodyS" color={theme.palette.ink}>
                {item.prepNote}
              </Text>
            </View>
          ) : null}
          {adjustment ? (
            <View style={styles.section}>
              <Text variant="labelM" color={theme.palette.amber} uppercase>
                Adjustment
              </Text>
              <Text variant="bodyS" color={theme.palette.ink}>
                {adjustment}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  )
}

function MacroChip({
  label,
  value,
  color,
}: {
  readonly label: string
  readonly value: string | number
  readonly color: string
}) {
  const theme = useTheme()
  return (
    <View style={{ alignItems: 'center' }}>
      <Text variant="labelS" color={theme.palette.ink3} uppercase>
        {label}
      </Text>
      <Text variant="h4" color={color}>
        {value}
      </Text>
    </View>
  )
}

const useStyles = createStyles((theme) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[12],
    minHeight: 44,
  },
  headerInfo: {
    flex: 1,
    gap: theme.spacing[2],
  },
  macrosRow: {
    flexDirection: 'row',
    gap: theme.spacing[20],
    paddingVertical: theme.spacing[12],
  },
  detail: {
    gap: theme.spacing[12],
    paddingTop: theme.spacing[8],
  },
  section: {
    gap: theme.spacing[4],
  },
}))
