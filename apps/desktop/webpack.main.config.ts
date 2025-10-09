import path from "node:path";
import type { Configuration } from "webpack";

import { plugins } from "./webpack.plugins";
import { rules } from "./webpack.rules";

const alias = {
  "@skroll/ipc-contracts": path.resolve(__dirname, "src", "shared", "ipc-contracts"),
  "@skroll/storage": path.resolve(__dirname, "src", "shared", "storage"),
  "@skroll/engine-skroll": path.resolve(__dirname, "src", "shared", "engine-skroll"),
  "@skroll/parser-skroll": path.resolve(__dirname, "src", "shared", "parser-skroll"),
  "@skroll/tree-sitter-skroll": path.resolve(__dirname, "src", "shared", "tree-sitter-skroll"),
};

export const mainConfig: Configuration = {
  entry: "./src/main/main.ts",
  target: "electron-main",
  module: {
    rules,
  },
  plugins,
  resolve: {
    alias,
    extensions: [".js", ".ts", ".jsx", ".tsx", ".json"],
  },
  experiments: {
    asyncWebAssembly: true,
  },
};
