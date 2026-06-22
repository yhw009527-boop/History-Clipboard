const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const electronDistDir = path.join(rootDir, "node_modules", "electron", "dist");
const releaseDir = path.join(rootDir, "release");
const packageDir = path.join(releaseDir, "历史剪贴板-win32-x64");
const resourcesAppDir = path.join(packageDir, "resources", "app");
const appFiles = ["dist", "src", "package.json"];

function copyRecursive(source, target) {
  const stat = fs.statSync(source);

  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });

    for (const entry of fs.readdirSync(source)) {
      copyRecursive(path.join(source, entry), path.join(target, entry));
    }

    return;
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function removeIfExists(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

function ensureElectronRuntime() {
  if (!fs.existsSync(path.join(electronDistDir, "electron.exe"))) {
    throw new Error("Electron runtime not found. Run npm install before packaging.");
  }
}

ensureElectronRuntime();
removeIfExists(packageDir);
fs.mkdirSync(releaseDir, { recursive: true });
copyRecursive(electronDistDir, packageDir);

const sourceExe = path.join(packageDir, "electron.exe");
const targetExe = path.join(packageDir, "历史剪贴板.exe");

if (fs.existsSync(targetExe)) {
  fs.rmSync(targetExe, { force: true });
}

fs.renameSync(sourceExe, targetExe);

for (const appFile of appFiles) {
  copyRecursive(path.join(rootDir, appFile), path.join(resourcesAppDir, appFile));
}

console.log(`PACKAGED ${packageDir}`);
