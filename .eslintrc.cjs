/** @type {import('eslint').Linter.Config} */
const SUPABASE_JS_BAN = {
  name: '@supabase/supabase-js',
  message:
    'Import the configured client from @/services/supabase. Direct imports outside the service layer are forbidden.',
}

const FETCH_BAN = {
  selector: "CallExpression[callee.name='fetch']",
  message: 'Use @/services/apiClient instead of direct fetch outside src/services/apiClient.ts.',
}

const SERVICE_ROLE_BAN = {
  selector: 'Literal[value=/SUPABASE_SERVICE_ROLE/i]',
  message: 'SUPABASE_SERVICE_ROLE must never appear in the app repo. Backend-only.',
}

// Matches 3-, 4-, 6-, or 8-digit hex colour literals. Components must
// go through useTheme() and palette tokens — see EB-C §4.1 + §7.
const COLOR_LITERAL_BAN = {
  selector: 'Literal[value=/^#[0-9a-fA-F]{3}([0-9a-fA-F]([0-9a-fA-F]{2}([0-9a-fA-F]{2})?)?)?$/]',
  message:
    'Hex colour literals live in src/theme/colors.ts. Use useTheme() and reference palette tokens (theme.palette.*).',
}

const COMPONENT_LAYER_BANS = {
  patterns: [
    {
      group: ['@/engine', '@/engine/*'],
      message:
        'Components are pure views — they receive hydrated shapes via props. Engine types are wire shapes. See EB-C §4.2 "What NOT to do".',
    },
    {
      group: ['@/services', '@/services/*'],
      message: 'Components are pure views — no service-layer imports. Data arrives through props.',
    },
    {
      group: ['@/queries', '@/queries/*'],
      message:
        'Components are pure views — no TanStack Query hooks. Screens own data fetching and pass props.',
    },
    {
      group: ['@/stores', '@/stores/*'],
      message:
        'Components are pure views — no Zustand store reads. Pass state through props from the composing screen.',
    },
  ],
}

module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
    'react-native/react-native': true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: 'detect' },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'react-native', 'import', 'jsx-a11y'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-restricted-imports': ['error', { paths: [SUPABASE_JS_BAN] }],
    'no-restricted-syntax': ['error', FETCH_BAN, SERVICE_ROLE_BAN, COLOR_LITERAL_BAN],
  },
  overrides: [
    {
      files: ['src/services/supabase.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: '@react-native-async-storage/async-storage',
                message: 'Auth tokens must live in expo-secure-store, not AsyncStorage.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['src/services/apiClient.ts'],
      rules: {
        'no-restricted-syntax': ['error', SERVICE_ROLE_BAN, COLOR_LITERAL_BAN],
      },
    },
    {
      files: ['src/stores/useAuthStore.ts'],
      rules: {
        // Override replaces (not merges) the base no-restricted-imports rule,
        // so we re-list the supabase-js ban here for defense-in-depth. The
        // store has no business reaching into the supabase client directly.
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: '@react-native-async-storage/async-storage',
                message: 'Auth state must live in expo-secure-store, not AsyncStorage.',
              },
              SUPABASE_JS_BAN,
            ],
          },
        ],
      },
    },
    {
      // src/theme/** is the canonical home for hex colour literals.
      // Keep the fetch + service-role bans; drop the colour-literal ban.
      files: ['src/theme/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-syntax': ['error', FETCH_BAN, SERVICE_ROLE_BAN],
      },
    },
    {
      // Test files need literal colours for assertions and fixture setup.
      files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
      rules: {
        'no-restricted-syntax': ['error', FETCH_BAN, SERVICE_ROLE_BAN],
      },
    },
    {
      // Components are pure view elements. No engine, service, query, or
      // store imports — data arrives through props. Enforced by EB-C §4.2.
      files: ['src/components/**/*.{ts,tsx}'],
      excludedFiles: ['src/components/**/__tests__/**', 'src/components/**/*.test.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [SUPABASE_JS_BAN],
            patterns: COMPONENT_LAYER_BANS.patterns,
          },
        ],
      },
    },
    {
      files: ['*.config.ts', '*.config.js', '*.config.cjs', 'scripts/**/*'],
      env: { node: true },
      rules: {
        'no-restricted-syntax': 'off',
      },
    },
  ],
  ignorePatterns: ['node_modules/', '.expo/', 'coverage/', '.build-check/', 'dist/', '**/*.d.ts'],
}
