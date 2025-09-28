import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/__tests__"],
  moduleFileExtensions: ["ts", "js", "json"],
  moduleNameMapper: {
    "^@skroll/parser-skroll$": "<rootDir>/../parser-skroll/src",
  },
};

export default config;
