import fsExtra, { pathExists } from "fs-extra";
import NpmRepoDetail from "@zctools/npm-repo-detail";
import npminstall from "npminstall";
import path from "node:path";
import { packageDirectory } from "pkg-dir";
class Package {
  constructor(options) {
    if (!options) {
      throw new Error("Package 类的 options 不能为空");
    }
    // package 的目标路径
    this.targetPath = options.targetPath;
    // package 的存储路径
    this.storeDir = options.storeDir;
    this.packageName = options.packageName;
    this.packageVersion = options.packageVersion;
    // package的缓存目录前缀
    this.cacheFilePathPrefix = this.packageName.replace("/", "_");
    this.npmRepoDetail = new NpmRepoDetail({ npmName: this.packageName });
  }

  get cacheFilePath() {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`
    );
  }

  async prepare() {
    // 检查缓存目录是否存在
    if (this.storeDir && !pathExists(this.storeDir)) {
      fsExtra.mkdirSync(this.storeDir);
    }

    // 获取最新版本
    if (this.packageVersion === "latest") {
      this.packageVersion = await this.npmRepoDetail.getLatestVersion();
    }
  }
  async exists() {
    if (this.storeDir) {
      await this.prepare();
      return pathExists(this.cacheFilePath);
    } else {
      return pathExists(this.targetPath);
    }
  }
  async install() {
    await this.prepare();
    return npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: this.npmRepoDetail.registry,
      pkgs: [
        {
          name: this.packageName,
          version: this.packageVersion,
        },
      ],
    });
  }
  async update() {
    await this.prepare();
    const latestVersion = await this.npmRepoDetail.getLatestVersion();
    const latestFilePath = this.getSpecificCacheFilePath(latestVersion);
    if (!pathExists(latestFilePath)) {
      await npminstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: this.npmRepoDetail.registry,
        pkgs: [
          {
            name: this.packageName,
            version: latestVersion,
          },
        ],
      });
      this.packageVersion = latestVersion;
    } else {
      this.packageVersion = latestVersion;
    }
  }
  getRootFilePath() {
    async function _getRootFile(targetPath) {
      const dir = await packageDirectory(targetPath);
      if (dir) {
        const pkgFile = path.resolve(dir, "package.json");
        if (pkgFile && pkgFile.main) {
          return path.resolve(dir, pkgFile.main);
        }
      }
    }

    if (this.storeDir) {
      return _getRootFile(this.cacheFilePath);
    } else {
      return _getRootFile(this.targetPath);
    }
  }

  getSpecificCacheFilePath(packageVersion) {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`
    );
  }
}

export default Package;
