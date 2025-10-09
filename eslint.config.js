import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-config-prettier";
import jest from "eslint-plugin-jest";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      import: importPlugin,
      react,
      "react-hooks": reactHooks,
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
    settings: {
      react: { version: "detect" },
    },
  },
  {
    files: ["apps/desktop/src/shared/parser-skroll/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
        NodeJS: "readonly",
      },
    },
  },
  {
    plugins: { jest },
    rules: {
      ...jest.configs.recommended.rules,
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.js", "**/__tests__/**/*.ts", "**/__tests__/**/*.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        jest: "readonly",
      },
    },
  },
  {
    files: ["apps/desktop/src/main/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
        NodeJS: "readonly",
      },
    },
  },
  {
    files: ["apps/desktop/src/renderer/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ["apps/desktop/src/shared/storage/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
        NodeJS: "readonly",
      },
    },
  },
  {
    files: ["apps/desktop/src/shared/tree-sitter-skroll/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
        NodeJS: "readonly",
      },
    },
  },
  prettier,
];
