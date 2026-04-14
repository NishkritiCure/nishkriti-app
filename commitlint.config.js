/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'engine',
        'queue',
        'auth',
        'ci',
        'deps',
        'test',
        'design',
        'a11y',
        'data',
        'agents',
        'chore',
        'scaffold',
        'docs',
      ],
    ],
    'scope-empty': [2, 'never'],
  },
}
