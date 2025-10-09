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
