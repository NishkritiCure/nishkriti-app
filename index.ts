import { registerRootComponent } from 'expo'

import App from './src/entry'

// Registers the root component per Expo's canonical non-router entry pattern.
// Keeping this at repo root (rather than inside src/entry/index.tsx) prevents
// Expo SDK 54 from treating src/app/ or src/entry/ as an Expo Router scan root.
registerRootComponent(App)
