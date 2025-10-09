import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@skroll/(.*)$": "<rootDir>/src/shared/$1",
    "^web-tree-sitter/tree-sitter\\.wasm$": "<rootDir>/jest.web-tree-sitter-wasm.cjs",
    "\\.wasm$": "<rootDir>/jest.tree-sitter-wasm.cjs",
  },
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.json" }],
  },
};

export default config;
