import { AppProviders } from './providers'
import { RootNavigator } from './RootNavigator'

export default function App() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  )
}
