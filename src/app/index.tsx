import { registerRootComponent } from 'expo'

import { AppProviders } from './providers'
import { RootNavigator } from './RootNavigator'

function App() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  )
}

registerRootComponent(App)

export default App
