import { View } from 'react-native'

import { Card, Checkbox, Text } from '@/components/primitives'
import { createStyles, useTheme } from '@/theme'

export interface SupplementRowProps {
  readonly name: string
  readonly dose?: string
  readonly time: string
  readonly taken: boolean
  readonly onToggle: () => void
  readonly accessibilityLabel?: string
  readonly testID?: string
}

/**
 * One-line supplement card. Icon-free by design — the library layer passes
 * any icon element into a trailing slot if needed later. Pure view shell:
 * `onToggle` fires on checkbox press; no optimistic state inside.
 */
export function SupplementRow({
  name,
  dose,
  time,
  taken,
  onToggle,
  accessibilityLabel,
  testID,
}: SupplementRowProps) {
  const theme = useTheme()
  const styles = useStyles()
  const composedLabel =
    accessibilityLabel ??
    `${name}${dose ? `, ${dose}` : ''}, scheduled ${time}. ${taken ? 'Taken.' : 'Not taken.'}`

  return (
    <Card surface="card" testID={testID} accessibilityLabel={composedLabel}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text variant="h4" color={theme.palette.ink}>
            {name}
          </Text>
          <Text variant="bodyS" color={theme.palette.ink2}>
            {dose ? `${dose} · ${time}` : time}
          </Text>
        </View>
        <Checkbox
          checked={taken}
          onChange={onToggle}
          accessibilityLabel={`Mark ${name} ${taken ? 'not taken' : 'taken'}`}
          testID={testID ? `${testID}-checkbox` : undefined}
        />
      </View>
    </Card>
  )
}

const useStyles = createStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[12],
  },
  info: {
    flex: 1,
    gap: theme.spacing[2],
  },
}))
