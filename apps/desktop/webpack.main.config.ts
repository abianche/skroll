import path from "node:path";
import type { Configuration } from "webpack";

import { plugins } from "./webpack.plugins";
import { rules } from "./webpack.rules";

const alias = {
  "@skroll/ipc-contracts": path.resolve(__dirname, "src", "shared", "ipc-contracts"),
  "@skroll/storage": path.resolve(__dirname, "src", "shared", "storage"),
};

export const mainConfig: Configuration = {
  entry: "./src/main/main.ts",
  target: "electron-main",
  module: {
    rules,
  },
  plugins,
  resolve: {
    alias: {
      ...alias,
      "@skroll/parser-skroll": false,
      "@skroll/tree-sitter-skroll": false,
      "web-tree-sitter": false,
    },
    extensions: [".js", ".ts", ".jsx", ".tsx", ".json"],
  },
  experiments: {
    asyncWebAssembly: true,
  },
};
