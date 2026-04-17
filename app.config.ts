import type { ConfigContext, ExpoConfig } from 'expo/config'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.length === 0) {
    throw new Error(
      `Required env var ${name} is not set. See .env.example and documents/specs/ARCHITECTURE.md §7.2.`
    )
  }
  return value
}

function getAppName(): string {
  const profile = process.env.EAS_BUILD_PROFILE ?? 'development'
  if (profile === 'production') return 'Nishkriti'
  if (profile === 'preview') return 'Nishkriti (Preview)'
  return 'Nishkriti (Dev)'
}

function getBundleId(): string {
  const profile = process.env.EAS_BUILD_PROFILE ?? 'development'
  if (profile === 'production') return 'com.nishkriti.app'
  if (profile === 'preview') return 'com.nishkriti.app.preview'
  return 'com.nishkriti.app.dev'
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: 'nishkriti-app',
  scheme: 'nishkriti',
  version: process.env.APP_VERSION ?? '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    bundleIdentifier: getBundleId(),
    supportsTablet: true,
  },
  android: {
    package: getBundleId(),
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  // Note: `expo-font` is intentionally NOT a config plugin here — we load
  // fonts at runtime via @expo-google-fonts/* + useFonts() in src/entry.
  // Adding it as a plugin without a `fonts` array triggers a manifest-time
  // TypeError ("path argument must be of type string").
  plugins: ['expo-secure-store', 'expo-notifications', 'expo-image-picker', 'expo-document-picker'],
  extra: {
    supabaseUrl: requireEnv('EXPO_PUBLIC_SUPABASE_URL'),
    supabaseAnonKey: requireEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
    apiBaseUrl: requireEnv('EXPO_PUBLIC_API_BASE_URL'),
    appVersion: process.env.APP_VERSION ?? '0.1.0',
    // Expo's config schema normalises `null` on object-typed fields
    // (`extra.eas`, `extra.sentryDsn`) into `{}`. When Expo Go on the
    // simulator then tries to `path.resolve()` one of those empties, the
    // manifest load blows up with `"path" argument must be of type string.
    // Received an instance of Object`. Emit `undefined` via conditional
    // spread so the keys drop out of the JSON entirely when env vars are
    // unset.
    ...(process.env.EXPO_PUBLIC_SENTRY_DSN
      ? { sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN }
      : {}),
    ...(process.env.EAS_PROJECT_ID ? { eas: { projectId: process.env.EAS_PROJECT_ID } } : {}),
  },
})
