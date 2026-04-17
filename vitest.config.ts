import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    setupFiles: ['__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', '__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.expo', 'dist', '.build-check', '__tests__/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/types/**',
        'src/**/*.d.ts',
        'src/**/__tests__/**',
        'src/entry/**',
        'src/engine/index.ts',
      ],
      thresholds: {
        // Repo-wide baseline — non-engine code lands tests in later phases.
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
        // Engine is the safety-critical floor — 100% is non-negotiable.
        // Excludes the barrel index.ts (re-exports only) above.
        'src/engine/**/*.ts': {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
