const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const appDir = __dirname;
const targetPath = path.join(appDir, 'package.json');

const basePackageJson = {
  name: "app",
  version: "1.0.0",
  scripts: {
    "reproduce": "node reproduce.js",
    "build:tsgo": "tsgo --build tsconfig.json"
  },
  devDependencies: {
    "@typescript/native-preview": "latest"
  }
};

const v1 = {
  ...basePackageJson,
  dependencies: {
    "my-dep": "file:../dependency-v1"
  }
};

const v2 = {
  ...basePackageJson,
  dependencies: {
    "my-dep": "file:../dependency-v2"
  }
};

function runCmd(cmd, cwd) {
  try {
    execSync(cmd, { cwd, stdio: 'inherit' });
    return 0;
  } catch (err) {
    return err.status !== undefined ? err.status : 1;
  }
}

console.log("--- Cleaning up previous runs ---");
const nodeModulesPath = path.join(appDir, 'node_modules');
const distPath = path.join(appDir, 'dist');

if (fs.existsSync(nodeModulesPath)) {
  fs.rmSync(nodeModulesPath, { recursive: true, force: true });
}
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
}

console.log("\n--- Step 1: Install dependency V1 (my-dep with string type) ---");
fs.writeFileSync(targetPath, JSON.stringify(v1, null, 2), 'utf8');
runCmd('npm install --silent', appDir);

console.log("\n--- Step 2: Build App with V1 ---");
let rc = runCmd('npm run build:tsgo --silent', appDir);
console.log(`Build finished with exit code: ${rc} (Expected: 0)`);

console.log("\n--- Step 3: Update dependency to V2 (Breaking Type Change to number) ---");
fs.writeFileSync(targetPath, JSON.stringify(v2, null, 2), 'utf8');
runCmd('npm install --silent', appDir);

console.log("\n--- Step 4: Build App with V2 (Incremental) ---");
console.log("Expected: Build should fail because string != number.");
console.log("Actual: Build succeeds silently because cache is not invalidated.");
rc = runCmd('npm run build:tsgo --silent', appDir);
console.log(`Build finished with exit code: ${rc} (Expected: non-zero, Actual: 0 due to bug)`);

console.log("\n--- Step 5: Delete cache and rebuild to prove error exists ---");
const cacheFile = path.join(appDir, 'dist', 'tsconfig.tsbuildinfo');
if (fs.existsSync(cacheFile)) {
  fs.rmSync(cacheFile, { force: true });
}
rc = runCmd('npm run build:tsgo --silent', appDir);
console.log(`Build finished with exit code: ${rc} (Expected: non-zero)`);
