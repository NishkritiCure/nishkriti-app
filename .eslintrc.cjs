/** @type {import('eslint').Linter.Config} */
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
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@supabase/supabase-js',
            message:
              'Import the configured client from @/services/supabase. Direct imports outside the service layer are forbidden.',
          },
        ],
      },
    ],
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.name='fetch']",
        message:
          'Use @/services/apiClient instead of direct fetch outside src/services/apiClient.ts.',
      },
      {
        selector: 'Literal[value=/SUPABASE_SERVICE_ROLE/i]',
        message: 'SUPABASE_SERVICE_ROLE must never appear in the app repo. Backend-only.',
      },
    ],
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
        'no-restricted-syntax': [
          'error',
          {
            selector: 'Literal[value=/SUPABASE_SERVICE_ROLE/i]',
            message: 'SUPABASE_SERVICE_ROLE must never appear in the app repo. Backend-only.',
          },
        ],
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
              {
                name: '@supabase/supabase-js',
                message:
                  'Import the configured client from @/services/supabase. Direct imports outside the service layer are forbidden.',
              },
            ],
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
