import path from "node:path";
import type { Configuration } from "webpack";

import { plugins } from "./webpack.plugins";
import { rules } from "./webpack.rules";

const alias = {
  "@skroll/ipc-contracts": path.resolve(__dirname, "..", "..", "packages", "ipc-contracts", "src"),
  "@skroll/story-engine": path.resolve(__dirname, "..", "..", "packages", "story-engine", "src"),
  "@skroll/storage": path.resolve(__dirname, "..", "..", "packages", "storage", "src"),
};

export const preloadConfig: Configuration = {
  entry: {
    preload: "./src/preload/preload.ts",
  },
  target: "electron-preload",
  module: {
    rules,
  },
  plugins,
  resolve: {
    alias,
    extensions: [".js", ".ts", ".jsx", ".tsx", ".json"],
  },
};
