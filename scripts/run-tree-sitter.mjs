import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), "..");
const grammarDir = path.resolve(rootDir, "apps/desktop/src/shared/tree-sitter-skroll");

const [, , command, ...args] = process.argv;

if (!command) {
  console.error("Usage: node scripts/run-tree-sitter.mjs <command> [args...]");
  process.exit(1);
}

const treeSitterBin = path.resolve(rootDir, "node_modules/.bin/tree-sitter");

const result = spawnSync(treeSitterBin, [command, ...args], {
  cwd: grammarDir,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
