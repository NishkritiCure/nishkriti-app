import { SafeAreaView } from 'react-native-safe-area-context'

import { KitchenSinkScreen } from '@/screens/dev/KitchenSinkScreen'

/**
 * Root navigator placeholder. In dev builds this mounts the
 * KitchenSinkScreen so reviewers can eyeball the Phase-C component
 * library. Production builds receive a minimal holding screen until the
 * real navigator lands in phase-d / phase-e.
 */
export function RootNavigator() {
  if (__DEV__) {
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
