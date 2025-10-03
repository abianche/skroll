import path from "node:path";
import type { Configuration } from "webpack";

import { plugins } from "./webpack.plugins";
import { rules } from "./webpack.rules";

const alias = {
  "@skroll/ipc-contracts": path.resolve(__dirname, "..", "..", "packages", "ipc-contracts", "src"),
  "@skroll/storage": path.resolve(__dirname, "..", "..", "packages", "storage", "src"),
};

export const rendererConfig: Configuration = {
  target: process.env.NODE_ENV === "development" ? "web" : "electron-renderer",
  devtool: "cheap-module-source-map",
  entry: {
    renderer: "./src/renderer/index.tsx",
  },
  output: {
    publicPath: "",
  },
  module: {
    rules: [
      ...rules,
      {
        test: /\.css$/,
        use: [{ loader: "style-loader" }, { loader: "css-loader" }],
      },
      { test: /\.wasm$/, type: "asset/resource" },
    ],
  },
  plugins,
  resolve: {
    alias: {
      ...alias,
    },
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"],
    mainFields: ["browser", "module", "main"],
    fallback: {
      fs: false,
      path: false,
    },
  },
  experiments: {
    asyncWebAssembly: true,
  },
};
