// SPDX-License-Identifier: Apache-2.0
// ESLint flat config from ostrom-core docs/conventions/eslint.config.js (CONVENTIONS.md section 13.2), plus Next.js
// and jsx-a11y. ESLint stays on 9.x: eslint-plugin-jsx-a11y 6.10 does not accept ESLint 10 yet.
import js from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'out/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      '.lighthouseci/**',
      'lighthouse-reports/**',
      // Owned by the DOCS agent: page code blocks are tested byte for byte, docs-tools has its own CI.
      'content/docs/**',
      'docs-tools/**',
      '**/*.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  reactHooks.configs.flat.recommended,
  jsxA11y.flatConfigs.strict,
  {
    plugins: { '@next/next': nextPlugin },
    rules: { ...nextPlugin.configs.recommended.rules, ...nextPlugin.configs['core-web-vitals'].rules },
  },
  {
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    // No eslint-disable comment can silence a rule. An exception goes here, with its reason.
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'error',
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': true, 'ts-expect-error': true, 'ts-nocheck': true, 'ts-check': false },
      ],
      // Only `as const`: data from outside is parsed with Zod, never asserted.
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      eqeqeq: ['error', 'always'],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', 'e2e/**', 'scripts/**'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // Node entry points print their report on stdout: that is their interface.
    files: ['scripts/*.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    // Plain JavaScript config files: no types to check (keep the parser options that turn the project service off).
    files: ['*.config.js', '*.config.mjs', 'lighthouserc.cjs'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: { ...tseslint.configs.disableTypeChecked.languageOptions, globals: { ...globals.node } },
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      // JavaScript has no return type to write.
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  {
    // Lighthouse CI reads its configuration as CommonJS.
    files: ['lighthouserc.cjs'],
    languageOptions: { sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
)
