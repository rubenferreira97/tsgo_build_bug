# tsgo cache invalidation bug reproduction

This repository demonstrates a bug in `@typescript/native-preview` (`tsgo`) where `--build` fails to invalidate the incremental cache after a dependency update introduces breaking changes.

## Issue Description

When updating dependencies in `package.json` that introduce breaking type changes, `tsgo --build` (incremental mode) fails to detect these changes if a `tsconfig.tsbuildinfo` file already exists. The build reports success despite the presence of type errors.

If the `tsconfig.tsbuildinfo` file is manually deleted, the compiler correctly identifies and reports the type errors.

## Steps to Reproduce

1. Clone this repository.
2. Navigate into the `app` directory: `cd app`
3. Run `npm install` to install `@typescript/native-preview`.
4. Run `npm run reproduce` (which executes the `reproduce.js` script).

### What the script does:
1. Installs version V1 of a local dependency `my-dep` (where `myValue` is a `string`).
2. Builds the project with `tsgo --build`. It succeeds and caches the build.
3. Updates `app/package.json` to point to version V2 of `my-dep` (where `myValue` is now a `number`).
4. Runs `npm install` to update the dependencies.
5. Runs `tsgo --build` again. 
   - **Bug:** The build succeeds without errors, even though `app/index.ts` assigns `myValue` (now a `number`) to a string variable.
6. The script then deletes the `.tsbuildinfo` cache and runs `tsgo --build` once more to demonstrate that the error correctly appears when from a clean slate.

## Manual Reproduction Steps

If you want to reproduce this step-by-step yourself without using the automation script, you can perform the following terminal commands inside the `app/` folder:

1. **Install dependency V1 and create initial cache**
   Make sure `app/package.json` points to `"my-dep": "file:../dependency-v1"`, then execute:
   ```bash
   npm i
   npm run build:tsgo
   ```
   *(This succeeds silently and generates `dist/tsconfig.tsbuildinfo`)*

2. **Introduce the Breaking Change**
   Change `app/package.json` to point to the breaking update: `"my-dep": "file:../dependency-v2"`.
   ```bash
   npm i
   ```

3. **Trigger the Bug (Incremental Build)**
   ```bash
   npm run build:tsgo
   ```
   *(This command wrongfully succeeds without any errors, ignoring the type change in your dependency)*

4. **Prove the Error Exists**
   Delete the cache file:
   ```bash
   rm dist/tsconfig.tsbuildinfo # Or "Remove-Item dist\tsconfig.tsbuildinfo" on Windows
   ```
   Run the build again:
   ```bash
   npm run build:tsgo
   ```
   *(Now it correctly fails, outputting: `error TS2322: Type 'number' is not assignable to type 'string'.`)*
