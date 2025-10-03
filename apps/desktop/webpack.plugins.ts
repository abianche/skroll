import path from "node:path";
import type IForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

const wasmSource = path.resolve(
  __dirname,
  "..",
  "..",
  "packages",
  "tree-sitter-skroll",
  "tree-sitter-skroll.wasm"
);

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: "webpack-infrastructure",
  }),
];
