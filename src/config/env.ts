import Constants from 'expo-constants'

export interface Env {
  readonly supabaseUrl: string
  readonly supabaseAnonKey: string
  readonly apiBaseUrl: string
  readonly sentryDsn: string | null
  readonly appVersion: string
  readonly appName: string
}

function requireString(value: unknown, key: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required env value: ${key}`)
  }
  return value
}

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>

export const env: Env = {
  supabaseUrl: requireString(extra.supabaseUrl, 'supabaseUrl'),
  supabaseAnonKey: requireString(extra.supabaseAnonKey, 'supabaseAnonKey'),
  apiBaseUrl: requireString(extra.apiBaseUrl, 'apiBaseUrl'),
  sentryDsn: typeof extra.sentryDsn === 'string' ? extra.sentryDsn : null,
  appVersion: typeof extra.appVersion === 'string' ? extra.appVersion : '0.1.0',
  appName: 'Nishkriti',
}
