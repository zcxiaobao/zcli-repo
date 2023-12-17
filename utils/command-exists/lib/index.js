import path from "node:path";
import fs from "node:fs";
import { sync as commandExitSync } from "command-exists";
import LRU from "lru-cache";
import { execa } from "execa";
import semver from "semver";
let _hasPnpm;
let _hasNpm;
let _hasYarn;
const _yarnProjects = new LRU({
  max: 10,
  maxAge: 1000,
});
const _pnpmProjects = new LRU({
  max: 10,
  maxAge: 1000,
});

// env detection
// const hasYarn = async () => {
//   if (_hasYarn != null) {
//     return _hasYarn;
//   }
//   try {
//     await execa("yarn", ["--version"], { stdio: "inherit" });
//     return (_hasYarn = true);
//   } catch (e) {
//     return (_hasYarn = false);
//   }
// };

// async function getPnpmVersion() {
//   if (_pnpmVersion != null) {
//     return _pnpmVersion;
//   }
//   try {
//     const pnpmExecInfo = await execa("pnpm", ["--version"], {
//       stdio: "pipe",
//     });
//     // there's a critical bug in pnpm 2
//     // https://github.com/pnpm/pnpm/issues/1678#issuecomment-469981972
//     // so we only support pnpm >= 3.0.0
//     _hasPnpm = true;
//     _pnpmVersion = pnpmExecInfo.stdout.trim() || "0.0.0";
//     return { _pnpmVersion, _hasPnpm };
//   } catch (e) {
//     _hasPnpm = false;
//     return { _hasPnpm };
//   }
// }

// const hasPnpmVersionOrLater = (version) => {
//   return semver.gte(getPnpmVersion(), version);
// };

// const hasPnpm3OrLater = () => {
//   return hasPnpmVersionOrLater("3.0.0");
// };

// (async () => {
//   const hasY = await hasPnpm3OrLater();
//   console.info(hasY);
// })();

const hasYarn = () => {
  if (_hasYarn != null) {
    return _hasYarn;
  }
  _hasYarn = commandExitSync("yarn");
};

const checkYarn = (result) => {
  if (result && !_hasYarn()) {
    throw new Error("Yarn is required to run this command");
  }
  return result;
};

const hasPnpm = () => {
  if (_hasPnpm != null) {
    return _hasPnpm;
  }
  _hasPnpm = commandExitSync("pnpm");
};

const checkPnpm = (result) => {
  if (result && !_hasPnpm()) {
    throw new Error("Pnpm is required to run this command");
  }
  return result;
};

const hasNpm = () => {
  if (_hasNpm != null) {
    return _hasNpm;
  }
  _hasNpm = commandExitSync("npm");
};

// class PackageManager {
//   constructor({ context, forcePackageManager }) {
//     this.context = context || process.cwd();
//     if (forcePackageManager) {
//       this.bin = forcePackageManager;
//     } else if (context) {
//       if (hasYarn()) {
//         this.bin = "yarn";
//       } else if (hasPnpmVersionOrLater("3.0.0")) {
//         this.bin = "pnpm";
//       } else {
//         this.bin = "npm";
//       }
//     }
//   }
// }

export const hasProjectYarn = (cwd) => {
  if (_yarnProjects.has(cwd)) {
    return checkYarn(_yarnProjects.get(cwd));
  }
  const lockFile = path.join(cwd, "yarn.lock");
  const result = fs.existsSync(lockFile);
  _yarnProjects.set(cwd, result);
  return checkYarn(result);
};

export const hasProjectPnpm = (cwd) => {
  if (_pnpmProjects.has(cwd)) {
    return checkPnpm(_pnpmProjects.get(cwd));
  }
  const lockFile = path.join(cwd, "pnpm-lock.yaml");
  const result = fs.existsSync(lockFile);
  _pnpmProjects.set(cwd, result);
  return checkPnpm(result);
};
