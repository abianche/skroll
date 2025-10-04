import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/__tests__"],
  moduleFileExtensions: ["ts", "js", "json"],
  setupFiles: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@skroll/tree-sitter-skroll$": "<rootDir>/../tree-sitter-skroll/src",
    "^web-tree-sitter/tree-sitter.wasm$": "<rootDir>/jest.web-tree-sitter-wasm.cjs",
    "\\.wasm$": "<rootDir>/jest.tree-sitter-wasm.cjs",
  },
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.test.json" }],
  },
};

export default config;
