import path from "node:path";
import type { Configuration } from "webpack";

import { plugins } from "./webpack.plugins";
import { rules } from "./webpack.rules";

const alias = {
  "@skroll/ipc-contracts": path.resolve(__dirname, "src", "shared", "ipc-contracts"),
  "@skroll/storage": path.resolve(__dirname, "src", "shared", "storage"),
};

export const preloadConfig: Configuration = {
  entry: {
    // ⬅️ sanity check this path (see note below)
    preload: "./src/preload/preload.ts",
  },
  target: "electron-preload",
  module: {
    rules: [
      ...rules,
      { test: /\.wasm$/, type: "asset/resource" }, // ⬅️ add this
    ],
  },
  plugins,
  resolve: {
    alias,
    extensions: [".js", ".ts", ".jsx", ".tsx", ".json"],
    // Prefer the browser ESM entry so we don't get the CJS that requires fs/path
    mainFields: ["browser", "module", "main"],
    // Also bias resolution toward import/browser conditions
    conditionNames: ["browser", "import", "module", "default"],
    // No Node polyfills in preload/renderer
    fallback: {
      fs: false,
      path: false,
    },
  },
  experiments: {
    asyncWebAssembly: true,
  },
};
