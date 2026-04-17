export const qk = {
  auth: {
    session: () => ['auth', 'session'] as const,
    role: (userId: string) => ['auth', 'role', userId] as const,
  },
  library: {
    meals: () => ['library', 'meals'] as const,
    exercises: () => ['library', 'exercises'] as const,
    supplements: () => ['library', 'supplements'] as const,
  },
} as const
