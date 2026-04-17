interface RetryOptions {
  attempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const attempts = opts.attempts ?? 3
  const baseDelay = opts.baseDelayMs ?? 500
  const maxDelay = opts.maxDelayMs ?? 4_000
  let lastErr: unknown

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (i === attempts - 1) break
      const delay = Math.min(baseDelay * 2 ** i, maxDelay)
      const jitter = delay * (0.8 + Math.random() * 0.4)
      await new Promise((resolve) => setTimeout(resolve, jitter))
    }
  }
  throw lastErr
}
