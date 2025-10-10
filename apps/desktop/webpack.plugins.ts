import path from "node:path";

import CopyWebpackPlugin from "copy-webpack-plugin";
import type IForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

const treeSitterWasmAssets = [
  {
    from: path.resolve(
      __dirname,
      "src",
      "shared",
      "tree-sitter-skroll",
      "tree-sitter-skroll.wasm",
    ),
    to: path.join("tree-sitter", "[name][ext]"),
    noErrorOnMissing: true,
  },
  {
    from: path.resolve(__dirname, "../../node_modules/web-tree-sitter/tree-sitter.wasm"),
    to: path.join("tree-sitter", "[name][ext]"),
  },
];

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: "webpack-infrastructure",
  }),
  new CopyWebpackPlugin({
    patterns: treeSitterWasmAssets,
  }),
];
