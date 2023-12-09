import fsExtra from "fs-extra";
import { pathExistsSync } from "fs-extra/esm";
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
    // node_modules/.store/<name>@<version>/node_modules/<name></name>
    // `.store/${pkg.name.replace('/', '+')}@${pkg.version}/node_modules/${pkg.name}`
    this.cacheFilePathPrefix = this.packageName.replace("/", "+");
    this.npmRepoDetail = new NpmRepoDetail({ npmName: this.packageName });
  }

  get cacheFilePath() {
    // return path.resolve(
    //   this.storeDir,
    //   `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`
    // );
    return path.resolve(
      this.storeDir,
      `.store/${this.packageName.replace("/", "+")}@${
        this.packageVersion
      }/node_modules/${this.packageName}`
    );
  }

  async prepare() {
    // 检查缓存目录是否存在
    // fsExtra.mkdirSync(path.resolve(homedir(), ".zctools"));
    if (this.storeDir && !pathExistsSync(this.storeDir)) {
      mkdirsSync(this.storeDir);
    }
    // 获取最新版本
    if (this.packageVersion === "latest") {
      this.packageVersion = await this.npmRepoDetail.getLatestVersion();
    }
  }
  async exists() {
    if (this.storeDir) {
      await this.prepare();
      return pathExistsSync(this.cacheFilePath);
    } else {
      return pathExistsSync(this.targetPath);
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
    if (!pathExistsSync(latestFilePath)) {
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
  async getRootFilePath() {
    async function _getRootFile(targetPath) {
      const dir = await packageDirectory({ cwd: targetPath });
      if (dir) {
        const pkgFile = path.resolve(dir, "package.json");
        const pkg = fsExtra.readJSONSync(pkgFile);
        if (pkg && pkg.main) {
          return path.resolve(dir, pkg.main);
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
      `.store/${this.packageName.replace(
        "/",
        "+"
      )}@${packageVersion}/node_modules/${this.packageName}`
    );
  }
}

export default Package;

function mkdirsSync(dirname) {
  if (pathExistsSync(dirname)) {
    return true;
  } else {
    if (mkdirsSync(path.dirname(dirname))) {
      fsExtra.mkdirSync(dirname);
      return true;
    }
  }
}
