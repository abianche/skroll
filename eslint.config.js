import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-config-prettier";
import jest from "eslint-plugin-jest";

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
      // Add more rules as needed
    },
    settings: {
      react: { version: "detect" },
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
    files: ["packages/storage/src/**/*.ts"],
    languageOptions: {
      globals: {
        process: "readonly",
        NodeJS: "readonly",
        // add more Node.js globals if needed
      },
    },
  },
  prettier,
];
