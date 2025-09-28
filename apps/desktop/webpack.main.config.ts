import path from "node:path";
import type { Configuration } from "webpack";

import { plugins } from "./webpack.plugins";
import { rules } from "./webpack.rules";

const alias = {
  "@skroll/ipc-contracts": path.resolve(__dirname, "..", "..", "packages", "ipc-contracts", "src"),
  "@skroll/storage": path.resolve(__dirname, "..", "..", "packages", "storage", "src"),
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
};
