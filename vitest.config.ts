import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    setupFiles: ['__tests__/setup.ts', '__tests__/setup.rn.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}', '__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.expo', 'dist', '.build-check', '__tests__/e2e/**'],
    // Per-file `// @vitest-environment jsdom` directive opts component tests
    // into jsdom without forcing the whole file tree. Pure-logic suites stay
    // on `node` for speed.
    server: {
      deps: {
        // RN's ESM/CJS interop needs vitest to transform these instead of
        // externalising them so the jsdom-env tests can import them.
        inline: [
          'react-native',
          'react-native-svg',
          'react-native-reanimated',
          'react-native-safe-area-context',
          '@testing-library/react-native',
        ],
      },
    },
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
    alias: [
      // Resolve react-native to react-native-web for unit tests. The actual
      // native build uses react-native proper via babel-preset-expo. This
      // alias only applies to vitest's module graph.
      { find: /^react-native$/, replacement: 'react-native-web' },
      {
        find: 'react-native-safe-area-context',
        replacement: path.resolve(
          __dirname,
          '__tests__/__mocks__/react-native-safe-area-context.tsx'
        ),
      },
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  },
})
