import { View } from 'react-native'

import { createStyles } from '@/theme'

export interface DividerProps {
  readonly orientation?: 'horizontal' | 'vertical'
  readonly inset?: number
  readonly testID?: string
}

export function Divider({ orientation = 'horizontal', inset = 0, testID }: DividerProps) {
  const styles = useStyles()
  return (
    <View
      testID={testID}
      accessibilityRole="none"
      aria-hidden
      style={[
        orientation === 'horizontal'
          ? { height: 1, marginVertical: inset }
          : { width: 1, marginHorizontal: inset },
        styles.base,
      ]}
    />
  )
}

const useStyles = createStyles((theme) => ({
  base: {
    backgroundColor: theme.palette.border,
    alignSelf: 'stretch',
  },
}))
