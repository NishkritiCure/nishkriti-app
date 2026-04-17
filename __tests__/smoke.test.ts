import { describe, expect, it } from 'vitest'

import { supabase } from '@/services/supabase'

describe('smoke', () => {
  it('Supabase client is importable', () => {
    expect(supabase).toBeDefined()
    expect(typeof supabase.from).toBe('function')
  })

  it('app name is Nishkriti', async () => {
    const { env } = await import('@/config/env')
    expect(env.appName ?? 'Nishkriti').toBe('Nishkriti')
  })
})
