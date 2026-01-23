# npm to pnpm Migration Summary

## Changes Made

### 1. Workspace Configuration
- Created `pnpm-workspace.yaml` to define workspace packages
- Updated `package.json` scripts to use pnpm workspace commands:
  - `npm run --ws` → `pnpm run -r` (recursive)
  - `npm run -w <workspace>` → `pnpm run --filter <workspace>`

### 2. Dependencies
Added explicit workspace dependencies that were previously resolved through npm's hoisting:
- **route**: Added `@falling-nikochan/chart`, `@falling-nikochan/i18n`, `valibot`
- **worker**: Added `@falling-nikochan/i18n`, `@falling-nikochan/route`, `hono`, `dotenv`
- **frontend**: Added `@falling-nikochan/chart`, `@falling-nikochan/i18n`, `@falling-nikochan/route`, `next-intl`, `valibot`, `wasmoon`
- **chart**: Added self-reference `@falling-nikochan/chart` as devDependency for tests

### 3. Path Fixes
- **frontend/initAssets.js**: Changed paths from `../node_modules` to `./node_modules` (pnpm uses workspace-local node_modules)
- **i18n/verifyKeys.js**: Excluded `node_modules` directory from locale detection

### 4. TypeScript Fixes
Fixed TypeScript 5.8+ Uint8Array compatibility issues:
- **frontend/app/[locale]/edit/chartState.ts**: Wrapped `msgpack.serialize()` with `new Uint8Array()`
- **route/src/api/chartFile.ts**: Same fix for Blob creation
- **route/src/api/playFile.ts**: Same fix for Blob creation

### 5. ESLint Configuration
- **eslint.config.ts**: Fixed flat config compatibility (removed invalid `extends` property)

### 6. .gitignore
- Added `pnpm-lock.yaml`
- Added `*/node_modules/` to exclude workspace node_modules

### 7. Removed Files
- Deleted `package-lock.json` (replaced by `pnpm-lock.yaml`)

## Command Equivalents

| npm command | pnpm command |
|------------|--------------|
| `npm install` | `pnpm install` |
| `npm run lint` | `pnpm run lint` |
| `npm run test` | `pnpm run test` |
| `npm run nbuild` | `pnpm run nbuild` |
| `npm run swbuild` | `pnpm run swbuild` |
| `npm run dev` | `pnpm run dev` |

## Verification Results

✅ **pnpm run lint**: Passes (60 warnings, same as npm)
✅ **pnpm run nbuild**: Passes (requires `ALLOW_FETCH_ERROR=1` environment variable)
✅ **pnpm run swbuild**: Passes
⚠️ **pnpm run test**: Partially passes - chart tests pass, route tests require Node.js 23.6+ (environment constraint)

## Key Differences from npm

1. **Strict dependency resolution**: pnpm doesn't hoist dependencies to the root. Each workspace only has access to its declared dependencies.
2. **Symlinked node_modules**: pnpm uses symlinks to a central content-addressable store, saving disk space.
3. **Explicit workspace dependencies**: Workspace packages must be explicitly listed in dependencies.

## Migration Notes

- All required commands (`lint`, `nbuild`, `swbuild`) work correctly with pnpm
- The test command for `route` workspace requires Node.js 23.6+ (as specified in package.json), which is an environment constraint, not a pnpm-specific issue
- The `nbuild` command requires the `ALLOW_FETCH_ERROR=1` environment variable, which was already required in the CI workflow
