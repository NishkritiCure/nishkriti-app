import { SafeAreaView } from 'react-native-safe-area-context'

/**
 * Root navigator placeholder.
 *
 * In dev builds this mounts the `KitchenSinkScreen` (dynamic-require'd so
 * Metro's production dead-code elimination drops the entire dev-only
 * module graph — including its fixture strings). Production builds receive
 * a minimal holding shell until the real navigator lands in phase-d /
 * phase-e.
 */
export function RootNavigator() {
  if (__DEV__) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const { KitchenSinkScreen } = require('@/screens/dev/KitchenSinkScreen') as {
      readonly KitchenSinkScreen: React.ComponentType
    }
    return <KitchenSinkScreen />
  }
  return <HoldingScreen />
}

function HoldingScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Production shell lands in phase-d (patient) / phase-e (doctor). */}
    </SafeAreaView>
  )
}
