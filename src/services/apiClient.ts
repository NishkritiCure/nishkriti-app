import { env } from '@/config/env'
import { withRetry } from '@/utils/retry'

import { AuthError, ServerError } from './errorService'
import { supabase } from './supabase'

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const session = data.session
  if (!session) throw new AuthError('No active session')
  return { Authorization: `Bearer ${session.access_token}` }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const method = opts.method ?? 'GET'
  return withRetry(
    async () => {
      const auth = await authHeader()
      const init: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...auth,
        },
      }
      if (opts.body !== undefined) init.body = JSON.stringify(opts.body)
      if (opts.signal) init.signal = opts.signal
      const res = await fetch(`${env.apiBaseUrl}${path}`, init)
      if (res.status === 401) throw new AuthError('Unauthorized')
      if (res.status >= 500) throw new ServerError('Server error', res.status)
      if (!res.ok) throw new ServerError(`Request failed: ${res.status}`, res.status)
      return (await res.json()) as T
    },
    { attempts: method === 'GET' ? 3 : 1 }
  )
}
