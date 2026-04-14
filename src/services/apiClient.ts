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

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  signal?: AbortSignal
  // Override idempotency detection. Defaults: GET/PUT/DELETE are idempotent.
  // POST/PATCH are not (per ARCHITECTURE §6.3 — non-idempotent writes get
  // 1 attempt, the user retries manually).
  idempotent?: boolean
}

const DEFAULT_IDEMPOTENT: ReadonlySet<HttpMethod> = new Set(['GET', 'PUT', 'DELETE'])

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const method = opts.method ?? 'GET'
  const isIdempotent = opts.idempotent ?? DEFAULT_IDEMPOTENT.has(method)
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
    { attempts: isIdempotent ? 3 : 1 }
  )
}
