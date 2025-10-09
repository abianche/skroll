import type { Module } from "module";

type WritableModule = Module & { exports: unknown };

(require.extensions as NodeJS.RequireExtensions)[".wasm"] = (
  module: WritableModule,
  filename: string,
) => {
  module.exports = filename;
};
