# Dependency Audit - October 2025

## Summary

An analysis of npm dependencies was conducted to identify and remove unused packages. The audit used `depcheck` to scan both the root package and the desktop app workspace.

## Findings

### Removed Dependencies

1. **rimraf** (v6.0.1) - Root package.json
   - This package was completely unused
   - Not referenced in any scripts, configuration files, or source code
   - Safely removed without impact

### Dependencies Flagged by depcheck but Correctly Used

The following dependencies were flagged as "unused" by depcheck but are actually required:

#### Root Package

- **@types/node**: Required for Node.js type definitions in TypeScript
- **eslint**: Used for linting via `pnpm lint` and eslint.config.js
- **prettier**: Used for code formatting
- **tree-sitter-cli**: Used in package.json scripts (ts:gen, ts:build-wasm, etc.)
- **typescript**: Used for TypeScript compilation via `tsc` command

#### Desktop App Package

All flagged dependencies are actually used:

- **tw-animate-css**: Imported in `src/renderer/index.css`
- **@electron-forge/cli**: Used in package.json scripts (start, package, make)
- **@tailwindcss/postcss**: Used in postcss.config.js
- **@vercel/webpack-asset-relocator-loader**: Used in webpack.rules.ts
- **autoprefixer**: Used in postcss.config.js
- **cross-env**: Used in root package.json for dev:desktop script
- **css-loader**: Used in webpack.renderer.config.ts
- **jest**: Used for testing via jest.config.ts
- **jest-environment-jsdom**: Used in jest.config.ts (testEnvironment: "jsdom")
- **postcss**: Required by postcss-loader in webpack.renderer.config.ts
- **postcss-loader**: Used in webpack.renderer.config.ts
- **style-loader**: Used in webpack.renderer.config.ts
- **ts-loader**: Used in webpack.rules.ts

### Missing Dependencies (Not Actually Missing)

depcheck flagged **@eslint/js** as missing from root package.json. However, this is a false positive:

- @eslint/js is a direct dependency of eslint@9.37.0
- It's correctly installed as a transitive dependency
- Direct import in eslint.config.js is valid and intentional
- No action needed

## Verification

After removing rimraf:

- ✅ `pnpm lint` - Passed
- ✅ `pnpm typecheck` - Passed
- ✅ `pnpm build` - Passed
- ✅ pnpm-lock.yaml updated correctly

## Tool Used

- **depcheck** v1.4.3 - Static analysis tool for detecting unused dependencies
- Note: depcheck has limitations with:
  - Configuration files (webpack, postcss, etc.)
  - CSS imports
  - Script commands in package.json
  - Transitive dependencies

## Conclusion

The project's dependencies are well-maintained. Only one truly unused dependency (rimraf) was identified and removed. All other dependencies serve a purpose in the build, development, or runtime process.

## Recommendations

1. Consider running dependency audits quarterly
2. When depcheck flags a dependency, manually verify before removing
3. Document critical transitive dependencies that are directly imported
