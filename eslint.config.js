// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import eslintConfigPrettier from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Global ignore patterns (migrated from .eslintignore)
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      'target/',
      'src-tauri/',
      'public/',
      'crates/',
      'vite.config.ts',
    ],
  },
  // Base JS rules
  js.configs.recommended,

  // TypeScript (no type-aware rules for speed and simplicity)
  ...tseslint.configs.recommended,

  // React + React Hooks rules
  {
    files: ['**/*.{jsx,tsx,ts,js}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // React 17+ JSX transform
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',

      // Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Disable rules that conflict with Prettier
  eslintConfigPrettier,
];
