import { env } from '@/config/env'

export class NishkritiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'NishkritiError'
  }
}

export class NetworkError extends NishkritiError {
  constructor(cause?: unknown) {
    super('Network unavailable', 'NETWORK', cause)
    this.name = 'NetworkError'
  }
}

export class AuthError extends NishkritiError {
  constructor(reason: string) {
    super(reason, 'AUTH')
    this.name = 'AuthError'
  }
}

export class ValidationError extends NishkritiError {
  constructor(public readonly fields: Record<string, string>) {
    super('Validation failed', 'VALIDATION')
    this.name = 'ValidationError'
  }
}

export class ServerError extends NishkritiError {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message, 'SERVER')
    this.name = 'ServerError'
  }
}

export class RLSError extends NishkritiError {
  constructor() {
    super('Not authorized', 'RLS')
    this.name = 'RLSError'
  }
}

export class EngineError extends NishkritiError {
  constructor(message: string) {
    super(message, 'ENGINE')
    this.name = 'EngineError'
  }
}

const PHI_KEY_PATTERN =
  /fbs|glucose|weight|waist|bp|systolic|diastolic|hba1c|cholesterol|tsh|t3|t4|medication|symptom|message_body|patient_name|dob|phone|uhid|signature|transcript/i

export function scrubForLogging(input: unknown): unknown {
  if (input == null) return input
  if (typeof input === 'string') return input
  if (Array.isArray(input)) return input.map(scrubForLogging)
  if (typeof input === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(input)) {
      if (PHI_KEY_PATTERN.test(key)) {
        out[key] = '[REDACTED]'
      } else {
        out[key] = scrubForLogging(value)
      }
    }
    return out
  }
  return input
}

export interface ErrorContext {
  readonly [key: string]: unknown
}

export function reportError(err: unknown, context?: ErrorContext): void {
  // Only NishkritiError messages are curated and PHI-safe by construction.
  // Raw Postgrest/network/JS errors may embed column values (e.g.
  // "duplicate key (fbs)=(250)"), so we log only the error name + code for
  // those — never their message body. See SECURITY-SPEC.md §3.4.
  const safe = {
    name: err instanceof Error ? err.name : 'unknown',
    message: err instanceof NishkritiError ? err.message : '[redacted non-curated error message]',
    code: err instanceof NishkritiError ? err.code : undefined,
    context: scrubForLogging(context),
  }
  // Sentry wiring deferred until phase-g per APP-CONTEXT.md.
  // For phase-a, fall through to console.error which is allowed by lint.
  if (env.sentryDsn) {
    console.error('[nishkriti]', safe)
  } else {
    console.error('[nishkriti]', safe)
  }
}
