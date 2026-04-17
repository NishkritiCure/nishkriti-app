import { View } from 'react-native'

import { Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export interface SectionCapProps {
  readonly label: string
  readonly accessibilityLabel?: string
  readonly testID?: string
}

export function SectionCap({ label, accessibilityLabel, testID }: SectionCapProps) {
  const theme = useTheme()
  const styles = useStyles()
  return (
    <View
      accessibilityRole="header"
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
      style={styles.row}
    >
      <View style={[styles.rule, { backgroundColor: theme.palette.border2 }]} />
      <Text variant="labelM" uppercase color={theme.palette.ink3} style={styles.label}>
        {label}
      </Text>
      <View style={[styles.rule, { backgroundColor: theme.palette.border2 }]} />
    </View>
  )
}

const useStyles = createStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[12],
    paddingVertical: theme.spacing[8],
  },
  rule: {
    flex: 1,
    height: 1,
  },
  label: {
    letterSpacing: 3,
  },
}))
