import { execa } from "execa";
import semver from "semver";
let _hasPnpm;
let _pnpmVersion;
let _hasNpm;
let _hasYarn;

// env detection
const hasYarn = async () => {
  if (_hasYarn != null) {
    return _hasYarn;
  }
  try {
    await execa("yarn", ["--version"], { stdio: "inherit" });
    return (_hasYarn = true);
  } catch (e) {
    return (_hasYarn = false);
  }
};

async function getPnpmVersion() {
  if (_pnpmVersion != null) {
    return _pnpmVersion;
  }
  try {
    const pnpmExecInfo = await execa("pnpm", ["--version"], {
      stdio: "pipe",
    });
    // there's a critical bug in pnpm 2
    // https://github.com/pnpm/pnpm/issues/1678#issuecomment-469981972
    // so we only support pnpm >= 3.0.0
    _hasPnpm = true;
    _pnpmVersion = pnpmExecInfo.stdout.trim() || "0.0.0";
    return { _pnpmVersion, _hasPnpm };
  } catch (e) {
    _hasPnpm = false;
    return { _hasPnpm };
  }
}

const hasPnpmVersionOrLater = (version) => {
  return semver.gte(getPnpmVersion(), version);
};

const hasPnpm3OrLater = () => {
  return hasPnpmVersionOrLater("3.0.0");
};

(async () => {
  const hasY = await hasPnpm3OrLater();
  console.info(hasY);
})();

class PackageManager {
  constructor({ context, forcePackageManager }) {
    this.context = context || process.cwd();
    if (forcePackageManager) {
      this.bin = forcePackageManager;
    } else if (context) {
      if (hasYarn()) {
        this.bin = "yarn";
      } else if (hasPnpmVersionOrLater("3.0.0")) {
        this.bin = "pnpm";
      } else {
        this.bin = "npm";
      }
    }
  }
}

export default PackageManager;
