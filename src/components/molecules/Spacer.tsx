import { View } from 'react-native'

export interface SpacerProps {
  readonly size?: number
  readonly horizontal?: boolean
  readonly flex?: number
  readonly testID?: string
}

export function Spacer({ size, horizontal = false, flex, testID }: SpacerProps) {
  return (
    <View
      testID={testID}
      aria-hidden
      style={
        flex !== undefined ? { flex } : horizontal ? { width: size ?? 8 } : { height: size ?? 8 }
      }
    />
  )
}
